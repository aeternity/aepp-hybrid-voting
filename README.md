# Hybrid Voting aepp

To build is a hybrid voting-aepp that works with Ethereum AE ERC20 Token and Aeternity Mainnet token. One token one vote (token weighted).

People give their vote by calling a voting option in a voting smart contract on chain OR doing transactions. At a given, past/future block-height on Aeternity and Ethereum all votes will be counted (publicly verifiable). 

# Timeline

2 Sprints, 4 Weeks until 25th of April.

# Team

- Piwo
- Nikita
- Dario
- Keno
- Base aepp team
- Ledger HW team

Product Coordinator: Emin

# Teams

- Dario: Design, A/B/C/D/E/F/G, https://vote.aepps.com/, use components
- Piwo/Keno: Aeternity
- Nikita: Ethereum
- Stoyan: regarding Airgab and Ledger Support

# Specs

- Hybrid Ethereum / Aeternity Application
- Voting on-chain
- Different voting options, only vote choice (multiple answers, one choice)
- Voting Result based on specific block-height (snapshot of AE and ETH)
- Script to count and verify votes on given block-height
- Snapshot **before/after** the vote ended (balance at height)
- (Don't) show a live vote count
- Don't count the phase 0 and 1 adresses on Ethereum

# Must-haves

- Voting with ERC20 token on Ethereum with MetaMask (or other Web3 Browser)
- Voting with AE token on Minerva Mainnet via Base Aepp
- Voting with AE accounts participating in the token migration (locked tokens)
- AirGap Voting Support
- Desktop Ledger Support

# Blockers that need to be resolved

- Base aepp Airgap and Ledger Support (all need to do contract calling)
- Vote by making a spend TX
- Aepp inside the base aepp triggeres the transaction
- Ledger app is broken after update (needs fix!). Everyone who didn't updated can currently still use it.

# Notes

- User: accidentally send their tokens to the voting contract/address (should be resolved through frontend)

Sources of Staking Data:
- 1. ERC 20 active tokens at blockheight X
- 2. ERC 20 migrated tokens at blockheight X (excl phase 0, 1)
- 3. AE tokens at blockheight Y (where Y ~= X)

Sources of Signaling for Options:
- Ethereum Contract for 1. Data Source
- Aeternity SpendTx for 2. and 3. Data Sources

WHERE
Sources 1.,2. are provided by Nikita
Source 3. provided by Piwo

AND
Signaling ETH provided by Nikita
Signaling AE provided by Piwo

Planning: https://app.zenhub.com/workspaces/aepp-hybrid-voting-5c9e22dc850e6a34fc6eeeca/boards?repos=178413901
