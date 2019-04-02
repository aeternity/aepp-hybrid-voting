<template>
  <div class="SimpleVote">
    <div class="content">
      <h3>Aeternity Simple Voting Contract</h3>
      <p v-if="contractAddress">The contract is deployed at {{contractAddress}}</p>
      <p v-if="!contractAddress">No contracts found - maybe wrong network set in MetaMask?</p>
      <p v-if="account">Current account: {{account}}</p>
      <p v-if="!account">No accounts found</p>
      <input v-model="newVote" type="number">
      <button @click="placeVote">Place your vote in the contract!</button>
      <p v-if="currentVote">Your current vote from the contract: {{currentVote}}</p>
      <p v-if="etherBalance">Your account's ETH balance on the current network: {{etherBalance}}</p>
      <p v-if="!etherBalance">Could not fetch your account's balance - MetaMask set up?</p>
      <p v-if="!currentVote">No vote for this address yet</p>
      <p v-if="!tokenBalanceAtHeight">Could not fetch your Tokenbalance at Block {{votingHeightBlock}}, correct network?</p>
      <p v-if="tokenBalanceAtHeight">Your AE-Token Balance (ERC-20) at block {{votingHeightBlock}} is {{tokenBalanceAtHeight}}.</p>
    </div>
    <div class="message" v-if="message">{{message}}</div>
  </div>
</template>


<script>
import Web3 from 'web3'
import contract from 'truffle-contract'
import artifacts from '../../build/contracts/SimpleVote.json'
const SimpleVote = contract(artifacts)

// TODO: Display AE ERC20 balance for user's information
// TODO: Try updating to web3 1.0
export default {
  name: 'SimpleVote',
  data() {
    return {
      message: null,
      contractAddress: null,
      account: null,
      newVote: 0,
      currentVote: 0,
      etherBalance: 0,
      erc20Balance: 0,
      votingHeightBlock: 7487763, // TODO: Adjust value to the blocknumber which is supposed to be the time of counting for the vote
      tokenBalanceAtHeight: null,
      tokenContractAddress: "0x5CA9a71B1d01849C0a95490Cc00559717fCF0D1d" // TODO: Adapt automatically to network (Mainnet/Ropsten etc)
    }
  },
  created() {
    if (typeof web3 !== 'undefined') {
      console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 Fluyd, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
      // Use Mist/MetaMask's provider
      web3 = new Web3(web3.currentProvider)
    } else {
      console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
    }

    SimpleVote.setProvider(web3.currentProvider)
    web3.eth.getAccounts((err, accs) => {
      if (err != null) {
        console.error(err)
        this.message = "There was an error fetching your accounts. Do you have Metamask, Mist installed or an Ethereum node running? If not, you might want to look into that"
        return
      }

      if (accs.length == 0) {
        this.message = "Couldn't get any accounts! Make sure your Ethereum client is configured correctly."
        return
      }
      this.account = accs[0];
      SimpleVote.deployed()
        .then((instance) => instance.address)
        .then((address) => {
          this.contractAddress = address
          this.updateCurrentVote()
          this.updateEthBalance(this.account)
        })
    })
  },
  methods: {
    placeVote() {
      this.message = "Transaction started";
      return SimpleVote.deployed()
        .then((instance) => instance.vote(this.newVote, {from: this.account}))
        .then(() => {
          this.message = "Transaction done"
          this.updateCurrentVote()
        })
        .catch((e) => {
          console.error(e)
          this.message = "Transaction failed"
        })
    },
    updateCurrentVote() {
      SimpleVote.deployed().then((instance) => instance.getVote(this.account)).then((r) => {
        console.log(r.toNumber())
        this.currentVote = r.toNumber()
      });
    },
    getTokenbalanceAtHeight() {
      web3.eth.call({
        to: tokenContractAddress,
        data: "0x70a08231000000000000000000000000" + this.account.substring(0,2)
      }, (err, result) => {
        if (err != null){
            console.error(err)
            this.message = "There was an error fetching your Tokenbalance at Block " + this.votingHeightBlock + " . Correct network?"
            return
        }
        this.tokenBalanceAtHeight = result.toNumber 
      })
    }
    ,
    updateEthBalance(acc) {
      web3.eth.getBalance(acc, (err, balance) => {
        if (err != null) {
          console.error(err)
          this.message = "There was an error fetching the balance for your account " + acc.
          return
        }
        // TODO: Check for minimal value a user should have to successfully make a transaction, maybe take gas price into account.
        if (balance == 0) {
          this.etherBalance = "0"
          this.message = "Your account does not have any Ether, ask a friend ?"
          return
        }
        this.etherBalance = balance.toString();

    })
}
  },
}
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.content {
  padding: 13px 13px 39px 13px;
}
.message {
  background: #eee;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 13px;
  line-height: 1;
  padding: 13px;
}
</style>
