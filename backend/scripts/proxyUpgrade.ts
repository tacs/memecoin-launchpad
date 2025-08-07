import { ethers, upgrades } from 'hardhat'

(async function main() {
	const Factory = await ethers.getContractFactory('Factory')
	const factory = await upgrades.upgradeProxy('0x5FbDB2315678afecb367f032d93F642f64180aa3', Factory)
	const address = await factory.getAddress()
	console.log('Factory upgraded at:', address)
})()