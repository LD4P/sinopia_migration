# Sinopia Migration

Tools for migrating Sinopia:
* From Trellis to Mongo for persistence.
* From JSON-based resource templates to RDF-based resource templates.

## Convert resource template
Usage:
```
bin/transformTemplate <source template.json> <API url>
```
For example:
```
bin/transformTemplate ../sinopia_editor/__tests__/__template_fixtures__/DiscogsLookup.json http://localhost:3000/repository
```

## Load Mongo from Trellis
Usage:
```
bin/migrate <Trellis url> <API post url> <true to retain original URI> <jwt>
```
For example:
```
bin/migrate https://trellis.development.sinopia.io http://localhost:3000/repository false eyJraWQiOiJyVDUwbnpEREVGOFJMWHJacTAzb0E2WW82NVBHdjFaQ3ZRWlBsdEE0Sm1vPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0NDlmMDAzYi0xOWQxLTQ4YjUtYWVjYi1i3NGY0N2ZiYjdkYzgiLCJldmVudF9pZCI6ImVjMmIwODEyLWE2MTctNDRmNy04ODk3LWJjZTUwNWE2YzFlNyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1OTcyMzg1ODUsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy13ZXN0LTIuYW1hem9u5YXdzLmNvbVwvdXMtd2VzdC0yX0NHZDlXcTEzNiIsImV4cCI6MTU5NzI0MjE4NSwiaWF0IjoxNTk3MjM4NTg1LCJqdGkiOiIyZTA1MzFkOS1iMmE0LTRmNWUtOThkMy03Mc5MWRlNGI5ZDgiLCJjbGllbnRfaWQiOiIydTZzN3Bxa2MxZ3JxMXFzNDY0ZnNpODJhdCIsInVzZXJuYW1lIjoiamxpdHRtYW4ifQ.S5VBQmuoj8s_z0_iVrcuDOjkVPQrSAbd2d2oFfXGgO4pUd6KzcPad5dmkUh_NvwJI-G9WPHZWrUTxD4OmsGJKdnQ1TW-EDjuyEHQnaP3sOqSPEY6k3GEaIWQkJPc8Rp7Bm1unxUBwtCTrHZTUJ6Ip-reqGgp85GLDGpmSSwehuf-cnH2kArwn-9vsz0srx2su_gSbYM0PIYijb78iZEhQJEC5KdXrL0U0YNoEuBYuJImLdEtCwBoyFZJAeShPEf8G6Y0GIAEexK1iIzxDhFGPcbefAJpgeMHBZxY6Oh-Otlk7prCC9kcIS1By-WQTa7YzTsiR15T6KhJ2PY0880YdA
```

Note: Set retain original URI to `true` when migrating a specific environment. Set to `false` when copying from one environment to another, e.g., from AWS development to local development.
