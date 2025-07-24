// ignition/modules/MyToken.ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { ethers } from 'hardhat'

const FEE = ethers.parseEther('0.01')

export default buildModule("FactoryModule", (m) => {
	const fee = m.getParameter('fee', FEE)

	const factory = m.contract("Factory", [fee]);
	return { factory };
});