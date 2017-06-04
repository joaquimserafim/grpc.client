/*
eslint
no-multi-spaces: ["error", {exceptions: {"VariableDeclarator": true}}]
padded-blocks: ["error", {"classes": "always"}]
max-len: ["error", 80]
*/
'use strict'

const { load, credentials, Metadata } = require('grpc')
const { deepStrictEqual }             = require('assert')
const isObject                        = require('is.object')

class Client {

  constructor (config) {
    const nConfig = config || {}

    this._type = nConfig.type || 'unary'
    this._address = nConfig.address || '0.0.0.0:50051'
    this._creedentials = setAuthentication(nConfig.creedentials) ||
      credentials.createInsecure()
    this._metadata = addMetadata(nConfig.metadata)
  }

  service (service, protoFile) {
    deepStrictEqual(
      typeof service === 'string' && !!service.length,
      true,
      'service name is mandatory'
    )

    const Proto = load(protoFile)
    const pkg   = Object.keys(Proto)[0]

    this._client = new Proto[pkg][service](this._address, this._creedentials)

    const functions = filterRpcFunctions(this._client)

    for (let i = 0; i < functions.length; i++) {
      this[functions[i]] = wrapRpcFunction.bind(this, functions[i])
    }

    return this
  }

  setMetadata (metadata) {
    this._metadata = isObject(metadata) && addMetadata(metadata, this._metadata)

    return this
  }

  end (cb) {
    if (this._exec.data && isObject(this._exec.metadata)) {
      this._metadata = addMetadata(this._exec.metadata, this._metadata)
    }

    if (this._type === 'unary') {
      return this._client[this._exec.fn](this._exec.data, this._metadata, cb)
    }

    const call = this._client[this._exec.fn](this._exec.data, this._metadata)

    const res = { error: null, metadata: {} }

    call
      .on('data', (data) => {
        res.data = data
      })
      .on('error', (err) => {
        res.error = err
      })
      .on('status', (status) => {
        res.metadata = status.metadata.getMap()
        // when is an error the event `end` is not called
        // maybe this is an issue on gRPC module
        cb(res.error, res.data, res.metadata)
      })
  }

}

module.exports = function factory (config) {
  return new Client(config)
}

//
// help functions
//

function filterRpcFunctions (obj) {
  const props = Object.getPrototypeOf(obj)

  const found = []

  for (let prop in props) {
    found.push(prop)
  }

  return found
}

function wrapRpcFunction (fn, data, metadata) {
  this._exec = {
    fn: fn,
    data: data,
    metadata: metadata
  }
  return this
}

function setAuthentication (certs) {
  return isObject(certs) && credentials
    .createSsl(
      Buffer.from(certs.ca),
      Buffer.from(certs.key),
      Buffer.from(certs.client)
    )
}

function addMetadata (newMetadata, metadata) {
  const setMeta = metadata || new Metadata()

  for (let key in newMetadata) {
    setMeta.set(key, newMetadata[key] + '')
  }

  return setMeta
}
