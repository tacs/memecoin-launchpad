import { loadFixture, } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
//import {  } from 'hardhat/src'

describe('Factory', function () {
	const FEE = ethers.parseEther('0.01')
	const NAME = 'Tacs'
	const SYMBOL = 'TCS'
	const TOTAL_SUPPLY = ethers.parseEther('1000000')

	async function deployFactoryFixture() {
		// fetch accounts
		const signers = await ethers.getSigners()
		const deployer = signers[0]
		const creator = signers[1]
		const buyer = signers[2]

		// fetch the contract
		const Factory = await ethers.getContractFactory('Factory')

		// deploy the contract
		const factory = await Factory.deploy(FEE)
		const factoryAddress = await factory.getAddress()

		// create token
		const transaction = await factory.connect(creator).create(NAME, SYMBOL, TOTAL_SUPPLY, { value: FEE })
		const transactionReceipt = (await transaction.wait())!

		// get token
		//const tokenAddress = await transactionReceipt.getResult() // not working
		const tokenAddress = await factory.getToken(0);
		const token = await ethers.getContractAt('Token', tokenAddress)

		return { buyer, creator, deployer, factory, factoryAddress, token, tokenAddress, transaction, transactionReceipt }
	}

	async function buyTokenFixture() {
		const AMOUNT = ethers.parseEther('5')
		const COST = ethers.parseEther('1')

		const { buyer, creator, factory, factoryAddress, token, tokenAddress } = await deployFactoryFixture()

		// buy tokens
		const transaction = await factory.connect(buyer).buy(await token.getAddress(), AMOUNT, { value: COST })
		const transactionReceipt = (await transaction.wait())!

		return { AMOUNT, COST, buyer, creator, factory, factoryAddress, token, tokenAddress, transactionReceipt }
	}

	async function depositFixture() {
		const COST = ethers.parseEther('2')
		const { AMOUNT, buyer, creator, factory, token, tokenAddress } = await buyTokenFixture()

		return { AMOUNT, COST, buyer, creator, factory, token, tokenAddress }
	}

	async function withdrawFixture() {
		const { deployer, factory, factoryAddress } = await deployFactoryFixture()

		return { deployer, factory, factoryAddress }
	}

	describe('Deployment', () => {
		it('should set the fee', async () => {
			const { factory } = await loadFixture(deployFactoryFixture)
			const fee = await factory.fee()
			expect(fee).to.equal(FEE)
		})

		it('should set the owner', async () => {
			const { deployer, factory } = await loadFixture(deployFactoryFixture)
			const owner = await factory.owner()
			expect(owner).to.equal(deployer.address)
		})
	})

	describe('Creating', () => {
		it('should set the owner', async () => {
			const { factory, factoryAddress, token } = await loadFixture(deployFactoryFixture)
			expect(await token.owner()).to.equal(factoryAddress)
		})

		it('should set the creator', async () => {
			const { creator, token } = await loadFixture(deployFactoryFixture)
			expect(await token.creator()).to.equal(creator.address)
		})

		it('should set the supply', async () => {
			const { factory, factoryAddress, token } = await loadFixture(deployFactoryFixture)
			const totalSupply = ethers.parseEther('1000000')
			expect(await token.balanceOf(factoryAddress)).to.equal(totalSupply)
		})

		it('should update ETH balance', async () => {
			const { factory, factoryAddress } = await loadFixture(deployFactoryFixture)
			const balance = await ethers.provider.getBalance(factoryAddress)
			expect(balance).to.equal(FEE)
		})

		it('should create', async () => {
			const { creator, factory, token, tokenAddress } = await loadFixture(deployFactoryFixture)

			const count = await factory.getTokensLength()
			expect(count).to.equal(1)

			const tokenAddress2 = await factory.getToken(0)
			expect(tokenAddress2).to.equal(tokenAddress)

			expect(await token.symbol()).to.equal(SYMBOL)
			expect(await token.name()).to.equal(NAME)
			expect(await token.creator()).to.equal(creator.address)
			expect(await token.getSold()).to.equal(0)
			expect(await token.getRaised()).to.equal(0)
			expect(await token.isAvailable()).to.equal(true)
		})

		it('should emit an event', async () => {
			const { factory, token, transactionReceipt } = await loadFixture(deployFactoryFixture)

			expect(await factory.create(NAME, SYMBOL, TOTAL_SUPPLY, { value: FEE })).to.emit(factory, factory.getEvent('Created').name)

			const event = transactionReceipt?.logs.find(log => log.topics[0] === factory.interface.getEvent('Created').topicHash)
			const eventData = factory.interface.parseLog(event!)
			expect(eventData?.args[0]).to.equal(await token.getAddress())
		})
	})

	describe('Buying', () => {
		it('should update ETH balance', async () => {
			const { COST, factoryAddress } = await loadFixture(buyTokenFixture)

			const balance = await ethers.provider.getBalance(factoryAddress)
			expect(balance).to.equal(FEE + COST)
		})

		it('should update token details', async () => {
			const { AMOUNT, COST, buyer, token } = await loadFixture(buyTokenFixture)

			// check eth balance
			const balance = await token.balanceOf(buyer.address)
			expect(balance).to.equal(AMOUNT)

			// check token details
			expect(await token.getSold()).to.equal(AMOUNT)
			expect(await token.getRaised()).to.equal(COST)
			expect(await token.isAvailable()).to.equal(true)

			// check base cost was increased
			const cost = await token.getCost()
			expect(cost).to.equal(await token.COST_STEP())
		})

		it('should emit an event', async () => {
			const { AMOUNT, COST, factory, tokenAddress, transactionReceipt } = await loadFixture(buyTokenFixture)

			expect(await factory.buy(tokenAddress, AMOUNT, { value: COST })).to.emit(factory, factory.getEvent('Bought').name)

			const event = transactionReceipt?.logs.find(log => log.topics[0] === factory.interface.getEvent('Bought').topicHash)
			const eventData = factory.interface.parseLog(event!)
			expect(eventData?.args[0]).to.equal(tokenAddress)
			expect(eventData?.args[1]).to.equal(AMOUNT)
			expect(eventData?.args[2]).to.equal(COST)
		})
	})

	describe('Depositing', () => {
		it('should deposit and close the sale', async () => {
			const { AMOUNT, COST, buyer, creator, factory, token, tokenAddress } = await loadFixture(depositFixture)

			const buyTx = await factory.connect(buyer).buy(tokenAddress, AMOUNT, { value: COST })
			await buyTx.wait()

			expect(await token.isAvailable()).to.equal(false)

			const depositTx = await factory.connect(creator).deposit(tokenAddress)
			await depositTx.wait()

			const balance = await token.balanceOf(creator.address)
			const calculcatedCost = ethers.parseEther(String(Number(ethers.formatEther(COST)) * Number(ethers.formatEther(AMOUNT))))
			expect(balance).to.equal(await factory.TOTAL_SUPPLY() - calculcatedCost)
		})
	})

	describe('Withdrawing fees', () => {
		it('should update ETH balance', async () => {
			const { deployer, factory, factoryAddress } = await loadFixture(withdrawFixture)

			const transaction = await factory.connect(deployer).withdraw(FEE)
			await transaction.wait()

			const balance = await ethers.provider.getBalance(factoryAddress)
			expect(balance).to.equal(0)
		})
	})
})