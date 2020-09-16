import Crawler from './Crawler.js'
import TemplateTransformer from './TemplateTransformer.js'
import API from './API.js'
import UserMap from './UserMap.js'
import rdf from 'rdf-ext'
import { Readable } from 'stream'
import ParserJsonld from '@rdfjs/parser-jsonld'
import SerializerJsonld from '@rdfjs/serializer-jsonld-ext'
import concatStream from 'concat-stream'

export default class Migrator {
  constructor(platformUrl, apiUrl, userFile) {
    this.apiUrl = apiUrl
    this.crawler = new Crawler(platformUrl)
    this.api = new API()
    this.userMap = new UserMap(userFile)
    this.templateTransformer = new TemplateTransformer(apiUrl)
  }

  async migrate() {
    await this.crawler.crawl(async (resource, provenanceResource, uri, types) => {
      if (types.includes('http://www.w3.org/ns/ldp#NonRDFSource')) {
        const id = uri.match(/.*\/\/.*\/repository\/ld4p\/(.*)/)[1]
        const newUri = `${this.apiUrl}/resource/${id}`
        const provenanceDataset = await this.datasetFromJsonld(provenanceResource, uri, newUri)
        const [user, timestamp] = this.findProvenanceInfo(provenanceDataset, newUri)
        console.log(`${uri} -> template (as ${newUri})`)
        const destTemplate = await this.templateTransformer.transform(resource, newUri)
        const addlProps = {
          group: 'ld4p',
          types: ['http://sinopia.io/vocabulary/ResourceTemplate'],
          user,
          timestamp
        }
        await this.api.post(destTemplate, newUri, 'sinopia:template:resource', addlProps)
      } else {
        const [, group, id] = uri.match(/.*\/\/.*\/repository\/(.+)\/(.+)/)
        const newUri = `${this.apiUrl}/resource/${id}`
        console.log(`${uri} -> resource (as ${newUri})`)
        const dataset = await this.datasetFromJsonld(resource, uri, newUri)
        const provenanceDataset = await this.datasetFromJsonld(provenanceResource, uri, newUri)
        const [user, timestamp] = this.findProvenanceInfo(provenanceDataset, newUri)
        const templateId = this.findRootResourceTemplateId(newUri, dataset)
        const newJsonld = await this.jsonldFromDataset(dataset)
        const addlProps = this.findBfRefs(newUri, dataset)
        addlProps.group = group
        addlProps.types = this.findType(newUri, dataset)
        addlProps.user = user
        addlProps.timestamp = timestamp
        await this.api.post(newJsonld, newUri, templateId, addlProps)
      }
    })
  }

  datasetFromJsonld(jsonld, oldUri, newUri) {
    const parserJsonld = new ParserJsonld()

    const input = new Readable({
      read: () => {
        input.push(JSON.stringify(jsonld))
        input.push(null)
      }
    })

    const output = parserJsonld.import(input)
    const dataset = rdf.dataset()

    output.on('data', quad => {
      if(quad.subject.value === oldUri || quad.subject.value === ''){
        quad.subject = rdf.namedNode(newUri)
      } else {
        quad.subject = this.cleanTerm(quad.subject)
      }
      quad.object = this.cleanTerm(quad.object)

      dataset.add(quad)
    })

    return new Promise((resolve, reject) => {
      output.on('end', resolve)
      output.on('error', reject)
    })
      .then(() => {
        return dataset
      })
  }

  jsonldFromDataset(dataset) {
    const serializerJsonld = new SerializerJsonld({ expand: true })

    const output = serializerJsonld.import(dataset.toStream())

    return new Promise((resolve, reject) => {
      output.pipe(concatStream(content => resolve(content)))

      output.on('error', err => reject(err))
    })
  }

  findRootResourceTemplateId(resourceURI, dataset) {
    const rtQuads = dataset.match(rdf.namedNode(resourceURI), rdf.namedNode('http://sinopia.io/vocabulary/hasResourceTemplate')).toArray()
    if (rtQuads.length !== 1) {
      return null
    }
    return rtQuads[0].object.value
  }

  findType(resourceURI, dataset) {
    const quads = dataset.match(rdf.namedNode(resourceURI), rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')).toArray()
    return quads.map((quad) => quad.object.value)
  }

  findBfRefs(resourceURI, dataset) {
    return {
      bfAdminMetadataRefs: this.findBfRef(resourceURI, ['http://id.loc.gov/ontologies/bibframe/adminMetadata'], dataset),
      bfInstanceRefs: this.findBfRef(resourceURI, ['http://id.loc.gov/ontologies/bibframe/itemOf', 'http://id.loc.gov/ontologies/bibframe/hasInstance'], dataset),
      bfItemRefs: this.findBfRef(resourceURI, ['http://id.loc.gov/ontologies/bibframe/hasItem'], dataset),
      bfWorkRefs: this.findBfRef(resourceURI, ['http://id.loc.gov/ontologies/bibframe/instanceOf'], dataset),
    }
  }

  findBfRef(resourceURI, propertyURIs, dataset) {
    const uris = []
    propertyURIs.forEach((propertyURI) => {
      const quads = dataset.match(rdf.namedNode(resourceURI), rdf.namedNode(propertyURI)).toArray()
      quads.forEach((quad) => {
        if(quad.object.termType !== 'NamedNode') return
        const uri = quad.object.value
        if(uri) uris.push(uri)
      })
    })
    return uris
  }

  findProvenanceInfo(dataset, uri) {
    const generatedByQuads = dataset.match(rdf.namedNode(uri), rdf.namedNode('http://www.w3.org/ns/prov#wasGeneratedBy')).toArray()
    const provInfos = generatedByQuads.map((generatedByQuad) => {
      const associatedWith = dataset.match(generatedByQuad.object, rdf.namedNode('http://www.w3.org/ns/prov#wasAssociatedWith')).toArray()[0].object.value
      const atTime = dataset.match(generatedByQuad.object, rdf.namedNode('http://www.w3.org/ns/prov#atTime')).toArray()[0].object.value
      return { atTime, associatedWith }
    })
    provInfos.sort((a, b) => new Date(b.atTime) - new Date(a.atTime))
    const latestProvInfo = provInfos[0]
    const username = this.userMap.usernameFor(latestProvInfo.associatedWith)
    return [username, latestProvInfo.atTime]
  }

  cleanTerm(term) {
    if(term.termType !== 'NamedNode') return term
    const match = term.value.match(/^https?:\/\/trellis.*\.sinopia\.io\/repository\/.+\/(.+)/)
    if(!match) return term

    return rdf.namedNode(`${this.apiUrl}/resource/${match[1]}`)
  }
}
