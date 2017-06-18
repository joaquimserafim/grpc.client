#!/bin/sh
set -e

ls ca_private.key ca.crt || echo "Run generate_ca_certificate.sh first"

echo "--->  Generate the SERVER key"
openssl genrsa 4096 \
    -out ./server_private.key \

echo "--->  Generate the SERVER CSR"
openssl req \
    -config ./server.cfg \
    -newkey rsa:2048 \
    -sha256 \
    -nodes \
    -out ./server.csr \
    -outform PEM \
    -subj "/C=GB/ST=London/L=London/O=Test /OU=TEST/CN=localhost"

openssl req \
    -text \
    -noout \
    -verify \
    -in ./server.csr

echo "--->  Generate the SERVER Certificate attached to ROOT CA"
openssl ca \
    -config ./ca.cfg \
    -policy signing_policy \
    -extensions signing_req \
    -out ./server.crt \
    -infiles ./server.csr

echo "--->  Remove server.csr"
rm ./server.csr

echo
echo "**********************"
echo "***** Successful *****"
echo "**********************"
