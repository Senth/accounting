import { ApiCurrencyOutput } from './ApiCurrencyOutput'
import { Transaction } from '../../../../app/core/entities/Transaction'
import { Immutable } from '../../../../app/core/definitions/Immutable'

export interface ApiTransactionOutput {
	readonly accountNumber: number
	readonly currency: ApiCurrencyOutput
}

export namespace ApiTransactionOutput {
	export function fromTransaction(transaction: Immutable<Transaction>): Immutable<ApiTransactionOutput> {
		return {
			accountNumber: transaction.accountNumber,
			currency: ApiCurrencyOutput.fromCurrency(transaction.currency),
		}
	}
}
