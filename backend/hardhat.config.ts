import { HardhatUserConfig } from 'hardhat/config'
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import '@openzeppelin/hardhat-upgrades'

const config: HardhatUserConfig = {
	gasReporter: {
		enabled: false,
	},
	mocha: {
		bail: true,
	},
	/*networks: {
		hardhat: {
			// See: https://hardhat.org/hardhat-network/docs/reference#mining-modes
			mining: {
				auto: true,
				// Produce new block every 3 minutes to resolve next issues
				// https://github.com/NomicFoundation/hardhat/issues/2053
				// https://github.com/ethers-io/ethers.js/issues/2338
				// https://github.com/ethers-io/ethers.js/discussions/4116
				interval: 3 * 60 * 1000, // should be less then 5 minutes to make event subscription work
			},
		},
	},*/
	solidity: {
		version: '0.8.28',
	},
};

export default config;
