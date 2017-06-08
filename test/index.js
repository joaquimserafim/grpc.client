/*
eslint
no-multi-spaces: ["error", {exceptions: {"VariableDeclarator": true}}]
padded-blocks: ["error", {"classes": "always"}]
max-len: ["error", 80]
*/
'use strict'

const { describe, it, before, after } = require('mocha')
const server      = require('grpc.server')
const { expect }  = require('chai')
const omit        = require('omit.keys')

const client = require('../')

const certificates = require('./create-certificates')

var rpcServer

var clientCertificates = {}

const protos = {
  helloWorld: 'test/protos/hello-world.proto',
  helloWorldStream: 'test/protos/hello-world-stream.proto'
}

const services = [
  {
    proto: protos.helloWorld,
    package: 'helloWorld',
    name: 'Greeter',
    methods: { sayHello: sayHello }
  },
  {
    proto: protos.helloWorldStream,
    package: 'helloWorldStream',
    name: 'Greeter',
    methods: { sayHelloStream: sayHelloStream }
  }
]

function sayHello (call, cb) {
  cb(null, { message: 'Hello ' + call.request.name })
}

function sayHelloStream (call) {
  addMetadata(getClientMetadata(call.metadata), call.status.metadata)
  call.write(bigFile)
  call.end()

  function getClientMetadata (metadata) {
    return omit(metadata.getMap(), 'user-agent')
  }

  function addMetadata (metaObject, metadata) {
    for (let key in metaObject) {
      metadata.set(key, metaObject[key])
    }
  }
}

var bigFile = null

describe('gRPC client', () => {

  describe('functional test', () => {
    before((done) => {
      rpcServer = server()
      rpcServer.addServices(services)

      rpcServer.start(done)
    })

    after((done) => {
      rpcServer.stop(() => {
        rpcServer = null
        done()
      })
    })

    it('should throw an error when using a non string on the service name',
      (done) => {
        var res  = () => {
          client()
            .service(null, protos.helloWorld)
            .sayHello({ name: 'Scaramouche' })
            .end((err, res) => {
              expect(err).to.be.deep.equal(null)
              expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
              done()
            })
        }

        expect(res).to.throw(/service name is mandatory/)
        done()
      }
    )

    it('should throw an error when using the wrong service name',
      (done) => {
        var res  = () => {
          client()
            .service('Greetera', protos.helloWorld)
            .sayHello({ name: 'Scaramouche' })
            .end((err, res) => {
              expect(err).to.be.deep.equal(null)
              expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
              done()
            })
        }

        expect(res).to.throw('Proto[pkg][service] is not a constructor')
        done()
      }
    )

    it('should throw an error when using a bad proto file',
      (done) => {
        var res  = () => {
          client()
            .service('Greeter', 'asasas')
            .sayHello({ name: 'Scaramouche' })
            .end((err, res) => {
              expect(err).to.be.deep.equal(null)
              expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
              done()
            })
        }

        expect(res).to.throw('Cannot read property \'ns\' of null')
        done()
      }
    )

    it('should do a rpc call successful', (done) => {
      client()
        .service('Greeter', protos.helloWorld)
        .sayHello({ name: 'Scaramouche' })
        .end((err, res) => {
          expect(err).to.be.deep.equal(null)
          expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
          done()
        })
    })

    it('should do a rpc call successful when assigning the main object to a' +
    ' varibale, i.e., not calling directly',
      (done) => {
        const greeter = client()

        greeter
          .service('Greeter', protos.helloWorld)
          .sayHello({ name: 'Scaramouche' })
          .end((err, res) => {
            expect(err).to.be.deep.equal(null)
            expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
            done()
          })
      }
    )

    it('should do a rpc call successful passing metadata on the constructor',
      (done) => {
        client({metadata: { 'request-id': 12345 }})
          .service('Greeter', protos.helloWorld)
          .sayHello({ name: 'Scaramouche' }, [{ 'device-id': 'yay!!!' }])
          .end((err, res) => {
            expect(err).to.be.deep.equal(null)
            expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
            done()
          })
      }
    )

    it('should do a rpc call successful passing metadata with the function',
      (done) => {
        client({metadata: { 'request-id': 12345 }})
          .service('Greeter', protos.helloWorld)
          .sayHello({ name: 'Scaramouche' }, { 'request-id': 123456 })
          .end((err, res) => {
            expect(err).to.be.deep.equal(null)
            expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
            done()
          })
      }
    )

    it('should wrok fine when passing undefined data to `setMetadata`',
      (done) => {
        client()
          .service('Greeter', protos.helloWorld)
          .sayHello({ name: 'Scaramouche' })
          .setMetadata()
          .end((err, res) => {
            expect(err).to.be.deep.equal(null)
            expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
            done()
          })
      }
    )
  })

  describe('testing the authenticted ssl/tls client', () => {
    before((done) => {

      certificates(serverStart)

      function serverStart (_, pem) {

        rpcServer = server(
          {
            address: '127.0.0.1:50052',
            creedentials: {
              ca: pem.certificate,
              server: pem.certificate,
              key: pem.privateKey
            }
          }
        )

        rpcServer.addServices(services)

        // CA to be used by the client
        clientCertificates.ca = pem.certificate

        rpcServer.start(() => {
          // get client certificates
          certificates(getClientCertificates)
        })
      }

      function getClientCertificates (_, pem) {
        clientCertificates.key = pem.privateKey
        clientCertificates.client = pem.certificate

        done()
      }
    })

    after((done) => {
      rpcServer.stop(() => {
        rpcServer = null
        done()
      })
    })

    it('should emit an error when the certificates are missed', (done) => {
      client({address: '127.0.0.1:50052', creedentials: null})
        .service('Greeter', protos.helloWorld)
        .sayHello({ name: 'Scaramouche' })
        .end((err, res) => {
          expect(err.message).to.be.deep.equal('Endpoint read failed')
          expect(res).to.be.deep.equal(undefined)
          done()
        })
    })

    it('should do a rpc call successful', (done) => {
      client({address: '127.0.0.1:50052', creedentials: clientCertificates})
        .service('Greeter', protos.helloWorld)
        .sayHello({ name: 'Scaramouche' })
        .end((err, res) => {
          expect(err).to.be.deep.equal(null)
          expect(res).to.be.deep.equal({ message: 'Hello Scaramouche' })
          done()
        })
    })
  })

  describe('testing the stream client', function () {
    this.timeout(10000)

    before((done) => {
      rpcServer = server()

      rpcServer.addServices(services)

      rpcServer.start(done)
    })

    after((done) => {
      rpcServer.stop(() => {
        rpcServer = null
        done()
      })
    })

    it('should emit an error when sending bad data', (done) => {
      client({ type: 'stream' })
        .service('Greeter', protos.helloWorldStream)
        .sayHelloStream()
        .end((err, res) => {
          expect(err.message).to.be.deep
            .equal('May not write null values to stream')
          expect(res).to.be.deep.equal(undefined)
          bigFile = require('./fixtures/big-file.json')
          done()
        })
    })

    it('should do a rpc call successful streaming a big payload',
      (done) => {
        client({ type: 'stream', metadata: { 'device': 123 } })
          .service('Greeter', protos.helloWorldStream)
          .sayHelloStream()
          .setMetadata({ 'request-id': 123, 'place': 'Ldn' })
          .end((err, res, metadata) => {
            expect(err).to.be.deep.equal(null)
            expect(res.message.length).to.be.equal(100000)
            expect(metadata).to.be.deep.equal(
              {
                'device': '123',
                'request-id': '123',
                'place': 'Ldn'
              }
            )
            done()
          })
      }
    )
  })
})
