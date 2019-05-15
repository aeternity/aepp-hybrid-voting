#!/usr/bin/env bash

node --version
cd eth-contract-voting-count
npm i
cd ../ae-spendtx-voting-count
npm i
NODE_WEB3_URL=https://mainnet.infura.io/ node aggregate.js
