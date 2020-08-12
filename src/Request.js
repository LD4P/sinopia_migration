import superagent from 'superagent'

export default class Request {
  /**
   * @param {string} uri - URI to make request to
   * @param {string} typeURIs = LDP type URIs
   */
  constructor(uri, typeURIs) {
    this.uri = uri
    this.agent = superagent.get(this.uri)
      // .set('prefer', 'return=representation; include="http://www.trellisldp.org/ns/trellis#PreferAudit"')
    if (typeURIs) {
      this.agent = this.agent.accept(this.mimeTypeFrom(typeURIs))
    }
  }

  /**
   * Make HTTP request
   * @returns {Promise} Promise containing response body & headers
   */
  response() {
    return this.agent
      .then(response => {
        return {
          body: response.body,
          headers: response.headers
        }
      })
      .catch(err => {
        console.error(`error resolving ${this.uri}: ${err.message}`, err)
        return null
      })
  }

  /**
   * Returns MIME type given LDP resource types
   * @param {Array} types - LDP type URIs of object
   * @returns {string} MIME type
   */
  mimeTypeFrom(types) {
    if (types.includes('http://www.w3.org/ns/ldp#NonRDFSource'))
      return 'application/json'
    return 'application/ld+json'
  }
}
