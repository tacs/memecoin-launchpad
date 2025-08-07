import { useEffect, useRef, useState } from 'react'
import { ethers, type EthersError } from 'ethers'

import { PrimeReactProvider } from 'primereact/api'
import 'primeflex/primeflex.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
// C:\Projects\voting\frontend\node_modules\primereact\resources\themes
import 'primereact/resources/themes/lara-light-pink/theme.css'
import { Badge } from 'primereact/badge'
import { BlockUI } from 'primereact/blockui'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'

import * as FactoryJson from './../../backend/artifacts/contracts/tacs/Factory.sol/Factory.json'
import { type Factory } from './../../backend/typechain-types/contracts/tacs/Factory'
import * as TokenJson from './../../backend/artifacts/contracts/tacs/Token.sol/Token.json'
import { type Token } from './../../backend/typechain-types/contracts/tacs/Token'

import { Icon, shortenAddress, type TokenData } from './helpers'
import ListItem from './components/ListItem'
import CreateTokenModal from './components/CreateTokenModal'
import BuyTokenModal from './components/BuyTokenModal'
import ListTransactionsModal from './components/ListTransactionsModal'
import Blink from './components/Blink'

const factoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export default function App() {
	const toast = useRef<Toast>(null)

	const [isBlocked, setBlocked] = useState<boolean>(false)
	const [provider, setProvider] = useState<ethers.BrowserProvider>()
	const [account, setAccount] = useState<ethers.JsonRpcSigner>()
	const [factory, setFactory] = useState<Factory>()
	const [fee, setFee] = useState<bigint>()
	const [tokens, setTokens] = useState<Map<string, TokenData>>(new Map())

	const [isCreateModalVisible, setCreateModalVisible] = useState<boolean>(false)
	const [isCreateButtonVisible, setCreateButtonVisible] = useState<boolean>(false)

	const [selectedToken, setSelectedToken] = useState<TokenData>()
	const [isBuyModalVisible, setBuyModalVisible] = useState<boolean>(false)
	const [isListTransactionsModalVisible, setListTransactionsModalVisible] = useState<boolean>(false)

	let MIN_TOTAL_SUPPLY: bigint = 0n
	let MAX_TOTAL_SUPPLY: bigint = 0n

	function getToken(address: string): Token {
		if (!provider) {
			throw new Error('Provider undefined')
		}
		const token = new ethers.Contract(address, TokenJson.abi, provider) as unknown as Token
		return token
	}
	
	const connectAccount = async () => {
		if (!provider) {
			return alert('Unable to connect account!')
		}

		setBlocked(true)

		const latestBlock = await provider.getBlockNumber()

		const account = await provider.getSigner()
		setAccount(account)

		//console.log(6662, 'accounts', await window.ethereum.request({ method: 'eth_requestAccounts' }), await provider.listAccounts())
		//setAccount(accounts[0])

		//const network = await provider.getNetwork()

		// check mismatch between deployed and compiled contracts
		const deployedContractCode = await provider.getCode(factoryAddress)
		const compiledContractCode = FactoryJson.deployedBytecode
		console.log('codes', deployedContractCode.toLowerCase() === compiledContractCode.toLowerCase())

		const factory = new ethers.Contract(factoryAddress, FactoryJson.abi, account) as unknown as Factory
		setFactory(factory)
		setCreateButtonVisible(true)
		//MIN_TOTAL_SUPPLY = await factory.MIN_TOTAL_SUPPLY()
		//MAX_TOTAL_SUPPLY = await factory.MAX_TOTAL_SUPPLY()

		const fee = await factory.fee()
		setFee(fee)

		//const owner = await factory.owner()
		//console.log('deployer', owner)

		const numTokens = await factory.getTokensLength()
		
		const tokenAddressesPromises: Array<Promise<string>> = []
		for (let i = 0; i < numTokens; i++) {
			const tokenAddress = factory.getToken(i)
			tokenAddressesPromises.push(tokenAddress)
		}
		const tokensAddresses = await Promise.all(tokenAddressesPromises)
		const initTokens: typeof tokens = new Map()
		for (const tokenAddress of tokensAddresses) {
			const token = getToken(tokenAddress)
			const tokenDatum: TokenData = {
				address: tokenAddress,
				available: await token.isAvailable(),
				cost: await token.getCost(),
				creatorAddress: await token.creator(),
				name: await token.name(),
				raised: await token.getRaised(),
				sold: await token.getSold(),
				symbol: await token.symbol(),
				totalSupply: await token.totalSupply(),
			}
			initTokens.set(tokenAddress, tokenDatum)
		}
		setTokens(initTokens)

		// events
		factory.on(factory.getEvent('Created'), async (tokenAddress, event) => {
			// event.blockNumber is always undefined on startup
			const eventBlock = await event.getBlock()
			if (eventBlock.number <= latestBlock) return

			const token = getToken(tokenAddress)
			const tokenDatum: TokenData = {
				address: tokenAddress,
				available: await token.isAvailable(),
				cost: await token.getCost(),
				creatorAddress: await token.creator(),
				name: await token.name(),
				raised: await token.getRaised(),
				sold: await token.getSold(),
				symbol: await token.symbol(),
				totalSupply: await token.totalSupply(),
			}
			setTokens(prev => new Map(prev).set(tokenAddress, tokenDatum))
			setBlocked(false)
			toast.current!.show({ severity: 'success', summary: 'Success', detail: 'Token created!' })
		})
		factory.on(factory.getEvent('Bought'), async (tokenAddress, amount, value, event) => {
			// event.blockNumber is always undefined on startup
			const eventBlock = await event.getBlock()
			if (eventBlock.number <= latestBlock) return

			const token = getToken(tokenAddress)
			const tokenDatum: Pick<TokenData, 'available' | 'sold' | 'raised'> = {
				available: await token.isAvailable(),
				sold: await token.getSold(),
				raised: await token.getRaised(),
			}
			let symbol: string | undefined = undefined
			setTokens(prev => {
				symbol = prev.get(tokenAddress)?.symbol
				return new Map(prev).set(tokenAddress, {
					...prev.get(tokenAddress)!,
					...tokenDatum,
				})
			})
			setBlocked(false)
			toast.current!.show({ severity: 'success', summary: 'Success', detail: `Bought ${ethers.formatEther(amount)} ${symbol} for €${ethers.formatEther(value)}` })
		})

		setBlocked(false)
	}

	const showAccount = () => {
		if (!provider) return `Contract not deployed`

		if (account) return `Address: ${shortenAddress(account.address)}`

		return <span className='font-italic cursor-pointer' onClick={connectAccount}>Connect</span>
	}

	const fetchProvider = async () => {
		console.log('Checking provider / wallet...')
		let provider: ethers.BrowserProvider
		if (!window.ethereum) {
			// If a wallet is not installed, throw error
			alert('No wallet installed, using read-only defaults')
			provider = new ethers.JsonRpcProvider('http://localhost:8545') as any
		} else {
			provider = new ethers.BrowserProvider(window.ethereum)
			//const provider = new ethers.JsonRpcProvider('http://localhost:8545')
		}

		setProvider(provider)
		const deployedContractCode = await provider.getCode(factoryAddress)
		if (deployedContractCode === '0x') {
			alert('No contract found, most likely it wasnt deployed, please deploy and refresh the page')
			return
		}

		//provider.on('debug', console.warn)
		//provider.on('error', console.error)

		// could use the following to cache blocks and prevent re-fetching
		/*provider.on('block', async (blockNumber) => {
			console.log(44, blockNumber)
		})*/
	}

	const createTokenFormSubmission = async (name?: string, symbol?: string, totalSupply?: number) => {
		if (!name || !symbol || !totalSupply) {
			toast.current!.show({ severity: 'error', summary: 'Error', detail: 'Name or Symbol or Total Supply are invalid' })
			return
		}

		try {
			const transaction = await factory!.connect(account).create(name, symbol, totalSupply, { value: fee })
			await transaction.wait()
		} catch (_e) {
			const e = _e as EthersError
			if (e.code === 'ACTION_REJECTED') {
				toast.current!.show({ severity: 'warn', summary: 'User rejected the transaction' })
			} else {
				toast.current!.show({ severity: 'error', summary: 'An error happened', detail: e.shortMessage })
			}
			return
		}

		setCreateModalVisible(false)
		setBlocked(true)
	}

	const buyToken = async (amount: number) => {
		if (!amount) {
			toast.current!.show({ severity: 'error', summary: 'Error', detail: 'Amount is invalid' })
			return
		}

		const token = getToken(selectedToken!.address)

		const totalCost = await token.getCost() * BigInt(amount)
		const parsedAmount = ethers.parseEther(String(amount))

		try {
			const transaction = await factory!.connect(await provider!.getSigner()).buy(selectedToken!.address, parsedAmount, { value: totalCost })
			await transaction.wait()
		} catch (_e) {
			const e = _e as EthersError
			if (e.code === 'ACTION_REJECTED') {
				toast.current!.show({ severity: 'warn', summary: 'User rejected the transaction' })
			} else {
				toast.current!.show({ severity: 'error', summary: 'An error happened', detail: e.shortMessage })
			}
			return
		}

		setSelectedToken(undefined)
		setBlocked(true)
	}

	useEffect(() => {
		(async () => {
			await fetchProvider()
		})()

		window.ethereum?.on('accountsChanged', async (accounts: Array<string>) => {
			if (!provider) return

			const account = await provider.getSigner()
			setAccount(account)
			console.log('event accountChanged', accounts)
		})

		/*window.ethereum?.on('networkChanged', async (networkId: string) => {
			console.log('event networkChanged', networkId)
		})*/
	}, [])	

	return (
		<PrimeReactProvider value={{ ripple: true }}>
			<Toast ref={toast} />
			<BlockUI blocked={isBlocked} fullScreen template={<i className={[Icon({ slug: 'spinner', spin: true }), 'text-8xl', 'text-primary-300'].join(' ')} />} />
			<main className='m-5 p-5 border-solid border-round border-primary bg-white'>
				<div className='m-6 mt-0 relative'>
					<div className='font-bold text-4xl text-center'>
						<Blink>Welcome to Tacs Memecoin Launchpad</Blink>
						<br /><Button icon={Icon({ slug: 'plus' })} onClick={() => setCreateModalVisible(true)} visible={isCreateButtonVisible} />
					</div>
					<div className='absolute right-0 top-0 pt-2'>
						<Badge value={showAccount()} />
					</div>
				</div>

				<div className='flex flex-wrap justify-content-between'>
					{Array.from(tokens.values()).reverse().map(token =>
						<ListItem
							key={token.address}
							setBuyModalVisible={setBuyModalVisible}
							setSelectedToken={setSelectedToken}
							setListTransactionsModalVisible={setListTransactionsModalVisible}
							token={token}
						/>
					)}
				</div>
			</main>

			<CreateTokenModal
				isVisible={isCreateModalVisible}
				min={MIN_TOTAL_SUPPLY}
				max={MAX_TOTAL_SUPPLY}
				setVisible={setCreateModalVisible}
				createTokenFormSubmission={createTokenFormSubmission}
			/>

			{selectedToken && isBuyModalVisible && <BuyTokenModal
				buyTokenFormSubmission={buyToken}
				isVisible={isBuyModalVisible}
				setVisible={setBuyModalVisible}
				token={selectedToken}
			/>}

			{selectedToken && isListTransactionsModalVisible && <ListTransactionsModal
				account={account!.address!}
				factory={factory!}
				isBlocked={isBlocked}
				isVisible={isListTransactionsModalVisible}
				provider={provider!}
				setBlocked={setBlocked}
				setVisible={setListTransactionsModalVisible}
				token={selectedToken}
			/>}
		</PrimeReactProvider>
	)
}