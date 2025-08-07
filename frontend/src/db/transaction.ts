import { Entity } from 'dexie'
import type { Db } from './index'

export default class Transaction extends Entity<Db> {
	public hash!: string
	public tokenAddress!: string
	public event!: 'Created' | 'Bought'
	public blockNumber!: number
	public boughtDetails?: {
		amount: bigint
		value: bigint
	}
	public from!: string
	public gas!: bigint
	public timestamp!: number
	public to!: string
}