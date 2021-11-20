import { Verification } from './Verification'
import { Parser } from './Parser'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { Consts } from '../definitions/Consts'
import { Account } from './Account'

interface MatcherResult {
	date: string
	currencyCode?: string
	amount: number
	name: string
}

interface CompleteInfo {
	result: MatcherResult
	info: ParserMulti.LineInfo
}

export namespace ParserMulti {
	export interface Option extends Parser.Option {
		matcher: RegExp
		lineMatchers: ParserMulti.LineInfo[]
		currencyCodeDefault: string
		accountFrom: number
		generic?: ParserMulti.LineInfo
	}

	export interface LineInfo {
		identifier: RegExp
		nameReplacement?: string
		currencyCodeDefault?: string
		internalName: string
		type: Verification.Types
		accountTo: number
	}
}

export class ParserMulti extends Parser implements ParserMulti.Option {
	matcher: RegExp
	lineMatchers: ParserMulti.LineInfo[]
	currencyCodeDefault: string
	accountFrom: number
	generic?: ParserMulti.LineInfo

	constructor(data: ParserMulti.Option) {
		super(data, Parser.Types.multi)

		this.matcher = data.matcher
		this.lineMatchers = data.lineMatchers
		this.currencyCodeDefault = data.currencyCodeDefault
		this.generic = data.generic
		this.accountFrom = data.accountFrom

		// TODO Make sure matcher has the 'g' flag set to match multiple occurrences
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		this.validateMatcher(errors)
		this.validateLineInfo(errors)

		// Generic
		if (this.generic) {
			ParserMulti.validateLineInfo(this.generic, errors)
		}

		// Needs line matchers or a generic
		if (!this.generic && this.lineMatchers.length == 0) {
			errors.push({ type: OutputError.Types.parserLineMatchersOrGenericRequired })
		}

		// Default currency code
		const foundCode = Currency.Codes.fromString(this.currencyCodeDefault)
		if (!foundCode) {
			errors.push({
				type: OutputError.Types.currencyCodeInvalid,
				data: this.currencyCodeDefault,
			})
		}

		// Account From
		Account.validateNumber(this.accountFrom, errors)

		return errors
	}

	/**
	 * Validate so that all necesarry groups are present in the regex
	 * @param errors all errors will be appended to this array
	 */
	private validateMatcher(errors: OutputError.Info[]) {
		const matcher = String(this.matcher)

		// Date
		if (!/\(\?<date>/.test(matcher)) {
			let errorCount = 0

			// No date, then we at least need year, month, and day
			if (!this.validateMatcherGroup('year', errors)) {
				errorCount++
			}
			if (!this.validateMatcherGroup('month', errors)) {
				errorCount++
			}
			if (!this.validateMatcherGroup('day', errors)) {
				errorCount++
			}

			// No year, month, or day specified. Add date error as well
			if (errorCount == 3) {
				errors.push({ type: OutputError.Types.parserMatcherGroupMissing, data: 'date' })
			}
		}

		this.validateMatcherGroup('name', errors)
		this.validateMatcherGroup('amount', errors)
	}

	private validateLineInfo(errors: OutputError.Info[]) {
		for (const line of this.lineMatchers) {
			ParserMulti.validateLineInfo(line, errors)
		}
	}

	private static validateLineInfo(line: ParserMulti.LineInfo, errors: OutputError.Info[]) {
		// Name replacement
		if (line.nameReplacement && line.nameReplacement.length < Consts.NAME_LENGTH_MIN) {
			errors.push({
				type: OutputError.Types.nameTooShort,
				data: line.nameReplacement,
			})
		}

		// Internal name
		if (line.internalName.length < Consts.NAME_LENGTH_MIN) {
			errors.push({
				type: OutputError.Types.internalNameTooShort,
				data: line.internalName,
			})
		}

		// Currency code
		if (line.currencyCodeDefault) {
			const foundCode = Currency.Codes.fromString(line.currencyCodeDefault)
			if (!foundCode) {
				errors.push({
					type: OutputError.Types.currencyCodeInvalid,
					data: line.currencyCodeDefault,
				})
			}
		}

		// Account number
		Account.validateNumber(line.accountTo, errors)
	}

	private validateMatcherGroup(group: string, errors: OutputError.Info[]): boolean {
		const matcher = String(this.matcher)
		const testGroup = RegExp(`\\(\\?<${group}>`)
		if (!testGroup.test(matcher)) {
			errors.push({ type: OutputError.Types.parserMatcherGroupMissing, data: `${group}` })
			return false
		}
		return true
	}

	parse(text: string): Parser.VerificationInfo[] {
		const errors: OutputError.Info[] = []

		const matches = text.matchAll(this.matcher)

		// Find matcher results
		const results: MatcherResult[] = []
		for (const match of matches) {
			const lineOrErrors = this.parseLine(match)
			if (lineOrErrors instanceof Array) {
				errors.push(...lineOrErrors)
			} else {
				results.push(lineOrErrors)
			}
		}

		// Match with correcsponding line info
		const completeInfos: CompleteInfo[] = []
		for (const result of results) {
			const line = this.findLineInfo(result.name)
			if (line) {
				completeInfos.push({ result: result, info: line })
			}
		}

		// Populate verification info
		const verifications: Parser.VerificationInfo[] = []
		for (const allInfo of completeInfos) {
			try {
				const verification = this.createVerificationInfo(allInfo)
				if (verification) {
					verifications.push(verification)
				}
			} catch (exception) {
				if (exception instanceof OutputError) {
					errors.push(...exception.errors)
				} else {
					throw exception
				}
			}
		}

		if (errors.length > 0) {
			throw new OutputError(errors)
		}

		return verifications
	}

	private createVerificationInfo(completeInfo: CompleteInfo): Parser.VerificationInfo {
		// Name
		let name = completeInfo.result.name
		if (completeInfo.info.nameReplacement) {
			name = completeInfo.info.nameReplacement
		}

		// Currency code
		let code = completeInfo.result.currencyCode

		// Use default for line
		if (!code) {
			code = completeInfo.info.currencyCodeDefault

			// Use default for parser
			if (!code) {
				code = this.currencyCodeDefault
			}
		}

		// Get the currency code object
		const foundCode = Currency.Codes.fromString(code)
		if (!foundCode) {
			throw OutputError.create(OutputError.Types.currencyCodeInvalid, code)
		}

		// Negating amount since a positive amount would mean we take from the 'accountFrom'
		// But it's reversed. A positive amount means that amount was added to the account.
		const verification: Parser.VerificationInfo = {
			date: completeInfo.result.date,
			internalName: completeInfo.info.internalName,
			type: completeInfo.info.type,
			accountFrom: this.accountFrom,
			accountTo: completeInfo.info.accountTo,
			amount: -completeInfo.result.amount,
			code: foundCode,
			name: name,
		}

		return verification
	}

	private parseLine(match: RegExpMatchArray): MatcherResult | OutputError.Info[] {
		const errors = new Array<OutputError.Info>()
		if (!match.groups) {
			throw OutputError.create(OutputError.Types.parserPatternNotFound)
		}
		let { name, amount, date, year, month, day, currency } = match.groups

		// Fix name
		name = `${this.name}: ` + Parser.fixName(name)

		// Fix amount
		const fixedAmount = Parser.fixAmount(amount)

		// Fix Date
		if (!date) {
			// All field found
			if (year && month && day) {
				date = `${year}-${month}-${day}`
			} else {
				if (!year) {
					errors.push({ type: OutputError.Types.parserMatcherGroupMissing, data: 'year' })
				} else if (!month) {
					errors.push({ type: OutputError.Types.parserMatcherGroupMissing, data: 'month' })
				} else if (!day) {
					errors.push({ type: OutputError.Types.parserMatcherGroupMissing, data: 'day' })
				}
			}
		}

		try {
			date = Parser.fixDate(date)
		} catch (exception) {
			if (exception instanceof OutputError) {
				errors.push(...exception.errors)
			}
		}

		if (errors.length > 0) {
			return errors
		}

		const result: MatcherResult = {
			date: date,
			name: name,
			amount: fixedAmount,
			currencyCode: currency,
		}

		return result
	}

	/**
	 * Finds the line info for the found name, the generic if not found, or undefined if no generic is specified
	 * @param name verification name that we want to search for
	 * @return LineInfo if it was found; if not found returns the Generic LineInfo, or undefined if no generic was set.
	 * Note that users might not want all lines to be processed, thus returning undefined is not an error.
	 */
	private findLineInfo(name: string): ParserMulti.LineInfo | undefined {
		for (const lineInfo of this.lineMatchers) {
			if (lineInfo.identifier.test(name)) {
				return lineInfo
			}
		}

		// If none was found return generic (which can be undefined)
		return this.generic
	}
}
