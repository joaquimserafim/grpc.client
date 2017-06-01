'use strict'

const { pki } = require('node-forge')

const attrs = [
  {
    name: 'commonName',
    value: 'example.org'
  },
  {
    name: 'countryName',
    value: 'GB'
  },
  {
    shortName: 'ST',
    value: 'ElDorado'
  },
  {
    name: 'localityName',
    value: 'Benfica'
  },
  {
    name: 'organizationName',
    value: 'Test'
  },
  {
    shortName: 'OU',
    value: 'Test'
  }
]

const exts = [
  {
    name: 'basicConstraints',
    cA: true
  },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true
  },
  {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
  },
  {
    name: 'subjectAltName',
    altNames: [
      {
        type: 6, // URI
        value: 'http://example.org/webid#me'
      },
      {
        type: 7, // IP
        ip: '127.0.0.1'
      }
    ]
  },
  {
    name: 'subjectKeyIdentifier'
  }
]

module.exports = createCertificate

function createCertificate (cb) {
  pki.rsa.generateKeyPair({ bits: 1024 }, generateKeyPair)

  function generateKeyPair (err, keyPair) {
    if (err) {
      return cb(err)
    }

    const cert = pki.createCertificate()

    cert.publicKey = keyPair.publicKey
    cert.serialNumber = '01'
    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter
      .setFullYear(cert.validity.notBefore.getFullYear() + 1)
    cert.setSubject(attrs)
    cert.setIssuer(attrs)
    cert.setExtensions(exts)

    cert.sign(keyPair.privateKey)

    const pem = {
      privateKey: pki.privateKeyToPem(keyPair.privateKey),
      publicKey: pki.publicKeyToPem(keyPair.publicKey),
      certificate: pki.certificateToPem(cert)
    }

    cb(null, pem)
  }
}
