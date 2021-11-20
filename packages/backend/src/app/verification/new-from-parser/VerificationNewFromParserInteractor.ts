import { Interactor } from '../../core/definitions/Interactor'
import { VerificationNewFromParserInput } from './VerificationNewFromParserInput'
import { VerificationNewFromParserOutput } from './VerificationNewFromParserOutput'
import { VerificationNewFromParserRepository } from './VerificationNewFromParserRepository'
import { Parser } from '../../core/entities/Parser'
import { OutputError } from '../../core/definitions/OutputError'
import { Currency } from '../../core/entities/Currency'
import { Verification } from '../../core/entities/Verification'
import { TransactionFactory } from '../TransactionFactory'
import { InternalError } from '../../core/definitions/InternalError'

/**
 * Create a verification from any supported file types
 */
export class VerificationNewFromParserInteractor extends Interactor<
	VerificationNewFromParserInput,
	VerificationNewFromParserOutput,
	VerificationNewFromParserRepository
> {
	constructor(repository: VerificationNewFromParserRepository) {
		super(repository)
	}

	/**
	 * Create a valid verification from any supported file types
	 * @param input the input
	 * @return {Promise.<VerificationNewFromParserOutput>}
	 * @throws {OutputError.Types.invalidInput} when a file can't be read
	 */
	async execute(input: VerificationNewFromParserInput): Promise<VerificationNewFromParserOutput> {
		this.input = input

		const localCurrencyCodePromise = this.repository.getLocalCurrency(input.userId)
		const getParsersPromise = this.repository.getParsers(input.userId)

		return Promise.all([localCurrencyCodePromise, getParsersPromise])
			.then(([localCurrencyCode, parsers]) => {
				// Parse one file at a time
				const promises = input.files.map(async (file) => {
					return this.parseFile(file, parsers, localCurrencyCode)
				})
				return Promise.all(promises)
			})
			.then((verifications) => {
				// Flatten
				return Promise.resolve({ verifications: verifications.flat() })
			})
			.catch((exception) => {
				if (exception instanceof InternalError) {
					throw OutputError.create(OutputError.Types.internalError)
				} else if (exception instanceof Error) {
					throw OutputError.create(OutputError.Types.internalError)
				}

				throw exception
			})
	}

	private async parseFile(file: string, parsers: Parser[], localCurrencyCode: Currency.Codes): Promise<Verification[]> {
		return this.repository
			.readFile(file)
			.then((text) => {
				return this.parseText(text, parsers)
			})
			.then((verificationInfos) => {
				const promises = verificationInfos.map((verificationInfo) =>
					this.createVerificationFromInfo(verificationInfo, localCurrencyCode, file)
				)
				return Promise.all(promises)
			})
	}

	private async parseText(text: string, parsers: Parser[]): Promise<Parser.VerificationInfo[]> {
		for (const parser of parsers) {
			if (parser.isOfType(text)) {
				return Promise.resolve(parser.parse(text))
			}
		}

		throw OutputError.create(OutputError.Types.parserNotFound)
	}

	private async createVerificationFromInfo(
		info: Parser.VerificationInfo,
		localCurrencyCode: Currency.Codes,
		file: string
	): Promise<Verification> {
		// Get exchange rate
		let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)

		if (info.code != localCurrencyCode) {
			exchangeRatePromise = this.repository.getExchangeRate(info.date, info.code, localCurrencyCode)
		}

		// Get accounts
		const accountFromPromise = this.repository.getAccountDetails(this.input.userId, info.accountFrom)
		const acountToPromise = this.repository.getAccountDetails(this.input.userId, info.accountTo)
		const fiscalYearIdPromise = this.repository.getFiscalYear(this.input.userId, info.date)

		const promises = Promise.all([exchangeRatePromise, accountFromPromise, acountToPromise])

		return promises
			.then(([exchangeRate, accountFrom, accountTo]) => {
				// Create transactions
				const transactionInfo: TransactionFactory.Option = {
					userId: this.input.userId,
					amount: info.amount,
					code: info.code,
					localCode: localCurrencyCode,
					exchangeRate: exchangeRate,
					accountFrom: accountFrom,
					accountTo: accountTo,
				}

				const transactionPromises = TransactionFactory.createTransactions(transactionInfo)
				return Promise.all([transactionPromises, fiscalYearIdPromise])
			})
			.then(([transactions, fiscalYearId]) => {
				// Create
				const option: Verification.Option = {
					userId: this.input.userId,
					fiscalYearId: fiscalYearId,
					name: info.name,
					internalName: info.internalName,
					type: info.type,
					date: info.date,
					transactions: transactions,
				}

				return new Verification(option)
			})
	}
}
