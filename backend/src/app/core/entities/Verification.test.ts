import * as faker from 'faker'
import { Verification } from './Verification'
import { Transaction } from './Transaction'
import { OutputError } from '../definitions/OutputError'
import { Currency } from './Currency'

function fakerValidDate(): number {
	return faker.date.between('2010-01-01', '2020-01-01').getTime()
}

function fakerTransaction(): Transaction.Option {
	return {
		accountNumber: faker.random.number({ min: 1000, max: 2000 }),
		currency: new Currency({
			amount: BigInt(faker.random.number({ min: 1, max: 10000000 })),
			code: 'SEK',
		}),
	}
}

function fakerValidTransactionPair(): Transaction.Option[] {
	const transaction = fakerTransaction()

	let localAmount: undefined | bigint
	if (transaction.currency.localAmount) {
		localAmount = -transaction.currency.localAmount
	}

	const opposite: Transaction.Option = {
		accountNumber: faker.random.number({ min: 3000, max: 4000 }),
		currency: {
			amount: -transaction.currency.amount,
			localAmount: localAmount,
			code: transaction.currency.code,
			localCode: transaction.currency.localCode,
			exchangeRate: transaction.currency.exchangeRate,
		},
	}

	return [transaction, opposite]
}

describe('Verification test #cold #entity', () => {
	let verification: Verification

	beforeEach(() => {
		const validData: Verification.Option = {
			userId: 1,
			name: 'Test',
			date: '2020-01-15',
			type: Verification.Types.TRANSACTION,
			transactions: fakerValidTransactionPair(),
		}
		verification = new Verification(validData)
	})

	// Minimum valid
	it('Minimum valid verification', () => {
		expect(verification.validate()).toStrictEqual([])
	})

	// Name
	it('Valid name', () => {
		verification.name = '123'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Too short name', () => {
		verification.name = '12'
		expect(verification.validate()).toStrictEqual([{ type: OutputError.Types.nameTooShort, data: verification.name }])
	})

	// Internal name
	it('Valid internal name', () => {
		verification.internalName = '123'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Too short internal name', () => {
		verification.internalName = '12'
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.internalNameTooShort, data: verification.internalName },
		])
	})

	// Verification number
	it('Invalid verification number (less than 1)', () => {
		verification.dateCreated = fakerValidDate()
		verification.dateFiled = verification.dateCreated

		verification.number = 0
		expect(verification.validate()).toMatchObject([{ type: OutputError.Types.verificationNumberInvalid }])
		verification.number = faker.random.number({ min: -99999, max: 0 })
		expect(verification.validate()).toMatchObject([{ type: OutputError.Types.verificationNumberInvalid }])
	})

	it('Verification number set, but missing date filed', () => {
		verification.number = 1
		expect(verification.validate()).toStrictEqual([{ type: OutputError.Types.verificationDateFiledMissing }])
	})

	// Date Filed
	it('Date filed but missing verification number', () => {
		verification.dateCreated = fakerValidDate()
		verification.dateFiled = verification.dateCreated
		expect(verification.validate()).toStrictEqual([{ type: OutputError.Types.verificationNumberMissing }])
	})

	it('Date filed before creation date', () => {
		verification.number = 1
		verification.dateFiled = faker.date.between('2010-01-01', '2014-12-31').getTime()
		verification.dateCreated = faker.date.between('2015-01-01', '2019-12-31').getTime()
		expect(verification.validate()).toMatchObject([{ type: OutputError.Types.verificationDateFiledBeforeCreated }])
	})

	// Date
	it('Valid date formats', () => {
		verification.date = '2020-06-01'
		expect(verification.validate()).toStrictEqual([])
		verification.date = '2020-02-29'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Invalid date formats', () => {
		verification.date = ''
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.dateFormatInvalid, data: verification.date },
		])
		verification.date = '20'
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.dateFormatInvalid, data: verification.date },
		])
		verification.date = '2019-13-01'
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.dateFormatInvalid, data: verification.date },
		])
		verification.date = '2019-02-29'
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.dateFormatInvalid, data: verification.date },
		])
	})

	// Other ids
	it('Validate other ids', () => {
		const validError = [{ type: OutputError.Types.verificationPaymentIdIsEmpty }]

		// Payment id
		verification.paymentId = ''
		expect(verification.validate()).toStrictEqual(validError)
		verification.paymentId = '1'

		// Invoice id
		verification.invoiceId = ''
		validError[0].type = OutputError.Types.verificationInvoiceIdIsEmpty
		expect(verification.validate()).toStrictEqual(validError)
		verification.invoiceId = '2'

		// Fiscal Id
		verification.fiscalYearId = ''
		validError[0].type = OutputError.Types.verificationFiscalYearIdIsEmpty
		expect(verification.validate()).toStrictEqual(validError)
		verification.fiscalYearId = '3'

		// Valid
		expect(verification.validate()).toStrictEqual([])
	})

	// Total amount
	it('Total original amount does not exist in any transaction (different amounts)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount + 1n, code: currency.code })
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.verificationAmountDoesNotMatchAnyTransaction },
		])
	})

	it('Total original amount does not exist in any non-deleted transaction', () => {
		const currency = verification.transactions[0].currency
		const dateDeleted = verification.transactions[0].dateModified
		verification.transactions.push(...verification.transactions)
		verification.transactions[2].currency = new Currency({
			amount: 1337n,
			code: currency.code,
		})
		verification.transactions[3].currency = new Currency({
			amount: -1337n,
			code: currency.code,
		})
		// Valid
		verification.totalAmount = verification.transactions[0].currency
		expect(verification.validate()).toStrictEqual([])

		// Invalid
		verification.transactions[0].dateDeleted = dateDeleted
		verification.transactions[1].dateDeleted = dateDeleted
		expect(verification.validate()).toStrictEqual([
			{
				type: OutputError.Types.verificationAmountDoesNotMatchAnyTransaction,
			},
		])
	})

	it('Total amount does not exist in any transaction (currency code)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount, code: Currency.Codes.BBD })
		expect(verification.validate()).toStrictEqual([
			{ type: OutputError.Types.verificationAmountDoesNotMatchAnyTransaction },
		])
	})

	// Transaction sum
	it('Transaction sum is not zero', () => {
		verification.transactions.push(
			new Transaction({
				accountNumber: 2666,
				currency: new Currency({
					amount: 1n,
					code: 'SEK',
				}),
			})
		)

		expect(verification.validate()).toStrictEqual([{ type: OutputError.Types.transactionSumIsNotZero, data: '1' }])
	})

	it('Transaction sum (do not count deleted transactions)', () => {
		verification.transactions[1].setAsDeleted()

		expect(verification.validate()).toStrictEqual([
			{
				type: OutputError.Types.transactionSumIsNotZero,
				data: String(verification.transactions[0].currency.amount),
			},
		])
	})

	// Missing transactions
	it('Missing transactions', () => {
		verification.transactions = []
		expect(verification.validate()).toStrictEqual([{ type: OutputError.Types.transactionsMissing }])
	})

	// Mismatch local code for transactions
	it('Transaction local code mismatch', () => {
		const firstTransaction = new Transaction({
			accountNumber: 3000,
			currency: new Currency({
				amount: 10n,
				code: 'SEK',
			}),
		})

		// Should never report sum doesn't equal 0, because we can't check the sum...
		verification.transactions = [
			firstTransaction,
			new Transaction({
				accountNumber: 6000,
				currency: new Currency({
					amount: -1n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				}),
			}),
			new Transaction({
				accountNumber: 5000,
				currency: new Currency({
					amount: 50n,
					code: 'EUR',
					localCode: 'USD',
					exchangeRate: 5,
				}),
			}),
		]

		verification.totalAmount = firstTransaction.currency

		expect(verification.validate()).toMatchObject([{ type: OutputError.Types.transactionsCurrencyCodeLocalMismatch }])
	})

	it('Types.fromString() -> Check so that it works', () => {
		expect.assertions(2 * TYPES.length)
		for (const typeString of TYPES) {
			const type = Verification.Types.fromString(typeString)
			expect(type).toBeDefined()
			expect(type).toEqual(typeString)
		}
	})

	it('getComparable() check so that the equality works', () => {
		const verification = new Verification({
			date: '2020-01-01',
			transactions: [],
			type: Verification.Types.INVOICE_IN,
			name: faker.company.companyName(),
			userId: 1,
			totalAmount: {
				amount: 1n,
				code: 'SEK',
			},
		})

		let first = verification.getComparable()
		let second = verification.getComparable()

		// Check equality
		expect(first.isEqualTo(first)).toStrictEqual(true)
		expect(first.isEqualTo(second)).toStrictEqual(true)
		expect(second.isEqualTo(first)).toStrictEqual(true)

		// Different user id
		verification.userId = 2
		second = verification.getComparable()
		expect(first.isEqualTo(second)).toStrictEqual(false)
		expect(second.isEqualTo(first)).toStrictEqual(false)

		// Different dates
		first = verification.getComparable()
		verification.date = '1999-01-01'
		second = verification.getComparable()
		expect(first.isEqualTo(second)).toStrictEqual(false)
		expect(second.isEqualTo(first)).toStrictEqual(false)

		// Different internal names (undefined)
		first = verification.getComparable()
		verification.internalName = 'Hello'
		second = verification.getComparable()
		expect(first.isEqualTo(second)).toStrictEqual(false)
		expect(second.isEqualTo(first)).toStrictEqual(false)

		// Different internal names
		first = verification.getComparable()
		verification.internalName = 'World'
		second = verification.getComparable()
		expect(first.isEqualTo(second)).toStrictEqual(false)
		expect(second.isEqualTo(first)).toStrictEqual(false)

		// Different total amounts
		first = verification.getComparable()
		verification.totalAmount = new Currency({
			amount: 1n,
			code: 'USD',
		})
		second = verification.getComparable()
		expect(first.isEqualTo(second)).toStrictEqual(false)
		expect(second.isEqualTo(first)).toStrictEqual(false)

		// Different types
		first = verification.getComparable()
		verification.type = Verification.Types.INVALID
		second = verification.getComparable()
		expect(first.isEqualTo(second)).toStrictEqual(false)
		expect(second.isEqualTo(first)).toStrictEqual(false)
	})

	const TYPES: string[] = [
		'INVOICE_IN',
		'INVOICE_IN_PAYMENT',
		'INVOICE_OUT',
		'INVOICE_OUT_PAYMENT',
		'PAYMENT_DIRECT_IN',
		'PAYMENT_DIRECT_OUT',
		'TRANSACTION',
	]
})
