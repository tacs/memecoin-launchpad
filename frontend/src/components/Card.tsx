import { Card as CardUI } from 'primereact/card'
import type { ReactNode } from 'react'

export default function Card(props: {
	children?: ReactNode
	footer?: ReactNode
	subtitle?: ReactNode
	title?: ReactNode
	width?: number
}) {
	return (
		<CardUI
			title={props.title}
			subTitle={props.subtitle}
			footer={<div className='flex flex-row gap-3 justify-content-center'>{props.footer}</div>}
			className={['shadow-8'].join(' ')}
			pt={{
				root: { style: { width: props.width ? `${props.width}px` : '' } },
				body: { className: ['p-0'].join(' ') },
				title: { className: ['m-0', 'p-3', 'bg-primary', 'border-round-top'].join(' ') },
				subTitle: { className: ['bg-primary-200', 'p-3', 'text-white', 'font-bold', !props.children ? 'border-round-bottom' : ''].join(' ') },
				content: { className: ['p-3', 'overflow-y-auto', !props.children ? 'hidden' : ''].join(' '), style: { maxHeight: '350px'} },
				footer: { className: ['bg-primary-100 p-3 text-center'].join(' ') },
			}}
		>
			<div className='flex flex-column gap-3 overflow-y-auto'>{props.children}</div>
		</CardUI>
	)
}