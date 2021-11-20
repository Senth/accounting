import { VerificationNewInteractor } from './VerificationNewInteractor'
import { VerificationNewOutput } from './VerificationNewOutput'
import { VerificationRepositoryTest } from '../../../jest/VerificationRepositoryTest'
import { Accounts } from '../../../jest/AccountTestData'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { OutputError } from '../../core/definitions/OutputError'
import { VerificationNewInput } from './VerificationNewInput'
import { Id } from '../../core/definitions/Id'

const LOCAL_CODE = VerificationRepositoryTest.LOCAL_CODE
const EXCHANGE_RATE = VerificationRepositoryTest.EXCHANGE_RATE
const MIN_ASSERTIONS = 9

function validFromInput(input: VerificationNewInput): Verification.Option {
	return {
		userId: input.userId,
		name: input.verification.name,
		date: input.verification.date,
		description: input.verification.description,
		type: Verification.Types.fromString(input.verification.type),
		transactions: [
			{
				accountNumber: Accounts.BANK_ACCOUNT.number,
				currency: new Currency({
					amount: -input.verification.amount,
					code: LOCAL_CODE,
				}),
			},
			{
				accountNumber: Accounts.EXPENSE_BANK.number,
				currency: new Currency({
					amount: input.verification.amount,
					code: LOCAL_CODE,
				}),
			},
		],
	}
}

function testEquality(verification: VerificationNewOutput, valid: Verification.Option) {
	expect(verification.userId).toStrictEqual(valid.userId)
	expect(verification.fiscalYearId).toStrictEqual(2)
	expect(verification.name).toStrictEqual(valid.name)
	expect(verification.date).toStrictEqual(valid.date)
	expect(verification.internalName).toStrictEqual(valid.internalName)
	expect(verification.description).toStrictEqual(valid.description)
	expect(verification.files).toStrictEqual(valid.files)
	expect(verification.type).toEqual(valid.type)
	expect(verification.transactions.length).toStrictEqual(valid.transactions.length)

	for (const transaction of valid.transactions) {
		expect(verification.transactions).toContainEqual(expect.objectContaining(transaction))
	}
}

interface InputData {
	userId?: Id
	name?: string
	internalName?: string
	description?: string
	date?: string
	accountFrom?: number
	accountTo?: number
	amount?: number
	currencyCode?: string
	type?: Verification.Types
}

function createInput(data: InputData = {}): VerificationNewInput {
	let amount = 10
	if (typeof data.amount === 'number') {
		amount = data.amount
	}

	return {
		userId: data.userId ? data.userId : 1,
		verification: {
			name: data.name ? data.name : 'test',
			description: data.description,
			date: data.date ? data.date : '2020-03-14',
			accountFrom: data.accountFrom ? data.accountFrom : Accounts.BANK_ACCOUNT.number,
			accountTo: data.accountTo ? data.accountTo : Accounts.EXPENSE_BANK.number,
			amount: amount,
			currencyCode: data.currencyCode ? data.currencyCode : LOCAL_CODE.name,
			type: data.type ? data.type : Verification.Types.PAYMENT_DIRECT_OUT,
		},
	}
}

describe('New Verification #cold #use-case', () => {
	let interactor: VerificationNewInteractor
	let inputData: InputData
	let output: Promise<VerificationNewOutput>

	beforeAll(() => {
		interactor = new VerificationNewInteractor(new VerificationRepositoryTest())
	})

	beforeEach(() => {
		inputData = {}
	})

	it('Minimum valid input', async () => {
		const input = createInput()
		output = interactor.execute(input)
		const valid = validFromInput(input)

		expect.assertions(MIN_ASSERTIONS + valid.transactions.length)
		await output.then((verification) => {
			testEquality(verification, valid)
		})
	})

	it('Full valid input with abroad expense', async () => {
		inputData.internalName = 'MY_NAME'
		inputData.description = 'This is my description'
		inputData.currencyCode = 'USD'

		inputData.accountFrom = Accounts.INVOICE_IN.number
		inputData.accountTo = Accounts.EXPENSE_ABROAD.number

		const input = createInput(inputData)
		const valid = validFromInput(input)
		valid.transactions = [
			{
				accountNumber: Accounts.INVOICE_IN.number,
				currency: new Currency({
					amount: -1000n,
					localAmount: -10000n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
			{
				accountNumber: Accounts.EXPENSE_ABROAD.number,
				currency: new Currency({
					amount: 1000n,
					localAmount: 10000n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
			{
				accountNumber: Accounts.VAT_ABROAD_IN.number,
				currency: new Currency({
					amount: 250n,
					localAmount: 2500n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
			{
				accountNumber: Accounts.VAT_ABROAD_OUT.number,
				currency: new Currency({
					amount: -250n,
					localAmount: -2500n,
					code: Currency.Codes.USD,
					localCode: LOCAL_CODE,
					exchangeRate: EXCHANGE_RATE,
				}),
			},
		]

		output = interactor.execute(input)

		expect.assertions(MIN_ASSERTIONS + valid.transactions.length)
		await output.then((verification) => {
			testEquality(verification, valid)
		})
	})

	it('Invalid input', async () => {
		expect.assertions(2)

		inputData.accountFrom = 2000
		inputData.date = '22'
		inputData.amount = 0

		let input = createInput(inputData)
		output = interactor.execute(input)

		await expect(output).rejects.toEqual({
			errors: [{ type: OutputError.Types.accountNumberNotFound, data: `${inputData.accountFrom}` }],
		})

		inputData.accountFrom = Accounts.BANK_ACCOUNT.number
		input = createInput(inputData)
		output = interactor.execute(input)
		await expect(output).rejects.toEqual({
			errors: [
				{ type: OutputError.Types.dateFormatInvalid, data: inputData.date },
				{ type: OutputError.Types.amountIsZero },
			],
		})
	})
})
