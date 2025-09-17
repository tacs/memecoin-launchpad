A simple meme coin launch pad app - a very rudimentary idea based on pump.fun

:construction::construction: Check wether returning a struct on certain smart contracts functions ease the interaction with react - it could also serve as a common type to be used in both backend and frontend - compare gas consumptions / network latency between that and getting the fields separately

# Backend
#### Features:
1. :construction::construction: Add a proxy to allow upgrade contracts easily - hardhat contains an Upgradeable contract that can be extended from
1. :construction::construction: Add a min/max total supply
1. :construction::construction: Add a way to prevent whales
1. :construction::construction: Automatically handle according to percentages (SUPPLY_PERCENTAGE_FOR_SALE, ...)

#### Instructions
1. To start the backend using hardhat: `cd backend && npm run web3:serve`

# Frontend
#### Features
1. Uses [dexie](https://github.com/dexie/Dexie.js) to cache the transactions
1. :construction::construction: Allow to set total supply and what percentage to use for sale, LP (Liquidity Pool), marketing, team, reserve

#### Instructions
1. To start the frontend: `cd frontend && npm run dev`