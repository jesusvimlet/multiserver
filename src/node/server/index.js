var express = require("express");
var path = require("path");
var querySelectorAll = require('query-selector');
var serveIndex = require('serve-index');

var nextEmptyPort = 8081;
var servers = {};

exports.myIp;
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  exports.myIp = add;
});

exports.launchServer = function(serverBlock) {
  if (servers["" + serverBlock.port]) {
    servers["" + serverBlock.port].close(function () {
      createServer(serverBlock);
    });
  } else {
    createServer(serverBlock);
  }
}

function createServer(serverBlock) {

  serverBlock.status("loading");
  url = serverBlock.src || "";
  var app = express();

  app.use(
    express.static(path.resolve(url)),
    function (req, res, next) {
      next();
    }, function (req, res, next) {      
      var index = serveIndex(path.resolve(url), {
        'icons': true,
        'view': 'details'
      });
      index(req, res, next);
    });

    
  setTimeout(function () {
    serverBlock.status("running");
    serverBlock.setIframe();
  }, 100);
  var server = app.listen(serverBlock.port, function () {
    var host = server.address().address;
    var port = server.address().port;
  });

  servers["" + serverBlock.port] = server;

  // Store connections to force shutdown on stop
  servers["" + serverBlock.port].activeConnections = {};
  servers["" + serverBlock.port].on('connection', function (conn) {
    var key = conn.remoteAddress + ':' + conn.remotePort;
    servers["" + serverBlock.port].activeConnections[key] = conn;
  });
}

exports.killServer = function(serverBlock) {
  if (servers["" + serverBlock.port]) {
    serverBlock.status("loading");

    servers["" + serverBlock.port].close(function () {
      deleteServer("" + serverBlock.port);
      serverBlock.status("off"); // TODO Doesnt fire until browser is open
    });

    // Remove active connections to force shutdown
    for (var key in servers["" + serverBlock.port].activeConnections) {
      if (servers["" + serverBlock.port].activeConnections[key]) {
        servers["" + serverBlock.port].activeConnections[key].destroy();
      }
    }
    serverBlock.setIframe();

  }
}


exports.removeServer = function(serverBlock) {
  if (servers["" + serverBlock.port]) {
    servers["" + serverBlock.port].close(function () {
      deleteServer("" + serverBlock.port);
      serverBlock.parentElement.removeChild(serverBlock);
    });

    // Remove active connections to force shutdown
    for (var key in servers["" + serverBlock.port].activeConnections) {
      if (servers["" + serverBlock.port].activeConnections[key]) {
        servers["" + serverBlock.port].activeConnections[key].destroy();
      }
    }
    serverBlock.setIframe();
  } else {
    serverBlock.parentElement.removeChild(serverBlock);
  }
}

function deleteServer(port) {
  delete servers[port];
}
