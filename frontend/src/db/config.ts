import { Entity } from 'dexie'
import type { Db } from './index'

export default class Config extends Entity<Db> {
	public slug!: 'latestBlockNumber'
	public value!: any
}