import LegacyTemplatesBuilder from './LegacyTemplatesBuilder.js'
import TemplatesToResourceBuilder from './TemplatesToResourceBuilder.js'
import GraphBuilder from './GraphBuilder.js'
import SerializerJsonld from '@rdfjs/serializer-jsonld-ext'
import concatStream from 'concat-stream'

export default class TemplateTransformer {
  constructor(apiUrl) {
    this.apiUrl = apiUrl
  }

  async transform(resourceTemplate, uri) {
    // Load the subject template from JSON.
    const subjectTemplate = new LegacyTemplatesBuilder(resourceTemplate).build()
    // Transform to a resource model for a resource template.
    const resource = new TemplatesToResourceBuilder(subjectTemplate).build()
    // Build a graph from resource.
    const graph = new GraphBuilder(resource, uri || `${this.apiUrl}/${subjectTemplate.id}`).graph
    // Transform the graph to jsonld
    return this.jsonldFromGraph(graph)
  }

  async jsonldFromGraph(graph) {
    const serializerJsonld = new SerializerJsonld({ expand: true })

    const output = serializerJsonld.import(graph.toStream())

    return new Promise((resolve, reject) => {
      output.pipe(concatStream(content => resolve(content)))
      output.on('error', err => reject(err))
    })
  }
}
