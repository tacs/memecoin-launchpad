import Dexie, { type EntityTable } from 'dexie'
import Config from './config'
//import Token from './token'
import Transaction from './transaction'

export class Db extends Dexie {
	configs!: EntityTable<Config, 'slug'>
	//tokens!: EntityTable<Token, 'address'>
	transactions!: EntityTable<Transaction, 'hash'>

	constructor() {
		super('Appy')
		this.version(1).stores({
			//tacs: '++id,name',
			configs: 'slug,value',
			//tokens: 'address,available,name,raised,sold,symbol',
			transactions: 'hash,tokenAddress,event,blockNumber,boughtDetails,from,gas,timestamp,to',
		})
		this.configs.mapToClass(Config)
		//this.tokens.mapToClass(Token)
		this.transactions.mapToClass(Transaction)
	}
}

export default new Db()