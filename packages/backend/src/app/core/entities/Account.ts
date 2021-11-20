import { OutputError } from '../definitions/OutputError'
import { Consts } from '../definitions/Consts'
import { UserEntity } from './UserEntity'

export namespace Account {
	export interface Option extends UserEntity.Option {
		number: number
		name: string
		vatCode?: number
		vatPercentage?: number
		vatAccount?: number | Account
		reverseVatAccount?: number | Account
	}
}

export class Account extends UserEntity implements Account.Option {
	number: number
	name: string
	vatCode?: number
	vatPercentage?: number
	vatAccount?: number | Account
	reverseVatAccount?: number | Account

	constructor(data: Account.Option) {
		super(data)
		this.number = data.number
		this.name = data.name
		this.vatCode = data.vatCode
		this.vatPercentage = data.vatPercentage
		this.vatAccount = data.vatAccount
		this.reverseVatAccount = data.reverseVatAccount
	}

	static validateNumber(accountNumber: number, errors: OutputError.Info[]) {
		// Account number - Check that the account number is valid
		if (accountNumber < Consts.ACCOUNT_NUMBER_START || accountNumber > Consts.ACCOUNT_NUMBER_END) {
			errors.push({
				type: OutputError.Types.accountNumberOutOfRange,
				data: `${accountNumber}`,
			})
		}

		// Account number is floating point
		if (!Number.isInteger(accountNumber)) {
			errors.push({
				type: OutputError.Types.accountNumberInvalidFormat,
				data: `${accountNumber}`,
			})
		}
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Validate number
		Account.validateNumber(this.number, errors)

		// Validate name
		if (this.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ type: OutputError.Types.nameTooShort, data: this.name })
		}

		return errors
	}
}
