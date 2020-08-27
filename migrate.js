import fs from 'fs'
import Migrator from './src/Migrator.js'

if(process.argv.length !== 6) {
  console.error('Usage: bin/migrate <Trellis url> <API post url> <user file> <true to retain original URI>')
  process.exit(1)
}

const platformUrl = process.argv[2]
const apiUrl = process.argv[3]
const userFile = process.argv[4]
const retainUri = process.argv[5] === 'true'

const migrator = async () => {
  await new Migrator(platformUrl, apiUrl, userFile, retainUri).migrate()
}

migrator()
  .catch((err) => console.error(err))
