import superagent from 'superagent'

export default class API {
  constructor() {
  }

  post(resource, postUri, newUri, templateId, addlProps) {
    const body = {data: resource, user: 'havram ', ...addlProps}
    if(postUri !== newUri) body.uri = newUri
    if(templateId) body.templateId = templateId
    superagent
      .post(postUri)
      .send(body)
      .set('accept', 'json')
      .then((res) =>{
        if(!res.ok) {
          console.error(`Post failed with ${res.status} for ${postUri}`)
          return
        }
        console.log(`Post succeeded`)
      })
      .catch((err) => console.error(`Post failed with ${err.message} for ${postUri}`))
  }
}
