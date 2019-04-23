/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
const Deployer = require('forgae').Deployer;

const deploy = async (network, privateKey) => {
    let deployer = new Deployer(network, privateKey)

    let adminOneKeypair = {publicKey: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk'};
    let adminTwoKeypair = {publicKey: 'ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP'};


    let result = await deployer.deploy("./contracts/MultiSig.aes",
        [adminOneKeypair.publicKey, adminTwoKeypair.publicKey]
    );

    console.log(result);
};

module.exports = {
    deploy
};
