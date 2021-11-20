import { VerificationNewFromParserInteractor } from './VerificationNewFromParserInteractor'
import { VerificationNewFromParserRepository } from './VerificationNewFromParserRepository'
import { VerificationNewFromParserInput } from './VerificationNewFromParserInput'
import { VerificationNewFromParserOutput } from './VerificationNewFromParserOutput'
import { VerificationRepositoryTest } from '../../../jest/VerificationRepositoryTest'
import { Id } from '../../core/definitions/Id'
import { Parser } from '../../core/entities/Parser'
import { ParserSingle } from '../../core/entities/ParserSingle'
import { Verification } from '../../core/entities/Verification'
import { InternalError } from '../../core/definitions/InternalError'
import { OutputError } from '../../core/definitions/OutputError'
import { Currency } from '../../core/entities/Currency'

const GOOGLE_INVOICE_PARSER_DATA: ParserSingle.Option = {
	name: 'Google parser',
	identifier: /1111-2222-3333/,
	userId: 1,
	verification: {
		name: 'Google account',
		internalName: 'G-SUITE',
		type: Verification.Types.INVOICE_IN,
		accountFrom: 2499,
		accountTo: 4661,
	},
	matcher: {
		date: {
			find: /[JFMASOND][aepuco][nbrylgptvc]\ \d{2},\ 20\d{2}/,
			replace: /(\w{3}) (\d{2}), (\d{4})/,
			replacement: '$3-$1-$2',
		},
		currencyCode: {
			find: /(?<=Total in )\w{3}/,
		},
		amount: {
			find: /(?<=Total in \w{3} \s*.)\d{1,5}\.\d{2}/,
		},
	},
}

class RepositoryTest extends VerificationRepositoryTest implements VerificationNewFromParserRepository {
	getParsers(userId: Id): Promise<Parser[]> {
		return Promise.resolve([new ParserSingle(GOOGLE_INVOICE_PARSER_DATA)])
	}
	readFile(filename: string): Promise<string> {
		if (filename === 'google') {
			return Promise.resolve(GOOLE_INVOICE_TEXT)
		} else if (filename === 'no parser') {
			return Promise.resolve('some stub text that does not have a parser')
		} else if (filename === 'reading error') {
			throw new InternalError(InternalError.Types.readingFile, filename)
		} else {
			throw new InternalError(InternalError.Types.fileNotFound, filename)
		}
	}
}

describe('Verification new from parser #cold #use-case', () => {
	let interactor: VerificationNewFromParserInteractor
	let input: VerificationNewFromParserInput
	let output: Promise<VerificationNewFromParserOutput>

	beforeAll(() => {
		interactor = new VerificationNewFromParserInteractor(new RepositoryTest())
	})

	beforeEach(() => {
		input = {
			userId: 1,
			files: [],
		}
	})

	it('Google input', async () => {
		input.files = ['google']
		output = interactor.execute(input)

		const validVerification = {
			userId: 1,
			fiscalYearId: 2,
			date: '2019-01-31',
			name: 'Google account',
			internalName: 'G-SUITE',
			type: Verification.Types.INVOICE_IN,
			totalAmount: {
				amount: 666n,
				localAmount: 6660n,
				code: Currency.Codes.EUR,
				localCode: Currency.Codes.SEK,
				exchangeRate: 10,
			},
		}

		const validTransactions = [
			{
				accountNumber: 2499,
				currency: {
					amount: -666n,
					localAmount: -6660n,
					code: Currency.Codes.EUR,
					localCode: Currency.Codes.SEK,
					exchangeRate: 10,
				},
			},
			{
				accountNumber: 4661,
				currency: {
					amount: 666n,
					localAmount: 6660n,
					code: Currency.Codes.EUR,
					localCode: Currency.Codes.SEK,
					exchangeRate: 10,
				},
			},
			{
				accountNumber: 2645,
				currency: {
					amount: 167n,
					localAmount: 1665n,
					code: Currency.Codes.EUR,
					localCode: Currency.Codes.SEK,
					exchangeRate: 10,
				},
			},
			{
				accountNumber: 2614,
				currency: {
					amount: -167n,
					localAmount: -1665n,
					code: Currency.Codes.EUR,
					localCode: Currency.Codes.SEK,
					exchangeRate: 10,
				},
			},
		]

		expect.assertions(6)
		await output.then((output) => {
			expect(output.verifications.length).toStrictEqual(1)

			// Verifications
			const verification = output.verifications[0]
			expect(verification).toMatchObject(validVerification)

			// Transactions
			for (const validTransaction of validTransactions) {
				expect(verification.transactions).toContainEqual(expect.objectContaining(validTransaction))
			}
		})
	})

	it('Could not find parser', async () => {
		input.files = ['no parser']
		output = interactor.execute(input)
		await expect(output).rejects.toStrictEqual(OutputError.create(OutputError.Types.parserNotFound))
	})

	it('File not found', async () => {
		input.files = ['gibberish aoeuaseuaoeus']
		output = interactor.execute(input)
		await expect(output).rejects.toStrictEqual(OutputError.create(OutputError.Types.internalError))
	})

	it('Could not read file', async () => {
		input.files = ['reading error']
		output = interactor.execute(input)
		await expect(output).rejects.toStrictEqual(OutputError.create(OutputError.Types.internalError))
	})
})

const GOOLE_INVOICE_TEXT =
	'                                                                                                                  Google Ireland Limited\n' +
	'                                                                                                                           Gordon House\n' +
	'\n' +
	'\n' +
	'Invoice\n' +
	'                                                                                                                           Barrow Street\n' +
	'                                                                                                                                 Dublin 4\n' +
	'Invoice number: 555666777                                                                                                        Ireland\n' +
	'                                                                                                               VAT number: IE 6388047V\n' +
	'\n' +
	'\n' +
	'Bill to\n' +
	'Company Name AB\n' +
	'Adresss 5H LGH3333\n' +
	'222 22 City\n' +
	'Sweden\n' +
	'VAT number: SE 55555555555\n' +
	'\n' +
	'\n' +
	'Details                                                             Google Cloud - GSuite\n' +
	'..............................................................\n' +
	'Invoice   number                            555666777\n' +
	'..............................................................\n' +
	'Invoice   date                              Jan 31, 2019            Total in EUR                                                €6.66\n' +
	'..............................................................\n' +
	'Billing ID                                  1111-2222-3333\n' +
	'..............................................................\n' +
	'Domain    name                              mydomain.com\n' +
	'                                                                    Summary for Jan 1, 2019 - Jan 31, 2019\n' +
	'\n' +
	'\n' +
	'                                                                    Subtotal in EUR                                                €6.66\n' +
	'                                                                    VAT (0%)                                                       €0.00\n' +
	'                                                                    Total in EUR                                                   €6.66\n' +
	'\n' +
	'\n' +
	'Services subject to the reverse charge - VAT to be accounted for by the recipient as per Article 196 of Council Directive 2006/112/EC\n' +
	'\n' +
	'\n' +
	'You will be automatically charged for any amount due.\n' +
	'\n' +
	'\n' +
	'\n' +
	'\n' +
	'                                                                                                                              Page 1 of 2\n' +
	'                Invoice                                           Invoice number: 555666777\n' +
	'\n' +
	'\n' +
	'\n' +
	'Subscription       Description   Interval                     Quantity            Amount(€)\n' +
	'\n' +
	'G Suite Basic      Commitment    Jan 1 - Jan 31                     2                   6.66\n' +
	'\n' +
	'                                            Subtotal in EUR                           €6.66\n' +
	'                                            VAT (0%)                                  €0.00\n' +
	'\n' +
	'\n' +
	'                                            Total in EUR                           €6.66\n' +
	'\n' +
	'\n' +
	'\n' +
	'\n' +
	'                                                                                 Page 2 of 2\n'
