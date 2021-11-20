import { Entity } from './Entity'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { v4 as uuidv4 } from 'uuid'

export namespace User {
	export interface Option extends Entity.Option {
		email: string
		firstName: string
		lastName: string
		localCurrencyCode: Currency.Codes | string
		apiKey?: string
	}
}

export class User extends Entity implements User.Option {
	email: string
	firstName: string
	lastName: string
	localCurrencyCode: Currency.Codes
	apiKey: string

	constructor(data: User.Option) {
		super(data)

		this.email = data.email
		this.firstName = data.firstName
		this.lastName = data.lastName

		if (data.apiKey) {
			this.apiKey = data.apiKey
		} else {
			this.apiKey = uuidv4()
		}

		if (typeof data.localCurrencyCode === 'string') {
			const code = Currency.Codes.fromString(data.localCurrencyCode)
			if (!code) {
				throw OutputError.create(OutputError.Types.currencyCodeInvalid, data.localCurrencyCode)
			}
			this.localCurrencyCode = code
		} else {
			this.localCurrencyCode = data.localCurrencyCode
		}
	}
}
