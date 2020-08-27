# Sinopia Migration

Tools for migrating Sinopia:
* From Trellis to Mongo for persistence.
* From JSON-based resource templates to RDF-based resource templates.

For migration instructions see [this doc](https://docs.google.com/document/d/10rtPjkuTuRw8mQEMAnAo6nxkv60Hz66N-K7cLq63IH0/edit?usp=sharing).

## Convert resource template
Usage:
```
bin/transformTemplate <source template.json> <API url> <true to replace dots> <true to add header>
```
For example:
```
bin/transformTemplate json_templates/rt_uri.json http://localhost:3000/repository true true
```

## Load Mongo from Trellis
Prerequisite:
Retrieve a user backup file from the environment appropriate `sinopia-cognito` S3 bucket.

Usage:
```
bin/migrate <Trellis url> <API post url> <user file> <true to retain original URI>
```
For example:
```
bin/migrate https://trellis.development.sinopia.io user-backup_dev.json http://localhost:3000/repository false
```

Note: Set retain original URI to `true` when migrating a specific environment. Set to `false` when copying from one environment to another, e.g., from AWS development to local development.
