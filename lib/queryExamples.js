module.exports = [
  {
    title:"Vocabularies contained in LOV and their prefix",
    query:"PREFIX vann:<http://purl.org/vocab/vann/>\nPREFIX voaf:<http://purl.org/vocommons/voaf#>\n\n### Vocabularies contained in LOV and their prefix\nSELECT DISTINCT ?vocabPrefix ?vocabURI {\n	GRAPH <http://lov.okfn.org/dataset/lov>{\n		?vocabURI a voaf:Vocabulary.\n		?vocabURI vann:preferredNamespacePrefix ?vocabPrefix.\n	}} ORDER BY ?vocabPrefix"
  },
  {
    title:"Vocabularies using a language other than English, sorted by language code",
    query:"PREFIX vann:<http://purl.org/vocab/vann/>\nPREFIX voaf:<http://purl.org/vocommons/voaf#>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\n### Vocabularies using a language other than English, sorted by language code\nSELECT DISTINCT ?code ?title ?vocab {\n	GRAPH <http://lov.okfn.org/dataset/lov>{\n		?vocab a voaf:Vocabulary.\n		?vocab dcterms:title ?title.\n		?vocab dcterms:language ?eng.\n		?vocab dcterms:language ?lang.\n		FILTER ( ?lang != ?eng )\n		FILTER ( CONTAINS (STR(?eng), 'eng') )\n		BIND(REPLACE(STR(?lang), 'http://www.lexvo.org/page/iso639-3/', '') AS ?code)\n	}}ORDER BY ?code ?title"
  },
  {
    title:"Vocabularies modified since 2014-01-01, sorted by modification date",
    query:"PREFIX voaf:<http://purl.org/vocommons/voaf#>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\n### Vocabularies modified since 2014-01-01, sorted by modification date\nSELECT DISTINCT ?date ?title ?vocab {\n	GRAPH <http://lov.okfn.org/dataset/lov>{\n		?vocab a voaf:Vocabulary.\n		?vocab dcterms:title ?title.\n		?vocab dcterms:modified ?modified.\n		FILTER ( STR(?modified) > '2014')\n		BIND (STR(?modified) as ?date )\n	}} ORDER BY DESC(?date) ?title"
  },
  {
    title:"Properties with domain foaf:Person outside FOAF, sorted by vocabulary",
    query:"PREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n\n### Properties with domain foaf:Person outside FOAF, sorted by vocabulary\nSELECT DISTINCT ?vocab ?pLabel ?pURI {\n	GRAPH ?g {\n		?pURI rdfs:isDefinedBy ?vocab.\n		?pURI rdfs:domain foaf:Person.\n		?pURI rdfs:label ?pLabel.\n		FILTER (?vocab != foaf:)\n	}} ORDER BY ?vocab ?pLabel"
  },
  {
    title:"SKOS properties used in vocabularies to describe classes",
    query:"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\nPREFIX owl: <http://www.w3.org/2002/07/owl#>\n\n### SKOS properties used in vocabularies to describe classes\nSELECT DISTINCT ?p ?vocab {\n	GRAPH ?g {\n		?x rdfs:isDefinedBy ?vocab.\n		{?x a owl:Class}\n		UNION\n		{?x a rdfs:Class}.\n		?x ?p ?y.\n		FILTER (CONTAINS(STR(?p), STR(skos:)))\n	}} ORDER BY ?p ?vocab"
  }
]