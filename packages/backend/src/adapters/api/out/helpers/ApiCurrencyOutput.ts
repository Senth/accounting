import { Currency } from '../../../../app/core/entities/Currency'
import { Immutable } from '../../../../app/core/definitions/Immutable'

export interface ApiCurrencyOutput {
	readonly amount: bigint
	readonly localAmount?: bigint
	readonly code: string
	readonly localCode?: string
	readonly exchangeRate?: number
}

export namespace ApiCurrencyOutput {
	export function fromCurrency(currency: Immutable<Currency>): Immutable<ApiCurrencyOutput> {
		return {
			amount: currency.amount,
			localAmount: currency.localAmount,
			code: currency.code.name,
			localCode: currency.localCode ? currency.localCode.name : undefined,
			exchangeRate: currency.exchangeRate,
		}
	}
}
