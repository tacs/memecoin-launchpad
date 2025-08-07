A simple meme coin launch pad app - a very rudimentary idea based on pump.fun

### BACKEND ###
1. To start the backend using hardhat: `cd backend && npm run web3:serve`

### FRONTEND ###
1. To start the frontend: `cd frontend && npm run dev`



## ToDo ###
1. Add a proxy to allow upgrade contracts easily - hardhat contains an Upgradeable contract that can be extended from
1. Cache transactions in the frontend - using IndexedDb (Dexie seems to be a nice library)
1. Check wether returning a struct on certain smart contracts functions ease the interaction with react - it could also serve as a common type to be used in both backend and frontend - compare gas consumptions / network latency between that and getting the fields separately