# voting.js
Script generating a JSON file containing all voters, their votes and balances

# voting-version2.js
the same as above, but checking the token burnings using the Backendless table instead of Ethereum's past events

# server.js
Express server with an endpoint for getting vote details for the given address: 

GET /vote/:address

Example response: 
```
{
    "voter": "0xe43e...",
    "vote": "4",
    "totalBalance": "5000000",
    "burnedTokens": "4000000",
    "ownedTokens": "1000000"
}
```