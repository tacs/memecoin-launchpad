import { useState, type Dispatch, type SetStateAction } from 'react'

import { Button } from 'primereact/button'
import { FloatLabel } from 'primereact/floatlabel'
import { InputNumber, type InputNumberChangeEvent } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'

import Modal from './Modal'
import { getRandomSlug } from '../helpers'

export default function CreateTokenModal(props: {
	createTokenFormSubmission: (name?: string, symbol?: string, totalSupply?: number) => Promise<void>
	isVisible: boolean
	min: bigint
	max: bigint
	setVisible: Dispatch<SetStateAction<boolean>>
}) {
	const [name, setName] = useState<string>()
	const [symbol, setSymbol] = useState<string>()
	const [totalSupply, setTotalSupply] = useState<number>(0)

	const nameKey = getRandomSlug()
	const symbolKey = getRandomSlug()
	const totalSupplyKey = getRandomSlug()

	const onChange = (e: InputNumberChangeEvent) => {
		const v = e.value ?? 0
		if (v >= props.min && v <= props.max) {
			setTotalSupply(v)
		}
	}

	return (
		<Modal
			header='Create new token'
			footer={<Button type='button' label='Create' onClick={() => props.createTokenFormSubmission(name, symbol, totalSupply)}/>}
			isVisible={props.isVisible}
			setVisible={props.setVisible}
			
			width={280}
		>
			<>
				<FloatLabel className='mt-4'>
					<InputText id={nameKey} maxLength={20} onChange={e => setName(e.target.value)} />
					<label htmlFor={nameKey}>Name</label>
				</FloatLabel>
				<FloatLabel className='mt-3'>
					<InputText id={symbolKey} minLength={3} maxLength={5} onChange={e => setSymbol(e.target.value)} />
					<label htmlFor={symbolKey}>Symbol</label>
				</FloatLabel>
				<FloatLabel className='mt-3'>
					<InputNumber id={totalSupplyKey} min={Number(props.min)} max={Number(props.max)} onChange={e => onChange(e)} />
					<label htmlFor={totalSupplyKey}>Total Supply</label>
				</FloatLabel>
			</>
		</Modal>
	)
}