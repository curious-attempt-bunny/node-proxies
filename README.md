=== Introduction

Use this package if you want to make use of freely available HTTP proxy servers online.

=== Installation

    npm install --save proxies

=== Usage

    var proxies = require('proxies');
    var request = require('request');

    proxies(function(aRandomProxyUrl) {
      request.get({url: "http://www.google.com", proxy: aRandomProxyUrl}, function(error, response, body) {
        // ...
      });
    });

=== Notes

The list of proxies is obtained from www.proxy-list.org. All proxies are validated before being made available for use. When the function is first called it will load the list of proxies, and delay calling back with a proxy until at least 30 proxies are validated. Each time the function is called a random proxy is returned.

=== License

MIT
