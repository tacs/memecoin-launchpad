import { useEffect, useState } from 'react'
import { Tooltip } from 'primereact/tooltip'
import { getRandomSlug, shortenAddress } from '../helpers'

export default function ShortenAddressPretty(props: {
	address: string
}) {
	const [isCopied, setIsCopied] = useState<boolean>(false)

	const key = getRandomSlug()

	useEffect(() => {
		if (!isCopied) return

		setTimeout(() => setIsCopied(false), 1000)
	}, [isCopied])

	return (
		<span
			className='cursor-pointer'
			onClick={() => { navigator.clipboard.writeText(props.address); setIsCopied(true) }}
		>
			<Tooltip target={`#${key}`} position='right'>
				{props.address}
				<div className='text-xs text-primary'>{isCopied ? 'Copied to clipboard!' : 'Click to copy'}</div>
			</Tooltip>
			<span id={key}><u className='text-primary'>{shortenAddress(props.address)}</u></span>
		</span>
	)
}