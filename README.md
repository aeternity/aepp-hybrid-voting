# BRI Voting is Finished

[Result Overview](./result/README.md)

# Hybrid Voting aepp

To build is a hybrid voting-aepp that works with Ethereum AE ERC20 Token and Aeternity Mainnet token. One token one vote (token weighted).

People give their vote by calling a voting option in a voting smart contract on chain OR doing transactions. At a given, past/future block-height on Aeternity and Ethereum all votes will be counted (publicly verifiable). 

## Verify the Result:
 - must have NodeJS >= 8 installed
 - clone https://github.com/aeternity/aepp-hybrid-voting
 - run `./verify.sh` (installs dependencies and prints the result)


# Vote Participation Methods
 1. Ethereum Aeternity ERC-20 Tokens using Metamask/Ledger
 2. Aeternity Mainnet Tokens with Ledger on Desktop
 3. Aeternity Mainnet Tokens with Base-Aepp on Mobile
 4. Aeternity Mainnet Tokens with AirGap Vault on Mobile

(For testing mode ensure that the aepp is still shows the testnet banner on top. On aeternity use the latest staging base-aepp stage-identity.aepps.com and choose testnet, or use kovan testnet for ethereum.)

## 1. Ethereum Aeternity ERC-20 Tokens using Metamask/Ledger
Requirement: ETH + AE-ERC-20 available in Metamask (e.g. using Ledger)
 - Open http://aeternity.com/aepp-hybrid-voting/ in the brower you have Metamask in
 - Choose Metamask and allow the website to read your account information
 - Check if the displayed account is correct, if not, choose another on in Metamask and reload  
 - Set your prefered vote and confirm with in the website
 - Confirm the metamask popup with the transaction data (only pay ethereum transaction fee, no aeternity-erc-20 tokens)

## 2. Aeternity Mainnet Tokens on Ledger
Requirement: AE Mainnet Tokens available on Ledger
 - Open base-aepp using Chrome on desktop
 - In the top-right corner press connect and choose the ledger tap, then follow the steps and confirm your address using ledger
 - In another tab open http://aeternity.com/aepp-hybrid-voting/
 - Check if the displayed account is correct
 - Set your prefered vote and confirm with in the website
 - Confirm the transaction using ledger, if this fails try again and confirm in with as little wait as possible

## 3. Aeternity Mainnet Tokens with Base-Aepp on Mobile
Requirement: AE Mainnet Tokens available in Base-Aepp on a mobile device
 - Open base-aepp on your phone, ensure you have the latest version (0.8.0)
 - Open http://aeternity.com/aepp-hybrid-voting/ using the aepps browser in base-aepp or choose the voting aepp icon
 - Check if the displayed account is correct
 - Set your prefered vote and confirm with in the website
 - Confirm the transaction on the base-aepp popup

## 4. Aeternity Mainnet Tokens with AirGap Vault on Mobile
Requirement: AE Mainnet Tokens available on a separate mobile device in AirGap Vault
 - Open base-aepp on your phone, ensure you have the latest version (0.8.0) and that you are using a different phone from the one running AirGap Vault
 - In base-aepp in the bottom bar in the middle open the account switcher and choose "Create a vault for AirGap"
 - Follow the steps to connect your already existing vault by scanning the QR code provided when choosing sync account using offline device in your AirGap Vault app
 - Open http://aeternity.com/aepp-hybrid-voting/ using the aepps browser in base-aepp or choose the voting aepp icon
 - Check if the displayed account is correct
 - Set your prefered vote and confirm with in the website
 - Scan the QR code from base-aepp using your AirGap Vault to sign
 - Choose offline device to display the signed transaction QR code in AirGap Vault
 - click "Done" in your base-aepp then scan the signed transaction QR code from AirGap Vault to send the transaction
