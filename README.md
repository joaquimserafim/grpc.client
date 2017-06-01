# grpc.client

a simple client for gRPC

----
<a href="https://nodei.co/npm/grpc.client/"><img src="https://nodei.co/npm/grpc.client.png?downloads=true"></a>

[![Build Status](https://travis-ci.org/joaquimserafim/grpc.client.svg?branch=master)](https://travis-ci.org/joaquimserafim/grpc.client)[![Coverage Status](https://coveralls.io/repos/github/joaquimserafim/grpc.client/badge.svg)](https://coveralls.io/github/joaquimserafim/grpc.client)[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square)](https://github.com/joaquimserafim/grpc.client/blob/master/LICENSE)[![NodeJS](https://img.shields.io/badge/node-6.x.x-brightgreen.svg?style=flat-square)](https://github.com/joaquimserafim/grpc.client/blob/master/package.json#L46)

[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


### api
`const client = require('grpc.client')`

* **client(an optional {})**
  - **address** string with the format `url:port`
  - **creedentials** can use `credentials.createInsecure` or with certificates through an object { ca, key, client }
  - **metadata** set metadata that can be used in all calls, an array with { key: value }

**methods**
  * **service(service name - string, path to the protoFile - string)**
  * **end(err - Error object, res from the rpc server - plain js object)**

`grpc.client` will create dynamically the method or methods from the rpc methods list for a given service and protofile, check examples below

### example


```js
const client = require('grpc.client')

client()
  .service('Greeter', protos.helloWorld)
  .sayHello({ name: 'Scaramouche' })
  .end((err, res) => {
    if (err) {
      // do something
    }

    console.log(res)// will print { message: 'Hello Scaramouche' }
  })

//
//
//

const greeter = client({ metadata: ['request-id': 12345] })

greeter
  .service('Greeter', protos.helloWorld)
  .sayHello({ name: 'Scaramouche' }, [{ 'device': 123 }])
  .end((err, res) => {
    if (err) {
      // do something
    }

    console.log(res)// will print { message: 'Hello Scaramouche' }
  })

```


#### ISC License (ISC)
