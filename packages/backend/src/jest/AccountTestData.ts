import { Account } from '../app/core/entities/Account'
import { OutputError } from '../app/core/definitions/OutputError'

export class Accounts {
	static readonly BANK_ACCOUNT = new Account({
		userId: 1,
		name: 'Bank account',
		number: 1920,
	})

	static readonly INVOICE_IN = new Account({
		userId: 1,
		name: 'Invoice in',
		number: 2440,
	})

	static readonly VISA_ACCOUNT = new Account({
		userId: 1,
		name: 'Visa Account',
		number: 2499,
	})

	static readonly INVOICE_OUT = new Account({
		userId: 1,
		name: 'Invoice Out',
		number: 1511,
	})

	static readonly VAT_LOCAL_IN = new Account({
		userId: 1,
		name: 'VAT local in',
		number: 2640,
	})

	static readonly VAT_LOCAL_OUT = new Account({
		userId: 1,
		number: 2611,
		name: 'VAT local out',
		vatPercentage: 0.25,
	})

	static readonly VAT_ABROAD_IN = new Account({
		userId: 1,
		name: 'VAT abroad in',
		number: 2645,
	})

	static readonly VAT_ABROAD_OUT = new Account({
		userId: 1,
		number: 2614,
		name: 'VAT abroad out',
		vatPercentage: 0.25,
	})

	static readonly INCOME_LOCAL = new Account({
		userId: 1,
		number: 3001,
		name: 'Local income',
		vatAccount: Accounts.VAT_LOCAL_OUT,
	})

	static readonly EXPENSE_LOCAL = new Account({
		userId: 1,
		number: 5400,
		name: 'Local expense',
		vatAccount: Accounts.VAT_LOCAL_IN,
		vatPercentage: 0.25,
	})

	static readonly EXPENSE_LOCAL_MISSING_VAT = new Account({
		userId: 1,
		number: 5401,
		name: 'Expense local, missing VAT',
		vatAccount: Accounts.VAT_LOCAL_IN,
	})

	static readonly EXPENSE_ABROAD = new Account({
		userId: 1,
		number: 4661,
		name: 'Expense abroad',
		vatAccount: Accounts.VAT_ABROAD_IN,
		reverseVatAccount: Accounts.VAT_ABROAD_OUT,
	})

	static readonly EXPENSE_BANK = new Account({
		userId: 1,
		number: 6570,
		name: 'Expense bank',
	})

	/**
	 * Find the account with this account number in {Accounts}
	 * @param accountNumber the account number to find the account for
	 * @return account for this account number
	 * @throws {OutputErrors.accountNumberNotFound} if no account with the specified number was found
	 */
	static findByNumber(accountNumber: number): Account {
		for (const value of Object.values(Accounts)) {
			if (value instanceof Account) {
				if (value.number == accountNumber) {
					return value
				}
			}
		}
		throw OutputError.create(OutputError.Types.accountNumberNotFound, String(accountNumber))
	}
}
