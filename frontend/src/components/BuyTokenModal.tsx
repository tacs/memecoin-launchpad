import { useRef, useState, type Dispatch, type SetStateAction } from 'react'

import { Button } from 'primereact/button'
import { FloatLabel } from 'primereact/floatlabel'
import { InputNumber, type InputNumberChangeEvent } from 'primereact/inputnumber'

import Modal from './Modal'
import { prettyEther, type TokenData } from '../helpers'

export default function BuyTokenModal(props: {
	buyTokenFormSubmission: (amount: number) => Promise<void>
	isVisible: boolean
	setVisible: Dispatch<SetStateAction<boolean>>
	token: TokenData
}) {
	const amountRef = useRef<InputNumber>(null)
	const [amount, setAmount] = useState<number>(0)
	const minAmount = 1
	const maxAmount = 100

	const onChange = (e: InputNumberChangeEvent) => {
		const v = e.value ?? 0
		if (v >= minAmount && v <= maxAmount) {
			setAmount(v)
		}
	}

	return (
		<Modal
			header={<div>Buy {props.token.symbol}<br/>({props.token.name})</div>}
			footer={<Button type='button' label='Buy' onClick={() => props.buyTokenFormSubmission(amount)} />}
			isVisible={props.isVisible}
			setVisible={props.setVisible}
			onShow={() => amountRef.current?.focus() }
			width={280}
		>
			<>
				<div className='w-full'>
					<div>
						<div className='w-6 text-right inline-block font-bold'>Per token (€):</div>
						<div className='w-6 text-left inline-block pl-1'>{prettyEther(props.token.cost, false)}</div>
					</div>
					<div className='mt-2 text-primary'>
						<div className='w-6 text-right inline-block font-bold'>Total est. (€):</div>
						<div className='w-6 text-left inline-block pl-1'>{prettyEther(props.token.cost * BigInt(amount), false)}</div>
					</div>
				</div>

				<FloatLabel className='mt-4'>
					<InputNumber ref={amountRef} value={amount} min={minAmount} max={maxAmount} onChange={e => onChange(e)} />
					<label>Amount</label>
				</FloatLabel>
			</>
		</Modal>
	)
}