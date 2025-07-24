import { loadFixture, } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
//import {  } from 'hardhat/src'

describe('Factory', function () {
	const FEE = ethers.parseEther('0.01')
	const NAME = 'Tacs'
	const SYMBOL = 'TCS'

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

		// create token
		const transaction = await factory.connect(creator).create(NAME, SYMBOL, { value: FEE })
		const transactionReceipt = await transaction.wait()

		// get token address
		const tokenAddress = await factory.getToken(0);
		const token = await ethers.getContractAt('Token', tokenAddress)

		return { buyer, creator, deployer, factory, token, transaction, transactionReceipt }
	}

	async function buyTokenFixture() {
		const AMOUNT = ethers.parseEther('10000')
		const COST = ethers.parseEther('1')

		const { buyer, creator, factory, token } = await deployFactoryFixture()

		// buy tokens
		const transaction = await factory.connect(buyer).buy(await token.getAddress(), AMOUNT, { value: COST })
		await transaction.wait()

		return { AMOUNT, COST, buyer, creator, factory, token }
	}

	async function depositFixture() {
		const COST = ethers.parseEther('2')

		const { AMOUNT, buyer, creator, factory, token } = await buyTokenFixture()

		return { AMOUNT, COST, buyer, creator, factory, token }
	}

	async function withdrawFixture() {
		const { deployer, factory } = await deployFactoryFixture()

		return { deployer, factory }
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
			const { factory, token } = await loadFixture(deployFactoryFixture)
			expect(await token.owner()).to.equal(await factory.getAddress())
		})

		it('should set the creator', async () => {
			const { creator, token } = await loadFixture(deployFactoryFixture)
			expect(await token.creator()).to.equal(creator.address)
		})

		it('should set the supply', async () => {
			const { factory, token } = await loadFixture(deployFactoryFixture)
			const totalSupply = ethers.parseEther('1000000')
			expect(await token.balanceOf(await factory.getAddress())).to.equal(totalSupply)
		})

		it('should update ETH balance', async () => {
			const { factory } = await loadFixture(deployFactoryFixture)
			const balance = await ethers.provider.getBalance(factory.getAddress())
			expect(balance).to.equal(FEE)
		})

		it('should create the sale', async () => {
			const { creator, factory, token } = await loadFixture(deployFactoryFixture)

			const count = await factory.getTokensLength()
			expect(count).to.equal(1)

			const tokenAddress = await token.getAddress()

			const sale = await factory.getTokenSaleByAddress(tokenAddress)
			expect(sale.token).to.equal(tokenAddress)
			expect(sale.name).to.equal(NAME)
			expect(sale.creator).to.equal(creator.address)
			expect(sale.sold).to.equal(0)
			expect(sale.raised).to.equal(0)
			expect(sale.isOpen).to.equal(true)
		})

		it('should emit an event', async () => {
			const { factory, token, transactionReceipt } = await loadFixture(deployFactoryFixture)

			expect(await factory.create(NAME, SYMBOL, { value: FEE })).to.emit(factory, 'Created')

			const event = transactionReceipt?.logs.find(log => log.topics[0] === factory.interface.getEvent('Created').topicHash)
			const eventData = factory.interface.parseLog(event!)
			expect(eventData?.args[0]).to.equal(await token.getAddress())
		})
	})

	describe('Buying', () => {
		it('should update ETH balance', async () => {
			const { COST, factory } = await loadFixture(buyTokenFixture)

			const balance = await ethers.provider.getBalance(await factory.getAddress())
			expect(balance).to.equal(FEE + COST)
		})

		it('should update token balance', async () => {
			const { AMOUNT, buyer, token } = await loadFixture(buyTokenFixture)

			const balance = await token.balanceOf(buyer.address)
			expect(balance).to.equal(AMOUNT)
		})

		it('should update token sale', async () => {
			const { AMOUNT, COST, factory, token } = await loadFixture(buyTokenFixture)

			const sale = await factory.getTokenSaleByAddress(await token.getAddress())
			expect(sale.sold).to.equal(AMOUNT)
			expect(sale.raised).to.equal(COST)
			expect(sale.isOpen).to.equal(true)
		})

		it('should increase the base cost', async () => {
			const { factory, token } = await loadFixture(buyTokenFixture)

			const sale = await factory.getTokenSaleByAddress(await token.getAddress())
			const cost = await factory.getCost(sale.sold)
			expect(cost).to.equal(ethers.parseEther('0.0002'))
		})
	})

	describe('Depositing', () => {
		it('should deposit and close the sale', async () => {
			const { AMOUNT, COST, buyer, creator, factory, token } = await loadFixture(depositFixture)

			const tokenAddress = await token.getAddress()
			const buyTx = await factory.connect(buyer).buy(tokenAddress, AMOUNT, { value: COST })
			await buyTx.wait()

			const sale = await factory.getTokenSaleByAddress(tokenAddress)
			expect(sale.isOpen).to.equal(false)

			const depositTx = await factory.connect(creator).deposit(tokenAddress)
			await depositTx.wait()

			const balance = await token.balanceOf(creator.address)
			expect(balance).to.equal(ethers.parseEther('980000'))
		})
	})

	describe('Withdrawing fees', () => {
		it('should update ETH balance', async () => {
			const { deployer, factory } = await loadFixture(withdrawFixture)

			const transaction = await factory.connect(deployer).withdraw(FEE)
			await transaction.wait()

			const balance = await ethers.provider.getBalance(await factory.getAddress())
			expect(balance).to.equal(0)
		})
	})
})