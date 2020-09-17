import fs from 'fs'
import TemplateTransformer from './src/TemplateTransformer.js'
import _ from 'lodash'

if(process.argv.length !== 6) {
  console.error('Usage: bin/transformTemplate <source template.json> <API url> <true to replace dots> <true to add header>')
  process.exit(1)
}

const sourceTemplatePath = process.argv[2]
const apiUrl = process.argv[3]
const replaceDots = process.argv[4] === 'true'
const addHeaders = process.argv[5] === 'true'

const transformer = async () => {
  const sourceTemplateStr = fs.readFileSync(sourceTemplatePath).toString()
  const sourceTemplate = JSON.parse(sourceTemplateStr)
  const destTemplate = await new TemplateTransformer(apiUrl).transform(sourceTemplate)
  let output = destTemplate
  if(replaceDots) output = replaceInKeys(output, '.', '!')
  if(addHeaders) output = {
    id: sourceTemplate.id,
    uri: `${apiUrl}/resource/${sourceTemplate.id}`,
    user: "justinlittman",
    group: "ld4p",
    timestamp: new Date().toISOString(),
    templateId: "sinopia:template:resource",
    data: output
  }

  process.stdout.write(JSON.stringify(output, null, 2) + '\n')
}


const replaceInKeys = (obj, from, to) => {
  return _.cloneDeepWith(obj, function (cloneObj) {
    if (!_.isPlainObject(cloneObj)) return
    const newObj = {}
    _.keys(cloneObj).forEach((key) => {
      const newKey = key.replace(new RegExp(`\\${from}`, "g"), to)
      newObj[newKey] = replaceInKeys(cloneObj[key], from, to)
    })
    return newObj
  })
}

transformer()
  .catch((err) => console.error(err))
