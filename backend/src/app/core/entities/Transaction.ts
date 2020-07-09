import { Entity } from './Entity'
import { EntityErrors } from '../definitions/EntityErrors'
import { Immutable } from '../definitions/Immutable'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { Account } from './Account'

export namespace Transaction {
	export interface Option extends Entity.Option {
		accountNumber: number
		currency: Currency
	}
}

export type ImmutableTransaction = Immutable<Transaction>

export class Transaction extends Entity implements Transaction.Option {
	accountNumber: number
	currency: Currency

	constructor(data: Transaction.Option) {
		super(data)
		this.accountNumber = data.accountNumber
		this.currency = data.currency
	}

	/**
	 * If an exchange rate is set it calculates the local amount from amount * exchange rate and rounds the result up
	 * @return local amount
	 */
	getLocalAmount(): Currency {
		return Transaction.getLocalAmount(this)
	}

	static getLocalAmount(transaction: Transaction): Currency {
		return transaction.currency.getLocalCurrency()
	}

	/**
	 * @return the local currency code if it exists. undefined if it doesn't exist
	 */
	getLocalCurrencyCode(): Currency.Code | undefined {
		return this.currency.localCode
	}

	/**
	 * @return the currency code for this transaction
	 */
	getCurrencyCode(): Currency.Code {
		return this.currency.code
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		Account.validateNumber(this.accountNumber, errors)

		// Amount original - Checks so the amount isn't exactly 0
		if (this.currency.isZero()) {
			errors.push({ error: EntityErrors.amountIsZero })
		}

		return errors
	}
}
