generateGraph = function(svgId, json){
  // Create the input graph
  var g = new dagreD3.Digraph();

  // Here we're setting nodeclass, which is used by our custom drawNodes function
  // below.
  /*"convexSetEdges":[{"source":"<http://lsdis.cs.uga.edu/projects/semdis/opus#year>","target":"<http://xmlns.com/foaf/0.1/Document>","label":"domain"},{"source":"<http://schema.org/publisher>","target":"<http://schema.org/CreativeWork>","label":"default"},{"source":"<http://xmlns.com/foaf/0.1/Document>","target":"<http://schema.org/CreativeWork>","label":"equivalentClass"},{"source":"<http://xmlns.com/foaf/0.1/Document>","target":"<http://sw-portal.deri.org/ontologies/swportal#Publication>","label":"subClassOf"},{"source":"<http://sw-portal.deri.org/ontologies/swportal#hasTitle>","target":"<http://sw-portal.deri.org/ontologies/swportal#Publication>","label":"domain"},{"source":"<http://swrc.ontoware.org/ontology#Journal>","target":"<http://xmlns.com/foaf/0.1/Document>","label":"coOccur"}]
}*/
  for (i=0; i<json.convexSetVertices.length; ++i){
    var vertex = json.convexSetVertices[i];
    g.addNode(i,  { label: (vertex.prefixedName!=undefined?vertex.prefixedName:escape(vertex.uri)), nodeclass: 'type-'+vertex.type+(vertex.matchingKeyword!=undefined?' matchingKeyword':'' ) });
  }
  for (i=0; i<json.convexSetEdges.length; ++i){
    var edge = json.convexSetEdges[i];
    var vertexSource, vertexTarget;
    for (j=0; j<json.convexSetVertices.length; ++j){
      if(edge.source==json.convexSetVertices[j].uri)vertexSource=j;
      if(edge.target==json.convexSetVertices[j].uri)vertexTarget=j;
    }
    g.addEdge(null, vertexSource, vertexTarget, { label: edge.uri});
  }
  /*g.addNode(0,  { label: 'schema:publisher',       nodeclass: 'type-TK ' });
  g.addNode(1,  { label: 'schema:CreativeWork',         nodeclass: 'type-S' });
  g.addNode(2,  { label: 'foaf:Document',        nodeclass: 'type-NP' });
  g.addNode(3,  { label: 'swpo:Publication',        nodeclass: 'type-NP' });
  g.addNode(4,  { label: 'swpo:hasTitle',        nodeclass: 'type-TK' });
  g.addNode(5,  { label: 'opus:Publication',        nodeclass: 'type-NP' });
  g.addNode(6,  { label: 'swrc:Publication',        nodeclass: 'type-NP' });
  g.addNode(7,  { label: 'swrc:Journal',        nodeclass: 'type-TK' });
  g.addNode(8,  { label: 'opus:year',        nodeclass: 'type-TK' });

  // Set up edges, no special attributes.
  g.addEdge(null, 0, 1, { label: "default"});
  g.addEdge(null, 1, 2, { label: "owl:equivalentClass" });
  g.addEdge(null, 3, 2, { label: "rdfs:subClassOf" });
  g.addEdge(null, 4, 3, { label: "rdfs:domain" });
  g.addEdge(null, 5, 2, { label: "rdfs:subClassOf" });
  g.addEdge(null, 5, 3, { label: "owl:equivalentClass" });
  g.addEdge(null, 6, 5, { label: "owl:equivalentClass" });
  g.addEdge(null, 7, 6, { label: "rdfs:subClassOf" });
  g.addEdge(null, 8, 2, { label: "rdfs:domain" });*/

  // Create the renderer
  var renderer = new dagreD3.Renderer();

  // Override drawNodes to add nodeclass as a class to each node in the output
  // graph.
  var oldDrawNodes = renderer.drawNodes();
  renderer.drawNodes(function(graph, root) {
    var svgNodes = oldDrawNodes(graph, root);
    svgNodes.each(function(u) { d3.select(this).classed(graph.node(u).nodeclass, true); });
    //special style for the nodes matching keywords
    svgNodes.each(function(u) { 
      if(graph.node(u).nodeclass.indexOf("matchingKeyword") > -1){
        d3.select(this).selectAll('rect')
          .style("fill", '#ffbb78')
          .style("stroke", '#666666');
        }
        
    });
    return svgNodes;
  });

  // Disable pan and zoom
  renderer.zoom(false);

  // Set up an SVG group so that we can translate the final graph.
  var svg = d3.select('svg#'+svgId),
      svgGroup = svg.append('g');

  // Run the renderer. This is what draws the final graph.
  var layout = renderer.run(g, d3.select('svg#'+svgId+' g'));

  // Center the graph
  var xCenterOffset = (svg.attr('width') - layout.graph().width) / 2;
  svgGroup.attr('transform', 'translate(' + xCenterOffset + ', 20)');
  svg.attr('height', layout.graph().height + 5);
}