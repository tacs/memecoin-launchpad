import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Block, ethers } from 'ethers'

import { Accordion, AccordionTab } from 'primereact/accordion'
import { Dropdown } from 'primereact/dropdown'
import type { SelectItem } from 'primereact/selectitem'
import { Calendar } from 'primereact/calendar'
import { FloatLabel } from 'primereact/floatlabel'

import db from './../db'
import Modal from './Modal'
import ShortenAddressPretty from './ShortenAddressPretty'
import { dateToString, getRandomSlug, shortenAddress, showFullDecimals, type TokenData } from '../helpers'
import type { Factory } from '../../../backend/typechain-types/contracts/Factory'

type TxType = {
	event: 'Created' | 'Bought'
	from: string
	hash: string
	gas: bigint
	timestamp: number
	to: string
	boughtDetails?: {
		amount: bigint
		value: bigint
	}
}

export default function ListTransactionsModal(props: {
	account: string
	factory: Factory
	isBlocked: boolean
	isVisible: boolean
	provider: ethers.BrowserProvider
	setBlocked: Dispatch<SetStateAction<boolean>>
	setVisible: Dispatch<SetStateAction<boolean>>
	token: TokenData
}) {
	const [txs, setTxs] = useState<Array<TxType>>([])
	const [filteredTxs, setFilteredTxs] = useState<Array<TxType>>([])
	const [owners, setOwners] = useState<Array<Pick<SelectItem, 'className'> & Required<Pick<SelectItem, 'label' | 'value'>>>>([])
	const [selectedOwner, setSelectedOwner] = useState<string>()
	const [dateFrom, setDateFrom] = useState<Date>()
	const [dateTo, setDateTo] = useState<Date>()

	const ownerFilterKey = getRandomSlug()
	const dateFromKey = getRandomSlug()
	const dateToKey = getRandomSlug()

	useEffect(() => {
		(async () => {
			props.setBlocked(true)
			
			const initTxs: typeof txs = []
			const initOwners: Map<typeof owners[0]['value'], boolean> = new Map()
			// add current account to the top of the list
			initOwners.set(props.account, true)
			
			//const balance = ethers.formatEther(await props.provider.getBalance(props.account))
			const currentBlockNumber = await props.provider.getBlockNumber()

			// a simple block map to prevent re-fetching the same blocks, since a block can have multiple transactions and events
			const blocks: Record<number, Block> = {}
			const getBlock = async (blockNumber: number) => {
				if (!blocks[blockNumber]) {
					blocks[blockNumber] = (await props.provider.getBlock(blockNumber))!
				}
				return blocks[blockNumber]
			}

			const dbLatestBlock = Number(((await db.configs.get('latestBlockNumber'))?.value) ?? 0)
			// if there's block number stored, then fetch all the transactions stored
			if (dbLatestBlock > 0) {
				(await db.transactions.filter(tx => tx.tokenAddress === props.token.address).sortBy('timestamp')).forEach(tx => {
					initTxs.push(tx)
					initOwners.set(tx.from, true)
				})
			}

			// check if there are new transactions, if so, fetch and cache them
			if (dbLatestBlock < currentBlockNumber) {
				const events = await props.provider.getLogs({
					fromBlock: dbLatestBlock + 1,
					toBlock: currentBlockNumber,
					topics: [[
						props.factory.interface.getEvent('Created').topicHash,
						props.factory.interface.getEvent('Bought').topicHash
					]],
				})
				for (const event of events) {
					//const tx2 = props.factory.interface.parseTransaction({ data: tx.data })!
					const block = await getBlock(event.blockNumber)
					const eventData = props.factory.interface.parseLog(event)!
					const tokenAddress: string = eventData.args[0]
					const tx = await event.getTransactionReceipt()
					const txData: TxType = {
						event: eventData.name as any,
						from: tx.from,
						gas: tx.gasPrice,
						hash: tx.hash,
						timestamp: block.timestamp,
						to: tx.to!,
					}
					if (txData.event === 'Bought') {
						const amount = eventData.args[1]
						const value = eventData.args[2]
						txData.boughtDetails = {
							amount,
							value,
						}
					}
					if (tokenAddress === props.token.address) {
						initTxs.push(txData)
						initOwners.set(tx.from, true)
					}
					await db.transactions.add({
						...txData,
						blockNumber: block.number,
						tokenAddress,
					}, tokenAddress)
				}

				// save last block number
				await db.configs.put({ slug: 'latestBlockNumber', value: currentBlockNumber })
			}

			/*const eventsCreated = await props.provider.getLogs({ fromBlock: 1, toBlock: currentBlockNumber, topics: [props.factory.interface.getEvent('Created').topicHash] })
			for (const eventCreated of eventsCreated) {
				//const tx2 = props.factory.interface.parseTransaction({ data: tx.data })!
				const block = await getBlock(eventCreated.blockNumber)
				const event = props.factory.interface.parseLog(eventCreated)!
				const tokenAddress: string = event.args[0]
				if (tokenAddress === props.token.address) {
					const tx = await eventCreated.getTransactionReceipt()
					initTxs.push({
						event: 'created',
						from: tx.from,
						gas: tx.gasPrice,
						hash: tx.hash,
						timestamp: block.timestamp,
						to: tx.to!,
					})
					initOwners.set(tx.from, true)
				}
			}

			const eventsBuy = await props.provider.getLogs({ fromBlock: 1, toBlock: currentBlockNumber, topics: [props.factory.interface.getEvent('Bought').topicHash] })
			for (const eventBuy of eventsBuy) {
				const block = await getBlock(eventBuy.blockNumber)
				const event = props.factory.interface.parseLog(eventBuy)!
				const tokenAddress: string = event.args[0]
				if (tokenAddress === props.token.address) {
					const tx = await eventBuy.getTransactionReceipt()
					const amount = event.args[1]
					const value = event.args[2]
					initTxs.push({
						boughtDetails: {
							amount,
							value,
						},
						event: 'bought',
						from: tx.from,
						gas: tx.gasUsed,
						hash: tx.hash,
						timestamp: block.timestamp,
						to: tx.to!,
					})
					initOwners.set(tx.from, true)
				}
			}*/

			setTxs(initTxs.reverse())
			setOwners(Array.from(initOwners.keys()).map(owner => ({
				//className: [owner === props.account ? 'bg-primary' : ''].join(' '),
				label: shortenAddress(owner) + (owner === props.account ? ' (you)' : ''),
				value: owner,
			})))
			props.setBlocked(false)
		})()
	}, [])

	useEffect(function filterTransactions() {
		setFilteredTxs(txs.filter(tx => {
			const isOwnerValid = !selectedOwner || tx.from === selectedOwner
			const isFromDateValid = !dateFrom || tx.timestamp*1000 >= dateFrom.getTime()
			const isToDateValid = !dateTo || tx.timestamp*1000 <= dateTo.getTime()
			return isOwnerValid && isFromDateValid && isToDateValid
		}))
	}, [txs, selectedOwner, dateFrom, dateTo])

	const subheader = (
		<div className='w-full flex flex-row justify-content-between mt-3'>
			<FloatLabel>
				<Dropdown
					inputId={ownerFilterKey}
					value={selectedOwner}
					onChange={e => setSelectedOwner(e.value)}
					options={owners}
					filter
					showClear
					className='flex align-items-center justify-content-center'
					pt={{ root: { style: { width: '200px' }}, panel: { style: { width: '150px' }}}}
				/>
				<label htmlFor={ownerFilterKey}>Owner</label>
			</FloatLabel>
			<FloatLabel>
				<Calendar
						inputId={dateFromKey}
						value={dateFrom}
						onChange={e => setDateFrom(e.value ?? undefined)}
						hideOnDateTimeSelect
						showTime
						showButtonBar
						readOnlyInput={true}
						pt={{ root: { style: { width: '160px' }}}}
					/>
				<label htmlFor={dateFromKey}>From</label>
			</FloatLabel>
			<FloatLabel>
				<Calendar
					inputId={dateToKey}
					value={dateTo}
					onChange={e => setDateTo(e.value ?? undefined)}
					hideOnDateTimeSelect
					showTime
					showButtonBar
					readOnlyInput={true}
					pt={{ root: { style: { width: '160px' }}}}
				/>
				<label htmlFor={dateToKey}>To</label>
			</FloatLabel>
		</div>
	)

	return (!props.isBlocked &&
		<Modal
			header={<div>Transactions for {props.token.symbol}<br/>({props.token.name})</div>}
			subheader={subheader}
			isVisible={props.isVisible}
			setVisible={props.setVisible}
			width={600}
		>
			<Accordion>
				{filteredTxs.map(tx => (
					<AccordionTab
						key={tx.hash}
						header={<AccordionHeader tx={tx} />}
						pt={{ headerAction: { className: [tx.from===props.account ? 'border-primary border-1' : ''].join(' ') } }}
					>
						<div className='w-full mb-2'>
							<>
								<AccordionContentItem label='Hash' value={<ShortenAddressPretty address={tx.hash} />} />
							</>
							{tx.event === 'Created' &&
								<>
									<AccordionContentItem label='Owner' value={<ShortenAddressPretty address={tx.from} />} />
								</>
							}
							{tx.event === 'Bought' &&
								<>
									<AccordionContentItem label='From' value={<ShortenAddressPretty address={tx.from} />} />
									<AccordionContentItem label='Gas used' value={ethers.formatEther(tx.gas)} />
									<AccordionContentItem label='Amount' value={showFullDecimals(ethers.formatEther(tx.boughtDetails!.amount!)) + ' ETH'} />
									<AccordionContentItem label='Value' value={'€ ' + ethers.formatEther(tx.boughtDetails!.value!)} />
								</>
							}
							<AccordionContentItem label='Timestamp' value={dateToString(tx.timestamp)} />
						</div>
					</AccordionTab>
				))}
			</Accordion>
		</Modal>
	)
}

function AccordionHeader(props: {
	tx: TxType
}) {
	return (
		<div>
			<div className='inline-block w-2'>{props.tx.event[0].toUpperCase() + props.tx.event.substring(1)}</div>
			<div className='inline-block w-5 text-center'>{props.tx.event === 'Bought' && ethers.formatEther(props.tx.boughtDetails!.amount).concat(' ETH')}</div>
			<div className='inline-block w-5 text-right'>{dateToString(props.tx.timestamp)}</div>
		</div>
	)
}

function AccordionContentItem(props: {
	label: string
	value: any
}) {
	return (
		<div className='mt-2'>
			<div className='w-5 text-right inline-block font-bold'>{props.label}:</div>
			<div className='w-7 text-left inline-block pl-1'>{props.value}</div>
		</div>
	)
}