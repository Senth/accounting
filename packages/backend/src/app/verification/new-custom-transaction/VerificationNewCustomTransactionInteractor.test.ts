import { VerificationNewCustomTransactionInteractor } from './VerificationNewCustomTransactionInteractor'
import { VerificationNewCustomTransactionInput } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import { Currency } from '../../core/entities/Currency'
import { OutputError } from '../../core/definitions/OutputError'
import { Verification } from '../../core/entities/Verification'
import { VerificationRepositoryTest } from '../../../jest/VerificationRepositoryTest'

const localCurrency: Currency.Codes = Currency.Codes.SEK

describe('New verification from custom transactions #cold #use-case', () => {
	let interactor: VerificationNewCustomTransactionInteractor
	let input: VerificationNewCustomTransactionInput
	let output: Promise<VerificationNewCustomTransactionOutput>

	beforeAll(() => {
		interactor = new VerificationNewCustomTransactionInteractor(new VerificationRepositoryTest())
	})

	it('Minimum valid input', async () => {
		input = {
			verification: {
				name: 'test',
				date: '2020-01-01',
				transactions: [
					{
						accountNumber: 2020,
						amount: 100,
						currencyCode: localCurrency.name,
					},
					{
						accountNumber: 1960,
						amount: -100,
						currencyCode: localCurrency.name,
					},
				],
			},
			userId: 1,
		}

		output = interactor.execute(input)

		// expect(output).resolves.toBeInstanceOf(VerificationNewCustomTransactionInteractor)
		expect.assertions(1)
		await expect(output).resolves.toMatchObject({
			userId: input.userId,
			fiscalYearId: 2,
			name: input.verification.name,
			date: input.verification.date,
			type: Verification.Types.TRANSACTION,
			transactions: [
				{
					accountNumber: 2020,
					currency: {
						amount: 10000n,
						code: localCurrency,
					},
				},
				{
					accountNumber: 1960,
					currency: {
						amount: -10000n,
						code: localCurrency,
					},
				},
			],
		})
	})

	it('Test full input', async () => {
		input = {
			verification: {
				name: 'test',
				date: '2020-01-01',
				description: 'My description',
				transactions: [
					{
						accountNumber: 2020,
						amount: 100n,
						currencyCode: 'USD',
					},
					{
						accountNumber: 1960,
						amount: -100n,
						currencyCode: 'USD',
					},
				],
			},
			userId: 1,
		}

		output = interactor.execute(input)

		expect.assertions(1)
		await expect(output).resolves.toMatchObject({
			userId: input.userId,
			fiscalYearId: 2,
			name: input.verification.name,
			date: input.verification.date,
			description: input.verification.description,
			type: Verification.Types.TRANSACTION,
			transactions: [
				{
					accountNumber: 2020,
					currency: {
						amount: 100n,
						code: Currency.Codes.USD,
						localCode: localCurrency,
						exchangeRate: 10,
					},
				},
				{
					accountNumber: 1960,
					currency: {
						amount: -100n,
						code: Currency.Codes.USD,
						localCode: localCurrency,
						exchangeRate: 10,
					},
				},
			],
		})
	})

	it('Test error handling', async () => {
		input = {
			userId: 1,
			verification: {
				name: 'H',
				date: '22',
				transactions: [],
			},
		}

		output = interactor.execute(input)

		expect.assertions(1)
		await expect(output).rejects.toEqual({
			errors: [
				{ type: OutputError.Types.nameTooShort, data: input.verification.name },
				{ type: OutputError.Types.dateFormatInvalid, data: input.verification.date },
				{ type: OutputError.Types.transactionsMissing },
			],
		})
	})
})
