import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import Factory from '../ignition/modules/Factory'

describe('Proxy', function () {
	it('should work', async () => {
		const Factory = await ethers.getContractFactory('Factory')
		const Factory2 = await ethers.getContractFactory('Factory')

		const instance = await upgrades.deployProxy(Factory, [42])
		const upgraded = await upgrades.upgradeProxy(await instance.getAddress(), Factory2)

		console.log(111, upgraded)
		//const value = await upgraded.()
		//expect(value.toString()).to.equal('42')
	})
})