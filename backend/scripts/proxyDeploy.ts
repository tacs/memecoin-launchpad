import { ethers, upgrades } from 'hardhat'

(async function main() {
	const Factory = await ethers.getContractFactory('Factory')
	const factory = await upgrades.deployProxy(Factory, [], { initializer: 'initialize' })
	await factory.waitForDeployment()
	const address = await factory.getAddress()
	console.log('Proxy Factory deployed to:', address)
})()