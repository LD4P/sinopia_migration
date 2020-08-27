import superagent from 'superagent'

export default class Request {
  /**
   * @param {string} uri - URI to make request to
   * @param {string} typeURIs = LDP type URIs
   */
  constructor(uri, types, provenance) {
    this.uri = uri
    if (!types) {
      this.agent = superagent.get(this.uri)
    } else if (types.includes('http://www.w3.org/ns/ldp#NonRDFSource')) {
      if(provenance) {
        this.agent = superagent.get(`${this.uri}?ext=description`)
          .accept('application/ld+json')
          .set('prefer', 'return=representation; include="http://www.trellisldp.org/ns/trellis#PreferAudit"')
      } else {
        this.agent = superagent.get(this.uri)
          .accept('application/json')
      }
    } else {
      this.agent = superagent.get(this.uri)
        .accept('application/ld+json')
      if(provenance) {
        this.agent = this.agent.set('prefer', 'return=representation; include="http://www.trellisldp.org/ns/trellis#PreferAudit"')
      }
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
}
