import fs from 'fs'
import TemplateTransformer from './src/TemplateTransformer.js'

if(process.argv.length !== 4) {
  console.error('Usage: bin/transformTemplate <source template.json> <API url>')
  process.exit(1)
}

const sourceTemplatePath = process.argv[2]
const apiUrl = process.argv[3]

const transformer = async () => {
  const sourceTemplate = fs.readFileSync(sourceTemplatePath).toString()
  const destTemplate = await new TemplateTransformer(apiUrl).transform(JSON.parse(sourceTemplate))
  process.stdout.write(JSON.stringify(destTemplate, null, 2) + '\n')
}

transformer()
  .catch((err) => console.error(err))
