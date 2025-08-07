import { type Dispatch, type SetStateAction } from 'react'
import { ethers } from 'ethers'

import { Button } from 'primereact/button'
import Card from './Card'

import { Icon, type TokenData } from '../helpers'
import ShortenAddressPretty from './ShortenAddressPretty'

export default function ListItem(props: {
	setBuyModalVisible: Dispatch<SetStateAction<boolean>>
	setSelectedToken: Dispatch<SetStateAction<TokenData | undefined>>
	setListTransactionsModalVisible: Dispatch<SetStateAction<boolean>>
	token: TokenData
}) {
	const isAvailable = props.token.available
	
	return (
		<div className='flex m-3' key={props.token.name}>
			<Card
				title={props.token.symbol}
				subtitle={props.token.name}
				footer={
					<>
						{isAvailable && (<Button tooltip='Buy' tooltipOptions={{ position: 'bottom' }} icon={Icon({ slug: 'shopping-cart' })} onClick={() => { props.setSelectedToken(props.token); props.setBuyModalVisible(true); }} />)}
						<Button tooltip='Transactions' tooltipOptions={{ position: 'bottom' }} icon={Icon({ slug: 'arrow-right-arrow-left' })} onClick={() => { props.setSelectedToken(props.token); props.setListTransactionsModalVisible(true); }} />
					</>
				}
				width={250}
			>
				<div><b>Address:</b> {<ShortenAddressPretty address={props.token.address} />}</div>
				<div><b>Creator:</b> {<ShortenAddressPretty address={props.token.creatorAddress} />}</div>
				<div><b>Total supply:</b> {ethers.formatEther(String(props.token.totalSupply))} eth</div>
				<div><b>Market cap:</b> {ethers.formatEther(String(props.token.raised))} eth</div>
				<div><b>Sold:</b> {ethers.formatEther(String(props.token.sold))} eth</div>
				<div><b>Cost:</b> €{ethers.formatEther(props.token.cost)}</div>
				<div><b>Available:</b> {isAvailable ? 'Yes': 'No'} <i className={[Icon({ slug: isAvailable ? 'unlock' : 'lock' }), isAvailable ? 'text-green-400' : 'text-red-400'].join(' ')} /></div>
			</Card>
		</div>
	)
}