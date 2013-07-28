var jsdom   = require('jsdom');
var async   = require('async');
var http    = require('http');
var url     = require('url');

var scrapeProxies = function (next) {
  var addProxies = function(window, next) {
    window.$('td:contains(":")').toArray().forEach(function(td) {
      var text = window.$(td).text();
      var match = /^([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+)$/.exec(text);
      if (match) {
        proxies.push('http://'+text);
      }
    });
    next();
  };

  jsdom.env(
    'http://www.proxy-list.org/en/index.php',
    ["http://code.jquery.com/jquery.js"],
    function (errors, window) {
      addProxies(window, function() {
        var pages = window.$('a[href*="index.php?sp"]').toArray().map(function(a) { return a.href; });
        async.each(pages, function(page, next) {
          jsdom.env(
            page,
            ["http://code.jquery.com/jquery.js"],
            function (errors, window) {
              addProxies(window, next);
            });
        }, function() {
          next();
        });
      });
    });
};

var filterProxies = function(next) {
  var remaining = proxies.length;
  proxies.forEach(function(proxy) {
    var parsedUrl = url.parse(proxy);
    var weight = 1;
    var request = http.request({
      port: parseInt(parsedUrl.port),
      host: parsedUrl.hostname,
      path: 'http://www.google.com/',
      headers: {
        Host: "www.google.com"
      }
    }, function(res) {
      res.on('data', function() {
        validatedProxies.push(proxy);
        remaining -= weight;
        weight = 0;
        if (next && validatedProxies.length >= 30) {
          next();
          next = null;
        }
        request.abort();
      });
    });
    request.setTimeout(8000, function() {
      remaining -= weight;
      weight = 0;
      if (next && remaining == 0) {
        next();
        next = null;
      }
      request.abort();
    });
    request.on('error', function(error) {
      remaining -= weight;
      weight = 0;
      if (next && remaining == 0) {
        next();
        next = null;
      }
      request.abort();
    });
    request.end();
  });
};

var proxies = null;
var validatedProxies = null;
var waitingForProxies = false;

module.exports = function(next) {
  if (waitingForProxies || validatedProxies == null || validatedProxies.length == 0) {
    if (waitingForProxies || (validatedProxies != null && validatedProxies.length == 0)) {
      setTimeout(function() {
        module.exports(next);
      }, 10);
    } else {
      waitingForProxies = true;
      proxies = [];
      validatedProxies = [];
      scrapeProxies(function() {
        filterProxies(function() {
          waitingForProxies = false;
          module.exports(next);
        });
      });
    }
  } else {
    next(validatedProxies[Math.floor(Math.random()*validatedProxies.length)]);
  }
};
