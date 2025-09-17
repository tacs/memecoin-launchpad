import { ethers } from 'ethers'

export type TokenData = {
	address: string
	available: boolean
	cost: bigint
	creatorAddress: string
	name: string
	raised: bigint
	sold: bigint
	symbol: string
	totalSupply: bigint
}

export function getRandomSlug() {
	return 'k' + String(Math.round(Math.random() * 1000000))
}

export function prettyEther(value: bigint, addSuffix: boolean = true) {
	const [integer, decimal] = ethers.formatEther(value).split('.')
	const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
	const number = decimal && Number(decimal) !== 0 ? `${formattedInteger}.${decimal}` : formattedInteger
	const suffix = addSuffix ? ' ETH' : ''
	return number + suffix
}

export function dateToString(timestamp: number) {
	return new Date(timestamp * 1000).toLocaleString()
}

export function shortenAddress(address: string) {
	return address.slice(0, 6) + '...' + address.slice(address.length - 4)
}

type Slug = 'plus' | 'shopping-cart' | 'arrow-right-arrow-left' | 'spinner' | 'lock' | 'unlock'
export function Icon(params: { slug: Slug, spin?: boolean }) {
	return ['pi', `pi-${params.slug}`, params.spin && 'pi-spin'].join(' ')
}