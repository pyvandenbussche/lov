# Linked Open Vocabularies (LOV) - frontEnd

This is the [Linked Open Vocabularies (LOV) application code repository](http://lov.okfn.org/dataset/lov/). LOV provides a choice of several hundreds of such vocabularies, based on quality requirements including URI stability and availability on the Web, use of standard formats and publication best practices, quality metadata and documentation, identifiable and trustable publication body, proper versioning policy.

LOV uses [lovScripts](https://github.com/pyvandenbussche/lovScripts) for backoffice scripts such as the aggregator and other scripts.

The live instance of LOV is available at the following URL: [http://lov.okfn.org/dataset/lov/](http://lov.okfn.org/dataset/lov/)

## Install

**NOTE:** You need to have node.js, mongodb and elasticsearch installed and running.

```sh
  $ git clone git://github.com/pyvandenbussche/lov.git
  $ npm install
  $ cp config/config.example.js config/config.js
  $ npm start
```

**NOTE:** Do not forget to update the various configuration fields in `config/config.js`.
`db` points to your mongodb database e.g. `mongodb://localhost/lov`
`es` and `elasticsearch` (used by two different node modules to connect to elasticsearch) point to your elastic search instance
`email.auth` is used to send email notification to administrators for curation of the database

You need to populate the database with certain files if you want to be able to use the edition.
For that use the files in the folder /setup



Then visit [http://localhost:3000/](http://localhost:3000/)
```
  $ mongoimport -d lov -c agents --file .\agents.json
  $ mongoimport -d lov -c languages --file .\languages.json
  $ mongoimport -d lov -c stattags --file .\stattags.json
```

## Directory structure
```
-app/
  |__controllers/
  |__models/
  |__mailer/
  |__views/
-config/
  |__routes.js
  |__config.js
  |__passport.js (auth config)
  |__express.js (express.js configs)
  |__middlewares/ (custom middlewares)
-lib/
-public/
```

## License
 LOV code and dataset are licensed under a [Creative Commons Attribution 4.0 International License]( https://creativecommons.org/licenses/by/4.0/).
