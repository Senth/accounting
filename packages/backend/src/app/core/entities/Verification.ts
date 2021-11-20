import { Transaction } from './Transaction'
import { Id } from '../definitions/Id'
import { Currency } from './Currency'
import { Consts } from '../definitions/Consts'
import '../definitions/String'
import { OutputError } from '../definitions/OutputError'
import { UserEntity } from './UserEntity'
import { verify } from 'crypto'

export namespace Verification {
	export interface Option extends UserEntity.Option {
		name: string
		internalName?: string
		number?: number
		date: string
		dateFiled?: number
		type: Types
		description?: string
		totalAmount?: Currency.Option
		files?: string[]
		invoiceId?: Id
		paymentId?: Id
		fiscalYearId?: Id
		requireConfirmation?: boolean
		transactions: Transaction.Option[]
	}

	export interface Comparable {
		readonly id?: Id
		readonly userId: Id
		readonly internalName?: string
		readonly date: string
		readonly type: Types
		readonly totalAmount: Currency.Option

		isEqualTo(other: Comparable): boolean
	}
}

export class Verification extends UserEntity implements Verification.Option {
	name: string
	internalName?: string
	number?: number
	date: string
	dateFiled?: number
	type: Verification.Types
	description?: string
	totalAmount: Currency
	files?: string[]
	invoiceId?: Id
	paymentId?: Id
	fiscalYearId?: Id
	requireConfirmation?: boolean
	transactions: Transaction[]

	constructor(data: Verification.Option) {
		super(data)

		this.name = data.name
		this.internalName = data.internalName
		this.number = data.number
		this.date = data.date
		this.dateFiled = data.dateFiled
		this.type = data.type
		this.description = data.description
		this.invoiceId = data.invoiceId
		this.paymentId = data.paymentId
		this.fiscalYearId = data.fiscalYearId
		this.requireConfirmation = data.requireConfirmation
		this.transactions = []

		// Create new array for files
		if (data.files) {
			this.files = data.files.concat()
		}

		// Deep copy transactions
		for (let transaction of data.transactions) {
			let transactionInstance: Transaction
			if (transaction instanceof Transaction) {
				transactionInstance = transaction
			} else {
				transactionInstance = new Transaction(transaction)
			}
			this.transactions.push(transactionInstance)
		}

		// Calculate total amount
		if (typeof data.totalAmount === 'undefined') {
			this.totalAmount = this.getLargestAmount()
		} else {
			if (data.totalAmount instanceof Currency) {
				this.totalAmount = data.totalAmount
			} else {
				this.totalAmount = new Currency(data.totalAmount)
			}
		}
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Name
		if (this.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ type: OutputError.Types.nameTooShort, data: this.name })
		}

		// Internal name
		if (this.internalName && this.internalName.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ type: OutputError.Types.internalNameTooShort, data: this.internalName })
		}

		// Type
		if (this.type == Verification.Types.INVALID) {
			errors.push({ type: OutputError.Types.verificationTypeInvalid })
		}

		// Verification number
		if (typeof this.number === 'number') {
			// Requires a filed date
			if (typeof this.dateFiled === 'undefined') {
				errors.push({ type: OutputError.Types.verificationDateFiledMissing })
			}

			if (this.number <= 0) {
				const data = `${this.number} <= 0`
				errors.push({ type: OutputError.Types.verificationNumberInvalid, data: data })
			}
		}

		// Date should be in ISO format
		if (typeof this.date !== 'undefined') {
			if (!this.date.isValidIsoDate()) {
				errors.push({ type: OutputError.Types.dateFormatInvalid, data: this.date })
			}
		}

		// Filed date should be after creation date
		if (typeof this.dateFiled === 'number') {
			// Requires verification number
			if (typeof this.number === 'undefined') {
				errors.push({ type: OutputError.Types.verificationNumberMissing })
			}

			if (typeof this.dateCreated === 'undefined') {
				errors.push({ type: OutputError.Types.dateCreatedMissing })
			} else if (this.dateFiled < this.dateCreated) {
				const data = `${this.dateFiled} < ${this.dateCreated}`
				errors.push({ type: OutputError.Types.verificationDateFiledBeforeCreated, data: data })
			}
		}

		// Total amount
		if (this.transactions.length > 0) {
			let found = false
			for (let transaction of this.transactions) {
				if (!transaction.isDeleted()) {
					if (this.totalAmount.isComparableTo(transaction.currency)) {
						if (this.totalAmount.isEquallyLarge(transaction.currency)) {
							found = true
							break
						}
					}
				}
			}

			if (!found) {
				errors.push({ type: OutputError.Types.verificationAmountDoesNotMatchAnyTransaction })
			}
		}

		// Invoice Id
		if (typeof this.invoiceId === 'string') {
			if (this.invoiceId.length <= 0) {
				errors.push({ type: OutputError.Types.verificationInvoiceIdIsEmpty })
			}
		}

		// Payment Id
		if (typeof this.paymentId === 'string') {
			if (this.paymentId.length <= 0) {
				errors.push({ type: OutputError.Types.verificationPaymentIdIsEmpty })
			}
		}

		// Fiscal Year Id
		if (typeof this.fiscalYearId === 'string') {
			if (this.fiscalYearId.length <= 0) {
				errors.push({ type: OutputError.Types.verificationFiscalYearIdIsEmpty })
			}
		}

		// Transactions
		this.validateTransactions(errors)

		return errors
	}

	private validateTransactions(errors: OutputError.Info[]) {
		const localCurrencyCode = this.findLocalCurrencyCode()

		// No transactions
		if (this.transactions.length == 0) {
			errors.push({ type: OutputError.Types.transactionsMissing })
		}

		// Check for errors in each transaction
		for (let transaction of this.transactions) {
			errors.push(...transaction.validate())
		}

		// Make sure all transaction amounts add up to 0 (locally)
		let sum = 0n
		for (let transaction of this.transactions) {
			if (!transaction.isDeleted()) {
				const localAmount = transaction.getLocalAmount()

				// Local code doesn't match
				if (localAmount.code != localCurrencyCode) {
					const data = `${localAmount.code.name} != ${localCurrencyCode.name}`
					errors.push({ type: OutputError.Types.transactionsCurrencyCodeLocalMismatch, data: data })
					return
				}

				sum += localAmount.amount
			}
		}

		if (sum != 0n) {
			errors.push({ type: OutputError.Types.transactionSumIsNotZero, data: `${sum}` })
		}
	}

	/**
	 * Get the full name of the verification. Both useful for debugging purposes and storing files
	 * @return full name of the verification
	 */
	getFullName(): string {
		let fullName = ''
		if (this.number) {
			const paddedNumber = `${this.number}`.padStart(4, '0')
			fullName = `#${paddedNumber} - `
		}
		fullName += `${this.date} - ${this.name}`
		return fullName
	}

	/**
	 * Find a transaction that has the specified account number (only not deleted)
	 * @param accountNumber the transaction to get with this account number
	 * @return transaction with this account number, undefined if not found
	 */
	getTransaction(accountNumber: number): Transaction | undefined {
		for (const transaction of this.transactions) {
			if (transaction.accountNumber === accountNumber && !transaction.isDeleted()) {
				return transaction
			}
		}
	}

	/**
	 * Remove a transaction with the specified account number.
	 * If the verification has been filed, the transaction isn't removed, but rather marked as deleted.
	 * @param accountNumber the transaction to remove
	 * @throws {OutputError.Types.transactionNotFound} if the transaction with the account number isn't found
	 */
	removeTransaction(accountNumber: number) {
		// Only mark the transaction as deleted, do not delete it
		if (this.dateFiled) {
			for (const transaction of this.transactions) {
				if (transaction.accountNumber === accountNumber && !transaction.isDeleted()) {
					transaction.setAsDeleted()
					transaction.updateModified()
					this.updateModified()
					return
				}
			}
			throw OutputError.create(OutputError.Types.transactionNotFound, `${accountNumber}`)
		}
		// Remove the transaction because the verification hasn't been filed
		else {
			const filtered = this.transactions.filter((transaction) => {
				return transaction.accountNumber !== accountNumber
			})
			// Nothing was removed, throw error
			if (filtered.length === this.transactions.length) {
				throw OutputError.create(OutputError.Types.transactionNotFound, `${accountNumber}`)
			}
			this.transactions = filtered
			this.updateModified()
		}
	}

	/**
	 * Add a transaction to the verification.
	 * Cannot add a transaction with an account number that already exists in the verification,
	 * unless that transaction has been marked as deleted.
	 * @param transaction the transaction to add
	 * @throws {OutputError.Types.transactionWithAccountNumberExists} if another transaction with the same account number exists
	 * that hasn't been marked as deleted.
	 */
	addTransaction(transaction: Transaction.Option) {
		// Can only add if the transaction doesn't exist already
		if (this.getTransaction(transaction.accountNumber)) {
			throw OutputError.create(OutputError.Types.transactionWithAccountNumberExists, `${transaction.accountNumber}`)
		}

		this.transactions.push(new Transaction(transaction))
		this.updateModified()
	}

	setPaymentId(paymentId: Id | undefined) {
		this.paymentId = paymentId
		this.updateModified()
	}

	setInvoiceId(invoiceId: Id | undefined) {
		this.invoiceId = invoiceId
		this.updateModified()
	}

	/**
	 * Get the comparable of this verification. If two verifications have the same comparable
	 * that essentially means they are the same, even though they might have different values
	 * @return a comparable of this verification.
	 */
	getComparable(): Verification.Comparable {
		return {
			id: this.id,
			userId: this.userId,
			internalName: this.internalName,
			date: this.date,
			totalAmount: this.totalAmount,
			type: this.type,

			isEqualTo(other: Verification.Comparable): boolean {
				if (this === other) {
					return true
				}
				if (this.id && this.id === other.id) {
					return true
				}
				if (this.id && other.id && this.id !== other.id) {
					return false
				}
				if (this.userId !== other.userId) {
					return false
				}
				if (this.internalName !== other.internalName) {
					return false
				}
				if (this.date !== other.date) {
					return false
				}
				if (this.type !== other.type) {
					return false
				}
				if (!Currency.isEqualTo(this.totalAmount, other.totalAmount)) {
					return false
				}

				return true
			},
		}
	}

	/**
	 * @return largest amount from all transactions
	 */
	private getLargestAmount(): Currency {
		const localCurrency = this.findLocalCurrencyCode()
		let largest = new Currency({ amount: 0n, code: localCurrency })
		for (const transaction of this.transactions) {
			// Try if the amount isn't comparable to the local currency
			try {
				const currency = transaction.currency
				if (currency.isLargerThan(largest)) {
					largest = currency
				}
			} catch (InternalError) {
				// Does nothing
			}
		}

		return largest.absolute()
	}

	/**
	 * Iterate through all transactions and see if there's a local
	 * currency code available. If not, we use the currency code
	 * of the transaction's code directly
	 * @return local currency code
	 */
	private findLocalCurrencyCode(): Currency.Codes {
		for (const transaction of this.transactions) {
			const localCode = transaction.getLocalCurrencyCode()
			if (localCode) {
				return localCode
			}
		}

		if (this.transactions.length > 0) {
			return this.transactions[0].getCurrencyCode()
		}
		// Return 'invalid' currency code if none is applicable
		else {
			return Currency.Codes.XTS
		}
	}
}

export namespace Verification {
	export enum Types {
		INVOICE_IN = 'INVOICE_IN',
		INVOICE_IN_PAYMENT = 'INVOICE_IN_PAYMENT',
		INVOICE_OUT = 'INVOICE_OUT',
		INVOICE_OUT_PAYMENT = 'INVOICE_OUT_PAYMENT',
		PAYMENT_DIRECT_IN = 'PAYMENT_DIRECT_IN',
		PAYMENT_DIRECT_OUT = 'PAYMENT_DIRECT_OUT',
		TRANSACTION = 'TRANSACTION',
		INVALID = 'INVALID',
	}

	export namespace Types {
		/**
		 * Convert a string type into an {Types} object
		 * @param type string value of the type (case-insensivite)
		 * @return the correct {Type} object if found or INVALID if it's invalid
		 */
		export function fromString(type: string): Types {
			type = type.toUpperCase()
			for (const value of Object.values(Types)) {
				if (value as keyof typeof Types) {
					if (value === type) {
						return Types[value]
					}
				}
			}
			return Types.INVALID
		}
	}
}
