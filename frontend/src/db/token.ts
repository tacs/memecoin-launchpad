import { Entity } from 'dexie'
import type { Db } from './index'

export default class Token extends Entity<Db> {
	public address!: string
	public available!: boolean
	public name!: string
	public raised!: bigint
	public sold!: bigint
	public symbol!: string
}