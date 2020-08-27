import fs from 'fs'
import _ from 'lodash'

export default class UserMap {
  constructor(userFile) {
    this.userMap = {}
    JSON.parse(fs.readFileSync(userFile)).forEach((user) => {
      user['Attributes'].forEach((attr) => {
        if(attr['Name'] === 'sub') this.userMap[attr['Value']] = user['Username']
      })
    })
  }

  usernameFor(userKey) {
    // Get last section of userKey
    const key = _.last(userKey.split('/'))
    return this.userMap[key] || 'unknown'
  }
}
