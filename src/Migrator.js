import Crawler from './Crawler.js'
import TemplateTransformer from './TemplateTransformer.js'
import API from './API.js'
import rdf from 'rdf-ext'
import { Readable } from 'stream'
import ParserJsonld from '@rdfjs/parser-jsonld'
import SerializerJsonld from '@rdfjs/serializer-jsonld-ext'
import concatStream from 'concat-stream'


export default class Migrator {
  constructor(platformUrl, apiUrl, retainUri) {
    this.apiUrl = apiUrl
    this.crawler = new Crawler(platformUrl)
    this.api = new API()
    this.templateTransformer = new TemplateTransformer(apiUrl)
    this.retainUri = retainUri
  }

  async migrate() {
    await this.crawler.crawl(async (resource, uri, types) => {
      if (types.includes('http://www.w3.org/ns/ldp#BasicContainer')) return
      if (types.includes('http://www.w3.org/ns/ldp#NonRDFSource')) {
        // The original URI for templates will be modified, even if retaining.
        // For example, https://trellis.development.sinopia.io/repository/ld4p/ld4p:RT:bf2:Monograph:Item:Un-nested
        // will become https://trellis.development.sinopia.io/repository/ld4p:RT:bf2:Monograph:Item:Un-nested
        const id = uri.match(/.*\/\/.*\/repository\/ld4p\/(.*)/)[1]
        const postUri = `${this.apiUrl}/${id}`
        const newUri = this.retainUri ? uri : postUri
        console.log(`${uri} -> template (as ${newUri})`)
        const destTemplate = await this.templateTransformer.transform(resource, newUri)
        await this.api.post(destTemplate, postUri, newUri, 'sinopia:template:resource', {group: 'ld4p', types: ['http://sinopia.io/vocabulary/ResourceTemplate']})
      } else {
        const id = uri.match(/.*\/\/.*\/repository\/(.*)/)[1]
        const postUri = `${this.apiUrl}/${id}`
        const newUri = this.retainUri ? uri : postUri
        const group = id.split('/')[0]
        console.log(`${uri} -> resource (as ${newUri})`)
        const dataset = await this.datasetFromJsonld(resource, uri, newUri)
        const templateId = this.findRootResourceTemplateId(newUri, dataset)
        const newJsonld = await this.jsonldFromDataset(dataset)
        const addlProps = this.findBfRefs(newUri, dataset)
        addlProps.group = group
        addlProps.types = this.findType(newUri, dataset)
        await this.api.post(newJsonld, postUri, newUri, templateId, addlProps)
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
      if(quad.subject.value === oldUri || quad.subject.value === '') quad.subject = rdf.namedNode(newUri)
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
        const uri = quad.object.value
        if(!uri) return
        const id = uri.match(/.*\/\/.*\/repository\/(.*)/)[1]
        const newUri = `${this.apiUrl}/${id}`
        uris.push(this.retainUri ? uri : newUri)
      })
    })
    return uris
  }
}
