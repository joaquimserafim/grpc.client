#!/bin/sh
set -e

echo "--->  Generate the ROOT Private Key"
openssl genrsa 4096 \
    -out ./ca_private.key

echo "--->  Generate the ROOT CA CRT"
openssl req \
    -x509 \
    -config ./ca.cfg \
    -newkey rsa:2048 \
    -sha256 \
    -nodes \
    -out ./ca.crt \
    -outform PEM \
    -subj "/C=GB/ST=London/L=London/O=?Test PLC/OU=TEST/CN=Test Node Dev Root Cert"

openssl x509 \
    -in ./ca.crt \
    -text -noout

openssl x509 \
    -purpose \
    -in ./ca.crt \
    -inform PEM

touch ./index.txt
echo "01" > ./serial.txt

echo
echo "**********************"
echo "***** Successful *****"
echo "**********************"
