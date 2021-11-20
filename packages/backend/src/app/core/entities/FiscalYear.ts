import { UserEntity } from './UserEntity'
import { OutputError } from '../definitions/OutputError'
import { Consts } from '../definitions/Consts'
import '../definitions/String'

interface AccountBalance {
	accountNumber: number
	amount: bigint
}

export namespace FiscalYear {
	export interface Option extends UserEntity.Option {
		simpleName?: string
		from: string
		to: string
		startingBalances: AccountBalance[]
	}
}

export class FiscalYear extends UserEntity implements FiscalYear.Option {
	simpleName?: string
	from: string
	to: string
	startingBalances: AccountBalance[]

	constructor(data: FiscalYear.Option) {
		super(data)

		this.simpleName = data.simpleName
		this.from = data.from
		this.to = data.to
		this.startingBalances = data.startingBalances
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Name
		if (this.simpleName && this.simpleName.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ type: OutputError.Types.nameTooShort, data: this.simpleName })
		}

		// Dates
		if (!this.from.isValidIsoDate()) {
			errors.push({ type: OutputError.Types.dateFormatInvalid, data: this.from })
		}

		if (!this.to.isValidIsoDate()) {
			errors.push({ type: OutputError.Types.dateFormatInvalid, data: this.to })
		}

		// Date order
		const [first] = [this.from, this.to].sort()
		if (first !== this.from) {
			errors.push({ type: OutputError.Types.fiscalYearToBeforeFrom })
		}

		// Starting balances, account number
		for (const account of this.startingBalances) {
			if (account.accountNumber < Consts.ACCOUNT_NUMBER_START || Consts.ACCOUNT_NUMBER_END < account.accountNumber) {
				errors.push({ type: OutputError.Types.accountNumberOutOfRange, data: String(account.accountNumber) })
			}
		}

		return errors
	}
}
