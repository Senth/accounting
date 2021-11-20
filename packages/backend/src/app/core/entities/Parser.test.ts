import { Parser } from './Parser'
import { OutputError } from '../definitions/OutputError'

class ParserImpl extends Parser {
	parse(text: string): Parser.VerificationInfo[] {
		return []
	}

	static testAmountConversion(amount: string): number {
		return Parser.fixAmount(amount)
	}

	static testFixDate(date: string): string {
		return Parser.fixDate(date)
	}
}

describe('Parser #cold #entity', () => {
	// isOfType()
	it('isOfType() test', () => {
		const parser = new ParserImpl(
			{
				userId: 1,
				name: '123',
				identifier: /test/,
			},
			Parser.Types.single
		)

		expect(parser.isOfType('this is a test string')).toStrictEqual(true)
		expect(parser.isOfType('not this type')).toStrictEqual(false)
	})

	// Name
	it('Name long enough', () => {
		const parser = new ParserImpl(
			{
				userId: 1,
				name: '123',
				identifier: /t/,
			},
			Parser.Types.single
		)

		expect(parser.validate()).toStrictEqual([])
	})

	it('Name too short', () => {
		const parser = new ParserImpl(
			{
				userId: 1,
				name: '12',
				identifier: /t/,
			},
			Parser.Types.single
		)

		expect(parser.validate()).toStrictEqual([{ type: OutputError.Types.nameTooShort, data: parser.name }])
	})

	// Amount conversion from string
	it('Check various amount conversions', () => {
		const values = [
			{
				in: '2.578,20',
				desired: 2578.2,
			},
			{
				in: '2 354,20',
				desired: 2354.2,
			},
			{
				in: '234',
				desired: 234,
			},
			{
				in: '234,256.20',
				desired: 234256.2,
			},
			{
				in: '234,205',
				desired: 234205,
			},
			{
				in: '246 548',
				desired: 246548,
			},
			{
				in: "244'056",
				desired: 244056,
			},
			{
				in: "26'155.25",
				desired: 26155.25,
			},
			{
				in: '12,20',
				desired: 12.2,
			},
			{
				in: '13.33',
				desired: 13.33,
			},
		]

		for (const value of values) {
			const output = ParserImpl.testAmountConversion(value.in)
			expect(output).toStrictEqual(value.desired)
		}
	})

	// Date conversions
	it('Test date conversions', () => {
		const months = [
			{
				correct: '01',
				variations: ['Jan', 'jan', 'january', 'January'],
				invalid: 'janur',
			},
			{
				correct: '02',
				variations: ['Feb', 'feb', 'february', 'February'],
				invalid: 'febrry',
			},
			{
				correct: '03',
				variations: ['Mar', 'mar', 'march', 'March'],
				invalid: 'Marc',
			},
			{
				correct: '04',
				variations: ['Apr', 'apr', 'april', 'April'],
				invalid: 'Apryl',
			},
			{
				correct: '05',
				variations: ['May', 'may', 'may', 'May'],
				invalid: 'Ma',
			},
			{
				correct: '06',
				variations: ['Jun', 'jun', 'june', 'June'],
				invalid: 'Juni',
			},
			{
				correct: '07',
				variations: ['Jul', 'jul', 'july', 'July'],
				invalid: 'Juli',
			},
			{
				correct: '08',
				variations: ['Aug', 'aug', 'august', 'August'],
				invalid: 'Augu',
			},
			{
				correct: '09',
				variations: ['Sep', 'sep', 'september', 'September'],
				invalid: 'septemer',
			},
			{
				correct: '10',
				variations: ['Oct', 'oct', 'october', 'October'],
				invalid: 'octobber',
			},
			{
				correct: '11',
				variations: ['Nov', 'nov', 'november', 'November'],
				invalid: 'novembeer',
			},
			{
				correct: '12',
				variations: ['Dec', 'dec', 'december', 'December'],
				invalid: 'decemember',
			},
		]

		const dateTemplate = '2000-{}-15'
		expect.assertions(12 * 5 + 1)
		for (const month of months) {
			const valid = dateTemplate.replace('{}', month.correct)

			for (const variation of month.variations) {
				const dateTest = dateTemplate.replace('{}', variation)
				const output = ParserImpl.testFixDate(dateTest)
				expect(output).toStrictEqual(valid)
			}

			// Test invalid
			const dateTest = dateTemplate.replace('{}', month.invalid)
			try {
				ParserImpl.testFixDate(dateTest)
			} catch (exception) {
				expect(exception.errors).toMatchObject([{ type: OutputError.Types.parserDateInputInvalid }])
			}
		}

		expect(ParserImpl.testFixDate('20-01-01')).toStrictEqual('2020-01-01')
	})
})
