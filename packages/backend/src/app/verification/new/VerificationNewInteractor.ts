import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewInput } from './VerificationNewInput'
import { VerificationNewOutput } from './VerificationNewOutput'
import { VerificationNewRepository } from './VerificationNewRepository'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'
import { TransactionFactory } from '../TransactionFactory'
import { Id } from '../../core/definitions/Id'

/**
 * Creates a valid verification from a new direct payment
 */
export class VerificationNewInteractor extends Interactor<
	VerificationNewInput,
	VerificationNewOutput,
	VerificationNewRepository
> {
	localCurrencyCode?: Currency.Codes

	constructor(repository: VerificationNewRepository) {
		super(repository)
	}

	/**
	 * Create a valid verification from the specified input
	 * @param input
	 * @return {Promise.<VerificationNewOutput>}
	 * @throws {OutputError} when the input data is invalid. See the errors property for what was invalid
	 */
	async execute(input: VerificationNewInput): Promise<VerificationNewOutput> {
		this.input = input

		const code = Currency.Codes.fromString(this.input.verification.currencyCode)
		if (!code) {
			throw OutputError.create(OutputError.Types.currencyCodeInvalid, input.verification.currencyCode)
		}

		const localCurrencyPromise = this.repository.getLocalCurrency(input.userId)
		const accountFromPromise = this.repository.getAccountDetails(input.userId, input.verification.accountFrom)
		const accountToPromise = this.repository.getAccountDetails(input.userId, input.verification.accountTo)
		const fiscalYearIdPromise = this.repository.getFiscalYear(input.userId, input.verification.date)
		const promises = Promise.all([localCurrencyPromise, accountFromPromise, accountToPromise])

		return promises
			.then(async ([localCurrencyCode, accountFrom, accountTo]) => {
				let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)
				if (code != localCurrencyCode) {
					exchangeRatePromise = this.repository.getExchangeRate(this.input.verification.date, code, localCurrencyCode)
				}

				const exchangeRate = await exchangeRatePromise
				const transactionPromises = TransactionFactory.createTransactions({
					userId: this.input.userId,
					amount: this.input.verification.amount,
					code: code,
					localCode: localCurrencyCode,
					exchangeRate: exchangeRate,
					accountFrom: accountFrom,
					accountTo: accountTo,
				})

				return Promise.all([transactionPromises, fiscalYearIdPromise])
			})
			.then(async ([transactions, fiscalYearId]) => {
				return this.createVerification(transactions, fiscalYearId)
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					throw OutputError.create(OutputError.Types.internalError, String(reason.error))
				}

				throw reason
			})
	}

	/**
	 * Create a verification and validate it
	 * @param transactions the transactions of the verification
	 * @param fiscalYearId the fiscal year's id
	 * @return verification object
	 */
	private async createVerification(transactions: Transaction[], fiscalYearId: Id): Promise<Verification> {
		let type = Verification.Types.fromString(this.input.verification.type)

		const verification = new Verification({
			userId: this.input.userId,
			fiscalYearId: fiscalYearId,
			files: this.input.verification.files,
			name: this.input.verification.name,
			date: this.input.verification.date,
			type: type,
			description: this.input.verification.description,
			transactions: transactions,
		})

		const errors = verification.validate()
		if (errors.length > 0) {
			throw new OutputError(errors)
		}

		return Promise.resolve(verification)
	}
}
