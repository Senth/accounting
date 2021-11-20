import { Currency } from './Currency'
import { Verification } from './Verification'
import { Consts } from '../definitions/Consts'
import '../definitions/String'
import { OutputError } from '../definitions/OutputError'
import { UserEntity } from './UserEntity'

export abstract class Parser extends UserEntity implements Parser.Option {
	name: string
	type: Parser.Types
	identifier: RegExp

	constructor(data: Parser.Option, type: Parser.Types) {
		super(data)

		this.name = data.name
		this.identifier = data.identifier
		this.type = type
	}

	/**
	 * Parse the text and returns all verifications found in the text
	 * @param text the text to parse
	 * @return all verifications found in the text
	 * @throws {OutputError.Types.invalidInput} if the parser cannot parse some parts of the text
	 * @throws {OutputError.Types.internalError} if this parser is in an invalid state
	 */
	abstract parse(text: string): Parser.VerificationInfo[]

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Name
		if (this.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ type: OutputError.Types.nameTooShort, data: this.name })
		}

		return errors
	}

	/**
	 * Checks whether this Parser is for the specified text
	 * @param text the text to see if this Parser is of
	 * @return true if the text should be parsed by this Parser, false otherwise
	 */
	isOfType(text: string): boolean {
		return this.identifier.test(text)
	}

	/**
	 * Fix date to an ISO date (YYYY-MM-DD) by replacing month name to a number and adding YY if only two
	 * numbers were used for the year.
	 * @param date the date to fix
	 * @param errors errors that were found in the date
	 * @return year in correct ISO format (YYYY-MM-DD)
	 * @throws {OutputError.Types.invalidInput} if the date is an invalid format
	 */
	protected static fixDate(date: string): string {
		const regexs: RegExp[] = [
			/[Jj]a(nuary|n)/,
			/[Ff]e(bruary|b)/,
			/[Mm]a(rch|r)/,
			/[Aa]p(ril|r)/,
			/[Mm]ay/,
			/[Jj]u(ne|n)/,
			/[Jj]u(ly|l)/,
			/[Aa]u(gust|g)/,
			/[Ss]e(ptember|p)/,
			/[Oo]c(tober|t)/,
			/[Nn]o(vember|v)/,
			/[Dd]e(cember|c)/,
		]

		// Fix month
		for (let i = 0; i < regexs.length; ++i) {
			const regex = regexs[i]
			let month = String(i + 1)
			// Add 0 before month
			if (month.length == 1) {
				month = '0' + month
			}
			date = date.replace(regex, month)
		}

		// Fix year
		if (/^\d{2}-\d{2}-\d{2}$/.test(date)) {
			// Append 20 to the start of the year
			date = '20' + date
		}

		// Validate
		if (!date.isValidIsoDate()) {
			throw OutputError.create(OutputError.Types.parserDateInputInvalid, date)
		}

		return date
	}

	/**
	 * Converts a string currency amount to a valid number. Supports many different
	 * formats.
	 * ```
	 * 2.578,20
	 * 2 354,20
	 * 234
	 * 234,256.20
	 * 234,205
	 * 246 548
	 * 244'056
	 * 26'155.25
	 * 12,20
	 * 13.33
	 * ```
	 * @param amount the amount to convert to a valid number
	 * @return valid number
	 */
	protected static fixAmount(amount: string): number {
		const regex = /^(\d{0,3})?[\. ,']?(\d{0,3})[.,](\d{2})$|^(\d{0,3})?[\.\ ,']?(\d{0,3})$/
		const replacement = '$1$2$4$5.$3'
		const converted = amount.replace(regex, replacement)
		return Number.parseFloat(converted)
	}

	/**
	 * Replaces all newlines and tabs with spaces and replaces multiple spaces with one space.
	 * @param name the name to replace newline and tabs with spaces
	 * @return fixed name without tabs and multiple spaces
	 */
	protected static fixName(name: string): string {
		let fixed = name.replace(/\n\t/g, ' ')
		fixed = fixed.replace(/\s\s+/g, ' ')
		return fixed
	}

	/**
	 * Handles an exception and adds invalidInput errors to errors, otherwise rethrows the error
	 * @param exception the exception
	 * @param errors add invalidInput exceptions to this array
	 */
	protected static addInvalidInputErrors(exception: any, errors: OutputError.Info[]) {
		if (exception instanceof OutputError) {
			errors.push(...exception.errors)
		} else {
			throw exception
		}
	}
}

export namespace Parser {
	export enum Types {
		single = 'single',
		multi = 'multi',
	}

	export interface Option extends UserEntity.Option {
		name: string
		identifier: RegExp
	}

	export interface VerificationInfo {
		date: string
		name: string
		internalName: string
		code: Currency.Codes
		type: Verification.Types
		accountFrom: number
		accountTo: number
		amount: number
	}
}
