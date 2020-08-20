import fs from 'fs'
import Migrator from './src/Migrator.js'

if(process.argv.length !== 5) {
  console.error('Usage: bin/migrate <Trellis url> <API post url> <true to retain original URI>')
  process.exit(1)
}

const platformUrl = process.argv[2]
const apiUrl = process.argv[3]
const retainUri = process.argv[4] === 'true'
const jwt = process.argv[5]

const migrator = async () => {
  await new Migrator(platformUrl, apiUrl, retainUri).migrate()
}

migrator()
  .catch((err) => console.error(err))
