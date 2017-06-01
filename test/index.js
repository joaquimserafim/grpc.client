/*
eslint
no-multi-spaces: ["error", {exceptions: {"VariableDeclarator": true}}]
padded-blocks: ["error", {"classes": "always"}]
max-len: ["error", 80]
*/
'use strict'

const { describe, it, before, after } = require('mocha')
const grpc        = require('grpc')
const { expect }  = require('chai')

const client = require('../')

const certificates = require('./create-certificates')

var rpcServer

var clientCertificates = {}

const protos = {
  helloWorld: 'test/protos/hello-world.proto'
}

describe('gRPC client', () => {

  describe('functional test', () => {
    before((done) => {
      const proto = grpc.load(protos.helloWorld).helloWorld

      rpcServer = new grpc.Server()
      rpcServer.addService(proto.Greeter.service, { sayHello: sayHello })
      rpcServer.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())
      rpcServer.start()

      done()

      function sayHello (call, cb) {
        cb(null, { message: 'Hello ' + call.request.name })
      }
    })

    after((done) => {
      rpcServer.forceShutdown()
      rpcServer = null
      done()
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
        client({metadata: [{ 'request-id': 12345 }]})
          .service('Greeter', protos.helloWorld)
          .sayHello({ name: 'Scaramouche' }, [{ 'device-id': 'yay!!!' }])
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
      const proto = grpc.load(protos.helloWorld).helloWorld

      certificates(serverStart)

      function serverStart (_, pem) {
        const creedentials = grpc
          .ServerCredentials
          .createSsl(
            Buffer.from(pem.certificate),
          [
            {
              cert_chain: Buffer.from(pem.certificate),
              private_key: Buffer.from(pem.privateKey)
            }
          ]
          )

        // CA to be used by the client
        clientCertificates.ca = pem.certificate

        rpcServer = new grpc.Server()

        rpcServer.addService(proto.Greeter.service, { sayHello: sayHello })
        rpcServer.bind('127.0.0.1:50052', creedentials)
        rpcServer.start()

        // get client certificates
        certificates(getClientCertificates)
      }

      function getClientCertificates (_, pem) {
        clientCertificates.key = pem.privateKey
        clientCertificates.client = pem.certificate

        done()
      }

      function sayHello (call, cb) {
        cb(null, { message: 'Hello ' + call.request.name })
      }
    })

    after((done) => {
      rpcServer.forceShutdown()
      done()
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
})
