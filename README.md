# grpc.client

a simple NodeJS client for gRPC


----
<a href="https://nodei.co/npm/grpc.client/"><img src="https://nodei.co/npm/grpc.client.png?downloads=true"></a>

[![Build Status](https://travis-ci.org/joaquimserafim/grpc.client.svg?branch=master)](https://travis-ci.org/joaquimserafim/grpc.client)[![Coverage Status](https://coveralls.io/repos/github/joaquimserafim/grpc.client/badge.svg)](https://coveralls.io/github/joaquimserafim/grpc.client)[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square)](https://github.com/joaquimserafim/grpc.client/blob/master/LICENSE)[![NodeJS](https://img.shields.io/badge/node-6.x.x-brightgreen.svg?style=flat-square)](https://github.com/joaquimserafim/grpc.client/blob/master/package.json#L46)

[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


### api
`const client = require('grpc.client')`

* **client(an optional {})**
  - **type** string, with the values `unary` and `stream`, `unary` is the default value
  - **address** string with the format `url:port`
  - **credentials** can use `credentials.createInsecure` or with certificates through an object { ca, key, client }
  - **metadata** set metadata that can be used in all calls, an array with { key: value }

**methods**
  * **service(service name - string, path to the protoFile - string)**
  * **setMetadata(plain js object)** to be used when needs to pass metadata to the server but the function doesn't send any data to the server
  * **end(err - Error object, res from the rpc server - depends of the proto/contract, metadata - plain js object)**

`grpc.client` will create dynamically the method or methods from the rpc methods list for a given service and protofile, check examples below

### example


```js
const client = require('grpc.client')

// proto file
/*
syntax = "proto3";

package helloWorld;

// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc sayHello (HelloRequest) returns (HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}
*/

client()
  .service('Greeter', protos.helloWorld)
  .sayHello({ name: 'Scaramouche' })
  .end((err, res, metadata) => {
    if (err) {
      // do something
    }

    console.log(res)// will print { message: 'Hello Scaramouche' }
  })

//
// creating a static client
//

const greeter = client({ metadata: { xp: 'to' } })

greeter
  .service('Greeter', protos.helloWorld)
  .sayHello({ name: 'Scaramouche' }, { 'request-id': 12345 })
  .end((err, res, metadata) => {
    if (err) {
      // do something
    }

    console.log(res)// will print { message: 'Hello Scaramouche' }
  })

// no data sends to the server

greeter
  .service('Greeter', protos.something)
  .something()
  .setMetadata({ 'request-id': 12345 })
  .end((err, res, metadata) => {
    //
  })

```


#### ISC License (ISC)
