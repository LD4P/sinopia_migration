# Sinopia Migration

Tools for migrating Sinopia:
* From Trellis to Mongo for persistence.
* From JSON-based resource templates to RDF-based resource templates.

For migration instructions see [this doc](https://docs.google.com/document/d/10rtPjkuTuRw8mQEMAnAo6nxkv60Hz66N-K7cLq63IH0/edit?usp=sharing).

Note: This requires Node version >= 14.11.x

## Convert resource template
Usage:
```
bin/transformTemplate <source template.json> <API url> <true to replace dots> <true to add header>
```
For example:
```
bin/transformTemplate json_templates/rt_uri.json http://localhost:3000 true true
```

## Load Mongo from Trellis

### Prerequisite

Retrieve a user backup file from the environment appropriate `sinopia-cognito` S3 bucket and place it in the `sinopia_migration` directory.

### Usage

```
bin/migrate <Trellis url> <API post url> <user file>
```

For example:

```
bin/migrate https://trellis.development.sinopia.io/repository http://localhost:3000 user-backup_dev.json
```

### OSX-specific note

If your MacOSX-based machine is sleeping and you want to prevent it during this operation, install `caffeinate` via `npm` and invoke the migration command like so:

```
caffeinate -i bin/migrate https://trellis.development.sinopia.io/repository http://localhost:3000 user-backup_dev.json
```
