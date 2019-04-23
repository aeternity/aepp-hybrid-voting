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
const Ae = require('@aeternity/aepp-sdk').Universal;
const Crypto = require('@aeternity/aepp-sdk').Crypto;

const config = {
    host: "http://localhost:3001/",
    internalHost: "http://localhost:3001/internal/"
};

const decodeAddress = (key) => {
    const address = Crypto.decodeBase58Check(key.split('_')[1]).toString('hex')
    return `0x${address}`
};

describe('MultiSig Contract', () => {

    console.log(wallets);

    let clientOne, adminTwo, contract;
    let adminOneKeypair = wallets[0];
    let adminTwoKeypair = wallets[1];
    let nonAdminKeypair = wallets[2];
    let receiverNonAdminKeypair = wallets[3];

    before(async () => {
        clientOne = await Ae({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: adminOneKeypair,
            nativeMode: true,
            networkId: 'ae_devnet'
        });

        adminTwo = await Ae({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: adminTwoKeypair,
            nativeMode: true,
            networkId: 'ae_devnet'
        });
    });

    it('Deploy and Initialize MultiSig Contract', async () => {
        let contractSource = utils.readFileRelative('./contracts/MultiSig.aes', "utf-8"); // Read the aes file

        const compiledContract = await clientOne.contractCompile(contractSource);

        const deployPromise = compiledContract.deploy([adminOneKeypair.publicKey, adminTwoKeypair.publicKey]);

        await assert.isFulfilled(deployPromise, 'Could not deploy the MultiSig Smart Contract'); // Check it is deployed
        contract = await deployPromise;
    });

    it('MultiSig Contract, both admins agree to spend workflow', async () => {
        await clientOne.spend(100000, contract.address.replace('ct_', 'ak_'));
        const receiverBalance = await clientOne.balance(receiverNonAdminKeypair.publicKey);
        const contractBalance = await clientOne.balance(contract.address);
        console.log(receiverBalance, contractBalance);
        await contract.call('add_data_and_spend_if_both_admins_agree', {args: `({spend_to_address = ${decodeAddress(receiverNonAdminKeypair.publicKey)}, spend_amount = 1000})`})
            .catch(console.error)
    });

});
