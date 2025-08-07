import { useEffect, useState, type ReactNode } from 'react'
import { Tooltip } from 'primereact/tooltip'
import { getRandomSlug } from '../helpers'

export default function Blink(props: {
	children: ReactNode
}) {
	const [isVisible, setVisible] = useState<boolean>(true)
	const [isCancelled, setCancelled] = useState<boolean>(true)

	const key = getRandomSlug()

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (isCancelled) {
				setVisible(true)
				return
			}

			setVisible(!isVisible)
		}, 200)
		return () => clearTimeout(timeout)
	}, [isVisible, isCancelled])

	return (
		<>
			<Tooltip target={`#${key}`} position='top'>
				Easter Egg! &lt;Blink&gt; look alike, click to toggle it!
			</Tooltip>
			<span
				id={key}
				style={{ opacity: isVisible ? 1 : 0 }}
				onClick={() => setCancelled(!isCancelled)}
			>{props.children}</span>
		</>
	)
}