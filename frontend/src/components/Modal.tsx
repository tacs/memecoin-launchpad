import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Dialog as DialogUI } from 'primereact/dialog'
import { Button } from 'primereact/button'
import Card from './Card'

export default function Modal(props: {
	children: ReactNode
	footer?: ReactNode
	header: ReactNode
	onShow?: () => unknown
	subheader?: ReactNode
	width?: number
	isVisible: boolean
	setVisible: Dispatch<SetStateAction<boolean>>
}) {
	const footer = (
		<>
			{props.footer}
			<Button type='button' label='Close!' onClick={() => props.setVisible(false)} />
		</>
	)
	const content = (
		<Card
			title={props.header}
			subtitle={props.subheader}
			footer={footer}
		>{props.children}</Card>
	)

	return (
		/*<DialogUI
			header={props.header}
			footer={props.footer}
			style={{ width: (props.width ?? 400)+'px' }}
			draggable={false}
			blockScroll={true}
			dismissableMask={true}
			visible={props.isVisible}
			onHide={() => props.setVisible(false)}
			onShow={() => props.onShow?.()}
			pt={{
				closeButton: { className: 'bg-primary-reverse' },
				footer: { className: 'text-center pt-3 border-primary border-top-1' },
				header: { className: 'bg-primary' },
			}}
		>
			<div className='m-0'>
				<div className='flex flex-column align-items-center gap-5'>
					{props.children}
				</div>
			</div>
		</DialogUI>*/
		<DialogUI
			header={props.header}
			footer={props.footer}
			style={{ width: (props.width ?? 400)+'px' }}
			draggable={false}
			blockScroll={true}
			dismissableMask={true}
			visible={props.isVisible}
			onHide={() => props.setVisible(false)}
			onShow={() => props.onShow?.()}
			content={content}
			pt={{
				closeButton: { className: 'bg-primary-reverse' },
				footer: { className: 'text-center pt-3 border-primary border-top-1' },
				header: { className: 'bg-primary' },
			}}
		/>
	)
}