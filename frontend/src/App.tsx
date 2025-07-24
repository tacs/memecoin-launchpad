import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
//import reactLogo from './assets/react.svg'

import { PrimeReactProvider } from 'primereact/api'
import 'primeflex/primeflex.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
// C:\Projects\voting\frontend\node_modules\primereact\resources\themes
import 'primereact/resources/themes/lara-light-pink/theme.css'

import { Badge } from 'primereact/badge'
import { BlockUI } from 'primereact/blockui'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dialog } from 'primereact/dialog'
import { FloatLabel } from 'primereact/floatlabel';
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast'

import { ethers } from 'ethers'

import { abi as FactoryAbi } from './../../backend/artifacts/contracts/tacs/Factory.sol/Factory.json'
import { type Factory } from './../../backend/typechain-types/contracts/tacs/Factory'
import { abi as TokenAbi } from './../../backend/artifacts/contracts/tacs/Token.sol/Token.json'
import { type Token } from './../../backend/typechain-types/contracts/tacs/Token'
import { Icon } from './Icon'

const factoryAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' // 0x5FbDB2315678afecb367f032d93F642f64180aa3

function readableAddress(address: string) {
	return address.slice(0, 6) + '...' + address.slice(address.length - 4)
}

type TokenToBuyType = { cost: bigint, token: Factory.TokenSaleStructOutput }

export default function App() {
	const toast = useRef<Toast>(null)

	const [isBlocked, setBlocked] = useState<boolean>(false);
	const [provider, setProvider] = useState<ethers.BrowserProvider>() //'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
	const [account, setAccount] = useState<ethers.JsonRpcSigner>()
	const [factory, setFactory] = useState<Factory>()
	const [fee, setFee] = useState<bigint>()
	const [owner, setOwner] = useState<string>()
	const [tokens, setTokens] = useState<Array<Factory.TokenSaleStructOutput>>([])
	const [isCreateModalVisible, setCreateModalVisible] = useState<boolean>(false)
	const [isCreateButtonVisible, setCreateButtonVisible] = useState<boolean>(false)
	const [isBuyModalVisible, setBuyModalVisible] = useState<boolean>(false)
	const [tokenToBuy, setTokenToBuy] = useState<TokenToBuyType>()
	const [tokenBuyAmount, setTokenBuyAmount] = useState<number>()

	const connectAccount = async () => {
		if (!provider) return alert('Unable to connect account!')

		const account = await provider.getSigner()
		setAccount(account)
		console.log(6661, 'account', account)

		const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
		console.log(6662, 'accounts', accounts)

		const network = await provider.getNetwork()
		console.log(6663, 'network', network)

		// check mismatch between deployed and compiled contracts
		//const deployedContractCode = await provider.getCode(account.address)
		//const compiledContractCode = (await ethers.getCon)

		const factory = new ethers.Contract(factoryAddress, FactoryAbi, provider) as unknown as Factory
		setFactory(factory)
		setCreateButtonVisible(true)
		console.log(6664, 'contract', factory)
		
		// events
		factory.on(factory.getEvent('Created'), async (token) => {
			const tokenData = await factory.getTokenSaleByAddress(token)
			setTokens([tokenData, ...tokens])
			setBlocked(false)
		})
		factory.on(factory.getEvent('Bought'), async (token, amount) => {
			const tt = await factory.getTokenSaleByAddress(token)
			console.log(88, tt.raised, tt.sold)
			setBlocked(false)
		})

		const fee = await factory.fee()
		setFee(fee)

		const owner = await factory.owner()
		setOwner(owner)

		const numTokens = await factory.getTokensLength()
		const tokenPromises: Array<Promise<Factory.TokenSaleStructOutput>> = []
		for (let i=0; i<numTokens; i++) {
			tokenPromises.push(factory.getTokenSaleByIdx(i))
		}
		const tokens = await Promise.all(tokenPromises)
		setTokens(tokens.reverse())
	}

	const showAccount = () => {
		if (account) return `Address: ${readableAddress(account.address)}`

		return <span className='font-italic cursor-pointer' onClick={connectAccount}>Connect</span>
	}

	const fetchProvider = async () => {
		if (!window.ethereum) {
			// If MetaMask is not installed, we use the default provider,
			// which is backed by a variety of third-party services (such
			// as INFURA). They do not have private keys installed,
			// so they only have read-only access
			console.log('MetaMask not installed, using read-only defaults')
			//setProvider(ethers.getDefaultProvider())

		} else {
			console.log('Checking MetaMask...')
			// Connect to the MetaMask EIP-1193 object. This is a standard
			// protocol that allows Ethers access to make all read-only
			// requests through MetaMask.
			const provider = new ethers.BrowserProvider(window.ethereum)
			setProvider(provider)

			// It also provides an opportunity to request access to write
			// operations, which will be performed by the private key
			// that MetaMask manages for the user.
			//const signer = await (provider as ethers.BrowserProvider).getSigner()

			//console.log(22, provider)
			//console.log(33, signer.address)
		}

		//console.log(22, provider)
		//console.log(33, signer.address)

		//await window.ethereum.request({ method: 'eth_requestAccounts'})

		//provider = new ethers.JsonRpcProvider('http://localhost:8545')
		//signer = await (provider as ethers.BrowserProvider).getSigner()

		//await window.ethereum.request({ method: 'eth_requestAccounts'})

		/*console.log(41, await provider.getBlockNumber())
		console.log(42, await provider.getBalance('ethers.eth'))
		console.log(43, ethers.formatEther(await provider.getBalance('ethers.eth')))*/
	}

	const createToken = async (form: FormData) => {
		const name = form.get('name')?.toString()
		const symbol = form.get('symbol')?.toString()

		if (!name || !symbol) {
			toast.current!.show({ severity: 'error', summary: 'Error', detail: 'Name or Symbol are invalid' });
			return
		}

		const transaction = await factory!.connect(account).create(name, symbol, { value: fee })
		await transaction.wait()

		setCreateModalVisible(false)
		setBlocked(true)
		toast.current!.show({ severity: 'success', summary: 'Success', detail: 'Token created!' })
	}

	const buyToken = async () => {
		if (!tokenBuyAmount) {
			toast.current!.show({ severity: 'error', summary: 'Error', detail: 'Amount is invalid' });
			return
		}

		const totalCost = tokenToBuy!.cost * BigInt(tokenBuyAmount)
		const parsedAmount = ethers.parseEther(String(tokenBuyAmount))
		
		//const t = new ethers.Contract(tokenToBuy!.token.token, TokenAbi, provider) as unknown as Token
		//t.name | t.symbol
		const transaction = await factory!.connect(account).buy(tokenToBuy!.token.token, parsedAmount, { value: totalCost })
		await transaction.wait()

		setBuyModalVisible(false)
		setBlocked(true)
		toast.current!.show({ severity: 'success', summary: 'Success', detail: `Bought ${parsedAmount} ${tokenToBuy!.token.name}` })
	}

	useEffect(() => {
		(async () => {
			await fetchProvider()
		})()
	}, [])

	return (
		<PrimeReactProvider value={{ ripple: true }}>
			<Toast ref={toast} />
			<BlockUI blocked={isBlocked}>
				<main className='m-5 p-5 border-solid border-round border-primary bg-white'>
					<div className='m-6 mt-0'>
						<div className='w-10 text-center font-bold inline-block text-4xl'>
							Welcome!!
							<br/><Button icon={Icon({ slug: 'plus' })} onClick={() => setCreateModalVisible(true)} visible={isCreateButtonVisible} />
						</div>
						<div className='w-2 inline-block text-right vertical-align-super'>
							<Badge value={showAccount()} />
						</div>
					</div>

					<div className='flex flex-wrap'>
						{ tokens.map(token =>
							<TokenItem
								key={token.name} factory={factory!} token={token}
								setBuyModalVisible={setBuyModalVisible}
								setTokenToBuy={setTokenToBuy}
							/>
						)}
					</div>
				</main>

				<Dialog
					header='Create new token' style={{ width: '300px' }} draggable={false}
					visible={isCreateModalVisible}
					onHide={() => {if (!isCreateModalVisible) return; setCreateModalVisible(false); }}>
					<div className='m-0'>
						<form action={createToken}>
							<div className='flex flex-column align-items-center gap-5 pt-4'>
								<FloatLabel>
									<InputText name='name' maxLength={20} />
									<label htmlFor='name'>Name</label>
								</FloatLabel>
								<FloatLabel>
									<InputText name='symbol' minLength={3} maxLength={5} />
									<label htmlFor='symbol'>Symbol</label>
								</FloatLabel>
								<Button type='submit' label='Create' />
							</div>
						</form>
					</div>
				</Dialog>

				<Dialog
					header={`Buy ${tokenToBuy?.token.name}`} style={{ width: '300px' }} draggable={false}
					visible={isBuyModalVisible}
					onHide={() => {if (!isBuyModalVisible) return; setBuyModalVisible(false); }}>
					<div className='m-0'>
						<form action={buyToken}>
							<div className='flex flex-column align-items-center gap-5 pt-4'>
								<FloatLabel>
									<InputNumber name='amount' onValueChange={e => setTokenBuyAmount(e.value ?? 0)} />
									<label htmlFor='amount'>Amount</label>
								</FloatLabel>
								<Button type='submit' label='Buy' />
							</div>
						</form>
					</div>
				</Dialog>
			</BlockUI>
		</PrimeReactProvider>
	)
}

function TokenItem(params: {
	factory: Factory
	setBuyModalVisible: Dispatch<SetStateAction<boolean>>
	setTokenToBuy: Dispatch<SetStateAction<TokenToBuyType | undefined>>
	token: Factory.TokenSaleStructOutput
}) {
	const { factory, setBuyModalVisible, setTokenToBuy, token } = params

	const [cost, setCost] = useState<bigint>()

	useEffect(() => {
		(async () => {
			const cost = await factory!.getCost(token.sold)
			setCost(cost)
		})()
	}, [])

	// flex align-items-center justify-content-center bg-primary font-bold m-2 border-round

	return (
		<div className='flex m-4' key={token.name}>
			<Card
				title='Symbol'
				subTitle={token.name}
				className={['shadow-8'].join(' ')}
				pt={{
					body: { className: ['p-0'].join(' ') },
					title: { className: ['m-0', 'p-3', 'bg-primary', 'border-round-top'].join(' ') },
					subTitle: { className: ['bg-primary-100', 'p-3'].join(' ') },
					content: { className: ['p-3'].join(' ') },
					footer: { className: ['p-3'].join(' ') },
				}}
			>
				<div className='flex flex-column gap-3'>
					<div><b>Creator:</b> {readableAddress(token.creator)}</div>
					<div><b>Market cap:</b> €{ethers.formatEther(token.raised)} eth</div>
					<div><b>Cost:</b> {cost && ethers.formatEther(cost)}</div>
					<div><Button icon={Icon({ slug: 'shopping-cart' })} onClick={() => { setTokenToBuy({ cost: cost!, token }); setBuyModalVisible(true); }}/></div>
				</div>
			</Card>
		</div>
	)
}