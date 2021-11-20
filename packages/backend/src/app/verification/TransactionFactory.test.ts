import { Currency } from '../core/entities/Currency'
import { TransactionFactory } from './TransactionFactory'
import { OutputError } from '../core/definitions/OutputError'
import { Accounts } from '../../jest/AccountTestData'

describe('TransactionFactory tests #cold #helper', () => {
	const LOCAL_CODE = Currency.Codes.SEK
	let option: TransactionFactory.Option

	beforeEach(() => {
		option = {
			userId: 1,
			amount: 10,
			code: LOCAL_CODE,
			localCode: undefined,
			accountFrom: Accounts.BANK_ACCOUNT,
			accountTo: Accounts.EXPENSE_BANK,
		}
	})

	// createTransaction()
	it('createTransaction() -> Minimal info', async () => {
		let transactionPromise = TransactionFactory.createTransactions(option)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.BANK_ACCOUNT.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_BANK.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(2)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Missing VAT for account', async () => {
		option.accountTo = Accounts.EXPENSE_LOCAL_MISSING_VAT
		let transactionPromise = TransactionFactory.createTransactions(option)

		let error = {
			errors: [
				{
					type: OutputError.Types.accountVatPercentageNotSet,
					data: String(Accounts.EXPENSE_LOCAL_MISSING_VAT.number),
				},
			],
		}

		expect.assertions(1)
		await expect(transactionPromise).rejects.toEqual(error)
	})

	it('createTransaction() -> Missing exchangeRate', async () => {
		option.code = Currency.Codes.USD
		option.localCode = Currency.Codes.SEK
		let transactionPromise = TransactionFactory.createTransactions(option)

		let error = {
			errors: [{ type: OutputError.Types.exchangeRateNotSet }],
		}

		expect.assertions(1)
		await expect(transactionPromise).rejects.toMatchObject(error)
	})

	it('createTransaction() -> Local expense', async () => {
		option.accountTo = Accounts.EXPENSE_LOCAL
		let transactionPromise = TransactionFactory.createTransactions(option)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.BANK_ACCOUNT.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_LOCAL.number,
				currency: {
					amount: 800n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_LOCAL_IN.number,
				currency: {
					amount: 200n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(3)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Abroad expense (with local code)', async () => {
		option.accountFrom = Accounts.INVOICE_IN
		option.accountTo = Accounts.EXPENSE_ABROAD
		option.localCode = LOCAL_CODE
		let transactionPromise = TransactionFactory.createTransactions(option)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.INVOICE_IN.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_ABROAD.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_IN.number,
				currency: {
					amount: 250n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_OUT.number,
				currency: {
					amount: -250n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(4)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Abroad expense (with exchangeRate)', async () => {
		option.exchangeRate = 10
		option.code = Currency.Codes.USD
		option.localCode = Currency.Codes.SEK
		option.accountFrom = Accounts.INVOICE_IN
		option.accountTo = Accounts.EXPENSE_ABROAD
		let transactionPromise = TransactionFactory.createTransactions(option)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.INVOICE_IN.number,
				currency: {
					amount: -1000n,
					localAmount: -10000n,
					code: option.code,
					localCode: LOCAL_CODE,
					exchangeRate: option.exchangeRate,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_ABROAD.number,
				currency: {
					amount: 1000n,
					localAmount: 10000n,
					code: option.code,
					localCode: LOCAL_CODE,
					exchangeRate: option.exchangeRate,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_IN.number,
				currency: {
					amount: 250n,
					localAmount: 2500n,
					code: option.code,
					localCode: LOCAL_CODE,
					exchangeRate: option.exchangeRate,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_OUT.number,
				currency: {
					amount: -250n,
					localAmount: -2500n,
					code: option.code,
					localCode: LOCAL_CODE,
					exchangeRate: option.exchangeRate,
				},
			},
		]

		expect.assertions(4)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Local income', async () => {
		option.accountFrom = Accounts.INCOME_LOCAL
		option.accountTo = Accounts.INVOICE_OUT
		let transactionPromise = TransactionFactory.createTransactions(option)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.INVOICE_OUT.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.INCOME_LOCAL.number,
				currency: {
					amount: -800n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_LOCAL_OUT.number,
				currency: {
					amount: -200n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(3)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})
})
