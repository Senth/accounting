import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewCustomTransactionInput, TransactionInputData } from './VerificationNewCustomTransactionInput'
import { VerificationNewCustomTransactionOutput } from './VerificationNewCustomTransactionOutput'
import { VerificationNewCustomTransactionRepository } from './VerificationNewCustomTransactionRepository'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { OutputError } from '../../core/definitions/OutputError'
import { Id } from '../../core/definitions/Id'

/**
 * Creates a valid verification with transactions from an input
 */
export class VerificationNewCustomTransactionInteractor extends Interactor<
	VerificationNewCustomTransactionInput,
	VerificationNewCustomTransactionOutput,
	VerificationNewCustomTransactionRepository
> {
	constructor(repository: VerificationNewCustomTransactionRepository) {
		super(repository)
	}

	/**
	 * Create a valid verification for the specified input
	 * @param input
	 * @return {Promise.<VerificationNewCustomTransactionOutput>}
	 * @throws {OutputError} when the input data is invalid. See the errors for what was invalid
	 */
	async execute(input: VerificationNewCustomTransactionInput): Promise<VerificationNewCustomTransactionOutput> {
		this.input = input

		const localCurrencyPromise = this.repository.getLocalCurrency(input.userId)
		const fiscalYearIdPromise = this.repository.getFiscalYear(input.userId, input.verification.date)

		return localCurrencyPromise
			.then((localCurrency) => {
				return Promise.all([this.createTransactions(localCurrency), fiscalYearIdPromise])
			})
			.then(([transactions, fiscalYearId]) => {
				return this.createVerification(transactions, fiscalYearId)
			})
	}

	/**
	 * Create transactions from the input
	 * @param localCurrencyCode the currency code for the current user
	 * @return create transactions from the specified inputs
	 */
	private async createTransactions(localCurrencyCode: Currency.Codes): Promise<Transaction[]> {
		const promises = this.input.verification.transactions.map(async (transaction) => {
			return this.createTransaction(transaction, localCurrencyCode)
		})
		return Promise.all(promises)
	}

	/**
	 * Create a transaction
	 * @param transactionInputData data of the transaction to create
	 * @param localCurrencyCode code of the local currency
	 * @return promise of the transaction
	 */
	private async createTransaction(
		transactionInputData: TransactionInputData,
		localCurrencyCode: Currency.Codes
	): Promise<Transaction> {
		const code = Currency.Codes.fromString(transactionInputData.currencyCode)
		if (!code) {
			throw OutputError.create(OutputError.Types.currencyCodeInvalid, transactionInputData.currencyCode)
		}

		let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)

		if (code !== localCurrencyCode) {
			exchangeRatePromise = this.repository.getExchangeRate(this.input.verification.date, code, localCurrencyCode)
		}

		return exchangeRatePromise.then((exchangeRate) => {
			let localCode: Currency.Codes | undefined
			if (code !== localCurrencyCode) {
				localCode = localCurrencyCode
			}

			let transactionData: Transaction.Option = {
				accountNumber: transactionInputData.accountNumber,
				currency: new Currency({
					amount: transactionInputData.amount,
					code: code,
					localCode: localCode,
					exchangeRate: exchangeRate,
				}),
			}
			return new Transaction(transactionData)
		})
	}

	/**
	 * Create a verification and validate it
	 * @param transactions the transactions of the verification
	 * @param fiscalYearId the fiscal year id
	 * @return verification object
	 */
	private async createVerification(transactions: Transaction[], fiscalYearId: Id): Promise<Verification> {
		const verification = new Verification({
			userId: this.input.userId,
			fiscalYearId: fiscalYearId,
			name: this.input.verification.name,
			date: this.input.verification.date,
			files: this.input.verification.files,
			type: Verification.Types.TRANSACTION,
			description: this.input.verification.description,
			transactions: transactions,
		})

		const errors = verification.validate()
		if (errors.length > 0) {
			throw new OutputError(errors)
		}

		return verification
	}
}
