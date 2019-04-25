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
const BigNumber = require('bignumber.js');

const config = {
    host: "http://localhost:3001/",
    internalHost: "http://localhost:3001/internal/",
    compilerUrl: "https://compiler.aepps.com"
};

const decodeAddress = (key) => {
    const address = Crypto.decodeBase58Check(key.split('_')[1]).toString('hex')
    return `#${address}`
};

describe('MultiSig Contract', () => {

    let clientAdminOne, clientAdminTwo, clientNonAdmin, contractClientOne, contractSource;
    let adminOneKeypair = wallets[0];
    let adminTwoKeypair = wallets[1];
    let nonAdminKeypair = wallets[2];
    let receiverNonAdminKeypair = wallets[3];

    before(async () => {
        clientAdminOne = await Ae({
            url: config.host,
            internalUrl: config.internalHost,
            compilerUrl: config.compilerUrl,
            keypair: adminOneKeypair,
            nativeMode: true,
            networkId: 'ae_devnet'
        });

        clientAdminTwo = await Ae({
            url: config.host,
            internalUrl: config.internalHost,
            compilerUrl: config.compilerUrl,
            keypair: adminTwoKeypair,
            nativeMode: true,
            networkId: 'ae_devnet'
        });

        clientNonAdmin = await Ae({
            url: config.host,
            internalUrl: config.internalHost,
            compilerUrl: config.compilerUrl,
            keypair: nonAdminKeypair,
            nativeMode: true,
            networkId: 'ae_devnet'
        });
    });

    it('MultiSig Contract, SUCCESS deploy and initialize', async () => {
        contractSource = utils.readFileRelative('./contracts/MultiSig.aes', "utf-8"); // Read the aes file
        contractClientOne = await clientAdminOne.getContractInstance(contractSource);
        const deploy = await contractClientOne.deploy([adminOneKeypair.publicKey, adminTwoKeypair.publicKey]);

        assert.equal(deploy.deployInfo.result.returnType, 'ok', 'Could not deploy the MultiSig Smart Contract');
    });

    it('MultiSig Contract, FAILURE deploy and initialize with same admin', async () => {
        const contractClientOneFailDeploy = await clientAdminOne.getContractInstance(contractSource);
        const deploy = await contractClientOneFailDeploy.deploy([adminOneKeypair.publicKey, adminOneKeypair.publicKey]);

        assert.equal(deploy.deployInfo.result.returnType, 'revert', 'Deploy the MultiSig Smart Contract did not revert');
    });

    async function adminOneAgree(address, amount) {
        const callAdminOne = await contractClientOne.call('add_data_and_spend_if_both_admins_agree', [{
            spend_to_address: address,
            spend_amount: amount
        }]).catch(console.error);
        assert.isDefined(callAdminOne, 'Could not call the MultiSig Smart Contract Admin One');
        let callAdminOneDecoded = await callAdminOne.decode();
        assert.isFalse(callAdminOneDecoded);
    }

    async function adminTwoAgree(address, amount, assertSent = true) {
        let contractClientTwo = await clientAdminTwo.getContractInstance(contractSource, {contractAddress: contractClientOne.deployInfo.address})
        const callAdminTwo = await contractClientTwo.call('add_data_and_spend_if_both_admins_agree', [{
            spend_to_address: address,
            spend_amount: amount
        }]).catch(console.error);
        assert.isDefined(callAdminTwo, 'Could not call the MultiSig Smart Contract Admin Two');
        let callAdminTwoDecoded = await callAdminTwo.decode();
        assertSent ? assert.isTrue(callAdminTwoDecoded) : assert.isFalse(callAdminTwoDecoded);
    }

    it('MultiSig Contract, SUCCESS both admins agree to spend workflow', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial.plus(sendAmount)), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial.minus(sendAmount)), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, FAILURE non admin tries to spend', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        let contractNonAdmin = await clientNonAdmin.getContractInstance(contractSource, {contractAddress: contractClientOne.deployInfo.address})
        const callNonAdmin = await contractNonAdmin.call('add_data_and_spend_if_both_admins_agree', [{
            spend_to_address: receiverNonAdminKeypair.publicKey,
            spend_amount: sendAmount
        }]).then(() => Promise.resolve(false)).catch(() => Promise.resolve(true));
        assert.isTrue(callNonAdmin, 'Could not call the MultiSig Smart Contract non Admin');

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, SUCCESS both admins agree to spend workflow, first agrees twice', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial.plus(sendAmount)), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial.minus(sendAmount)), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, SUCCESS both admins agree to spend workflow, next spend after first success', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount * 2, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterFirst = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterFirst = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterFirst.isEqualTo(receiverBalanceInitial.plus(sendAmount)), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterFirst.isEqualTo(contractBalanceInitial.minus(sendAmount)), 'Contract Balance not as expected');

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterSecond = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterSecond = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterSecond.isEqualTo(receiverBalanceAfterFirst.plus(sendAmount)), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterSecond.isEqualTo(contractBalanceAfterFirst.minus(sendAmount)), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, SUCCESS both admins agree to spend workflow, first changes agreement, second agrees', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(nonAdminKeypair.publicKey, sendAmount);
        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial.plus(sendAmount)), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial.minus(sendAmount)), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, FAILURE only admin agrees to spend workflow', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, FAILURE second admin disagrees address to spend workflow', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(nonAdminKeypair.publicKey, sendAmount, false);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, FAILURE second admin disagrees amount to spend workflow', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount * 2, false);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial), 'Contract Balance not as expected');
    });

    it('MultiSig Contract, SUCCESS second admin first disagrees then agrees to spend workflow', async () => {
        const sendAmount = 10000;
        await clientAdminOne.spend(sendAmount, contractClientOne.deployInfo.address.replace('ct_', 'ak_'));
        const receiverBalanceInitial = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceInitial = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        await adminOneAgree(receiverNonAdminKeypair.publicKey, sendAmount);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount * 2, false);
        await adminTwoAgree(receiverNonAdminKeypair.publicKey, sendAmount);

        const receiverBalanceAfterwards = new BigNumber(await clientAdminOne.balance(receiverNonAdminKeypair.publicKey));
        const contractBalanceAfterwards = new BigNumber(await clientAdminOne.balance(contractClientOne.deployInfo.address));

        assert.isTrue(receiverBalanceAfterwards.isEqualTo(receiverBalanceInitial.plus(sendAmount)), 'Receiver Balance not as expected');
        assert.isTrue(contractBalanceAfterwards.isEqualTo(contractBalanceInitial.minus(sendAmount)), 'Contract Balance not as expected');
    });

});
