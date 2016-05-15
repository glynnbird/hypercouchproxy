var express = require('express'),
  compression = require('compression')
  request = require('request'),
  app = express(),
  COUCH_URL = process.env.COUCH_URL || "http://localhost:5984",
  jsonish = ["application/json","text/plain"],
  port = require('cfenv').getAppEnv().port;

app.use(compression());

var proxy = function(req, res, db, links, path) {
  console.log(path);
  request.get(COUCH_URL + path, function(e,r,body) {
    if (jsonish.indexOf(req.headers['content-type']) >= -1) {
      res.writeHead(res.statusCode, { "Content-type": "application/hal+json "} );
      var body = JSON.parse(body);
      if (links) {
        body["_links"] = links;
      }      
      if (body.rows) {
        body._embedded = body.rows;
        delete body.rows;
        for (var i in body._embedded) {
          body._embedded[i]._links = { self: { "href": '/' + db + '/' +  body._embedded[i].id }};
        }
      }
      body = JSON.stringify(body);
      res.end(body); 
    } else {
      res.status(res.statusCode).end(body);
    }
  });
}

app.get('/', function(req, res) {
  var links =  {
    self: { href: req.url },
    index: { href: "/_all_dbs" }    
  };
  proxy(req, res, null, links, req.url);
});

app.get('/:db', function(req, res) {
  var links =  {
    self: { href: req.url },
    index: { href: "/" + req.params.db + "/_all_docs" }
  };
  proxy(req, res, req.params.db, links, req.url);
});

app.get('/:db/_all_docs', function(req, res) {
  var links =  {
    self: { href: req.url },
    index: { href: "/" + req.params.db  }
  };
  proxy(req, res, req.params.db, links, req.url);
});

app.get('/:db/:doc', function(req, res) {
  var links =  {
    self: { href: req.url },
    index: { href: "/" + req.params.db + "/_all_docs" },
    collection: { href: "/" + req.params.db }
  };
  proxy(req, res, req.params.db, links, req.url);
});

app.listen(port, function () {
  console.log('Example app listening on port', port);
});