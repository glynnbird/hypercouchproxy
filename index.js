var express = require('express');
var request = require('request');
var app = express();
var COUCH_URL = process.env.COUCH_URL || "http://localhost:5984";
var jsonish = ["application/json","text/plain"];

console.log("COUCH_URL", COUCH_URL);

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
  //req.pipe(request(COUCH_URL + path)).pipe(res)
}

// respond with "hello world" when a GET request is made to the homepage
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


var port = require('cfenv').getAppEnv().port;
app.listen(port, function () {
  console.log('Example app listening on port', port);
});