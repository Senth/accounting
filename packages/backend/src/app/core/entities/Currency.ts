import { InternalError } from '../definitions/InternalError'
import { OutputError } from '../definitions/OutputError'

/**
 * Holds the currency amount, code, and also an optional exchange rate with a local code.
 * If no local code is initialized it
 */
export class Currency implements Currency.Option {
	readonly amount: bigint
	readonly code!: Currency.Codes
	readonly localAmount?: bigint
	readonly localCode?: Currency.Codes
	readonly exchangeRate?: number

	/**
	 * If localCode is set but not localAmount the local amount will automatically
	 * @param options currency data
	 * @throws {InternalError} if the input data (options) isn't valid
	 */
	constructor(options: Currency.Option) {
		const errors: OutputError.Types[] = []

		if (typeof options.code === 'string') {
			let foundCode = Currency.Codes.fromString(options.code)
			if (foundCode) {
				this.code = foundCode
			} else {
				errors.push(OutputError.Types.currencyCodeInvalid)
			}
		} else {
			this.code = options.code
		}

		if (typeof options.exchangeRate !== 'undefined') {
			this.exchangeRate = options.exchangeRate
		}

		if (typeof options.localCode !== 'undefined') {
			if (typeof options.localCode === 'string') {
				let foundCode = Currency.Codes.fromString(options.localCode)
				if (foundCode) {
					this.localCode = foundCode
				} else {
					errors.push(OutputError.Types.currencyCodeLocalInvalid)
				}
			} else {
				this.localCode = options.localCode
			}
		}

		this.validate(errors)

		if (errors.length > 0) {
			throw new InternalError(InternalError.Types.invalidEntityState, errors)
		}

		// Use amount directly
		if (typeof options.amount === 'bigint') {
			this.amount = options.amount
		}
		// Convert from number to bigint
		else {
			this.amount = Currency.numberToBigInt(options.amount, this.code.precision)
		}

		// Set local amount
		if (typeof options.localAmount !== 'undefined') {
			this.localAmount = options.localAmount
		} else if (typeof options.localCode !== 'undefined') {
			this.localAmount = this.calculateLocalAmount()
		}
	}

	private validate(errors: OutputError.Types[]) {
		// Exchange rate
		if (typeof this.exchangeRate !== 'undefined') {
			// Requires local code
			if (typeof this.localCode === 'undefined') {
				// Only add error message if there isn't one for invalid local code
				if (!errors.includes(OutputError.Types.currencyCodeLocalInvalid)) {
					errors.push(OutputError.Types.currencyCodeLocalNotSet)
				}
			}

			// Not 0 or below
			if (this.exchangeRate === 0) {
				errors.push(OutputError.Types.exchangeRateZero)
			}
		}

		// Local
		if (typeof this.localCode !== 'undefined') {
			// Requires exchange rate
			if (typeof this.exchangeRate === 'undefined') {
				errors.push(OutputError.Types.exchangeRateNotSet)
			}

			// Can't be same code as this.code
			if (this.code == this.localCode) {
				errors.push(OutputError.Types.currencyCodesAreSame)
			}
		}
	}

	/**
	 * Check if the objects are equal, not just if they have the same number
	 * @param first an object to compare
	 * @param second the other object to compare with
	 * @return true if they are truly equal
	 */
	static isEqualTo(first: Currency.Option, second: Currency.Option): boolean {
		if (first.amount !== second.amount) {
			return false
		}
		if (!Currency.isCodeEqualTo(first.code, second.code)) {
			return false
		}
		if (first.localAmount !== second.localAmount) {
			return false
		}
		if (!Currency.isCodeEqualTo(first.localCode, second.localCode)) {
			return false
		}
		if (first.exchangeRate !== second.exchangeRate) {
			return false
		}

		return true
	}

	/**
	 * Checks if the currency code name is equal.
	 * Note that this will return true if both first and second is undefined
	 * @param first one code to compare
	 * @param second the other code to compare with
	 * @return true if they are equal
	 */
	static isCodeEqualTo(
		first: Currency.Codes | string | undefined,
		second: Currency.Codes | string | undefined
	): boolean {
		if (first === second) {
			return true
		}
		if (typeof first === 'object' && typeof second === 'object') {
			if (first.name === second.name) {
				return true
			}
		}
		if (typeof first === 'object') {
			if (first.name === second) {
				return true
			}
		}
		if (typeof second === 'object') {
			if (first === second.name) {
				return true
			}
		}

		return false
	}

	private static numberToBigInt(value: number, precision: number): bigint {
		let negate = false
		if (value < 0) {
			negate = true
			value *= -1
		}

		let out: bigint = BigInt(Math.round(value * 10 ** precision))

		// Calculate rest value so we round of correctly
		const rest: bigint = BigInt(Math.round(value * 10 ** (precision + 1))) % 10n

		if (negate) {
			out *= -1n
		}

		return out
	}

	private isLocalAmountSet(): boolean {
		return typeof this.localAmount !== 'undefined'
	}

	/**
	 * Create a new currency by multiplying with this currency. Will multiply against both the amount and
	 * local amount if it's available
	 * @param multiplier how much to multiply the value with
	 * @return new currency that has been multiplied with multiplier
	 * @see split() if you want to split the currency into parts (for example VAT and cost)
	 */
	multiply(multiplier: number): Currency {
		const precision = Currency.calculatePrecision(multiplier)
		const multiplierInt = BigInt(multiplier * 10 ** Number(precision))

		let amount = this.amount * multiplierInt
		let localAmount: bigint | undefined
		if (typeof this.localAmount !== 'undefined') {
			localAmount = this.localAmount * multiplierInt
		}

		// Divide
		amount = Currency.divideByPrecision(amount, precision)
		if (localAmount !== undefined) {
			localAmount = Currency.divideByPrecision(localAmount, precision)
		}

		const currency = new Currency({
			amount: amount,
			localAmount: localAmount,
			code: this.code,
			localCode: this.localCode,
			exchangeRate: this.exchangeRate,
		})
		return currency
	}

	/**
	 * Divide and round the value depending on it's precision
	 * @param value the value to divide and round up or down
	 * @param precision the precision of the value (divides by 10 ** precision)
	 * @return divided and rounded value
	 */
	private static divideByPrecision(value: bigint, precision: bigint): bigint {
		if (precision >= 2n) {
			value /= 10n ** (precision - 1n)
		}

		if (precision >= 1n) {
			const remainder = value % 10n
			value /= 10n
			if (remainder >= 5n) {
				value += 1n
			} else if (remainder <= -5n) {
				value -= 1n
			}
		}

		return value
	}

	/**
	 * Split the currency into parts. If you were to add these together the result would
	 * always be this currency. Note that this splits the amount from the localAmount and not amount.
	 * Any remaining amount will be added to the first fraction.
	 * @param fractions list of parts to split it into. Needs at least 2 elements.
	 * If fractions doesn't add upp to 1 any remaining amount will be added to the first fraction.
	 * @return parts of the currency where localAmount has been set manually
	 * @see multiply() if you want to create a new currency by multiplying this
	 * @throws {InternalError.tooFewElements} if too few elements were supplied
	 */
	split(fractions: number[]): Currency[] {
		if (fractions.length < 2) {
			throw new InternalError(InternalError.Types.tooFewElements)
		}

		let maxFractionPrecision = 1n
		for (let fraction of fractions) {
			const fractionPrecision = Currency.calculatePrecision(fraction)

			if (fractionPrecision > maxFractionPrecision) {
				maxFractionPrecision = fractionPrecision
			}
		}
		const maxFractionPrecisionMulti = 10n ** maxFractionPrecision

		let localAmount: bigint = 0n
		if (this.isLocalAmountSet()) {
			localAmount = this.localAmount!
		}
		let localAmountLeft = localAmount * maxFractionPrecisionMulti

		const amount = this.amount
		let amountLeft = amount * maxFractionPrecisionMulti

		const amounts: bigint[] = []
		const localAmounts: bigint[] = []
		for (let fraction of fractions) {
			const fractionInt = BigInt(fraction * Number(maxFractionPrecisionMulti))

			if (this.isLocalAmountSet()) {
				const fractionLocalAmount = localAmount * fractionInt
				localAmountLeft -= fractionLocalAmount
				localAmounts.push(fractionLocalAmount)
			}

			const fractionAmount = amount * fractionInt
			amountLeft -= fractionAmount
			amounts.push(fractionAmount)
		}

		if (this.isLocalAmountSet() && localAmountLeft != 0n) {
			localAmounts[0] += localAmountLeft
		}

		if (amountLeft != 0n) {
			amounts[0] += amountLeft
		}

		// Create Currencies
		const currencies: Currency[] = []
		for (let i = 0; i < amounts.length; ++i) {
			// Local amount
			let fractionLocalAmount: bigint | undefined
			if (this.isLocalAmountSet()) {
				fractionLocalAmount = localAmounts[i]
				fractionLocalAmount = Currency.divideByPrecision(fractionLocalAmount, maxFractionPrecision)
			}

			// Amount
			let fractionAmount = amounts[i]
			fractionAmount = Currency.divideByPrecision(fractionAmount, maxFractionPrecision)

			currencies.push(
				new Currency({
					amount: fractionAmount,
					localAmount: fractionLocalAmount,
					code: this.code,
					localCode: this.localCode,
					exchangeRate: this.exchangeRate,
				})
			)
		}

		return currencies
	}

	/**
	 * @return true if the amount is 0
	 */
	isZero(): boolean {
		return this.amount == 0n
	}

	/**
	 * @return true if amount is less than 0
	 */
	isNegative(): boolean {
		if (this.localAmount) {
			return this.localAmount < 0n
		}
		return this.amount < 0n
	}

	/**
	 * @return true if amount is larger than 0
	 */
	isPositive(): boolean {
		if (this.localAmount) {
			return this.localAmount > 0n
		}
		return this.amount > 0n
	}

	/**
	 * Checks if the amounts are equal if they can be compared in the same currency.
	 * @param other the other currency to compare with this one
	 * @return true if the other currency has the same amount value as this
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isEquallyLarge() to check if the currencies are equally far away from 0
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isEqualTo(other: Currency): boolean {
		// Short circuit if they are the same object
		if (other === this) {
			return true
		}

		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] === comparableResults[1]
	}

	/**
	 * Checks if the amounts are equally large compared in the same currency.
	 * Equally large means that -10 == 10 as they are equally far from 0.
	 * @param other the other currency to compare with this one
	 * @return true if the the two currencies are equally large.
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isEqualTo() to check if the currencies are equal
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isEquallyLarge(other: Currency): boolean {
		// Short circuit if they are the same object
		if (this === other) {
			return true
		}

		const comparableResults = this.getComparableResults(other, true)
		return comparableResults[0] === comparableResults[1]
	}

	/**
	 * Checks if this amount is smaller than other's amount if they can be compared in the same currency.
	 * By smaller we mean closer to 0.
	 * @return true if this amount is smaller than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false
	 * @example new Currency({amount: 10, code: 'USD'}).isSmallerThan(new Currency({amount: 5, code: 'USD'})) => false
	 * @example new Currency({amount: -10, code: 'USD'}).isSmallerThan(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: 5, code: 'USD'}).isSmallerThan(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: -5, code: 'USD'}).isSmallerThan(new Currency({amount: 10, code: 'USD'})) => true
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isSmallerThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other, true)

		return comparableResults[0] < comparableResults[1]
	}

	/**
	 * Checks if this amount is smaller than or equal to other's amount if they can be compared in the same currency.
	 * By smaller we mean closer to 0.
	 * @return true if this amount is smaller than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @example new Currency({amount: 10, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: 5, code: 'USD'})) => false
	 * @example new Currency({amount: -10, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: 5, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: -5, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: 10, code: 'USD'})) => true
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isSmallerThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other, true)

		return comparableResults[0] <= comparableResults[1]
	}

	/**
	 * Checks if this amount is larger than other's amount if they can be compared in the same currency.
	 * By larger we mean farther away from 0.
	 * @return true if this amount is larger than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @example new Currency({amount: 10, code: 'USD'}).isLargerThan(new Currency({amount: 5, code: 'USD'})) => true
	 * @example new Currency({amount: -10, code: 'USD'}).isLargerThan(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: 5, code: 'USD'}).isLargerThan(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: -5, code: 'USD'}).isLargerThan(new Currency({amount: 10, code: 'USD'})) => false
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isLargerThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other, true)

		return comparableResults[0] > comparableResults[1]
	}

	/**
	 * Checks if this amount is larger than or equal to other's amount if they can be compared in the same currency.
	 * By larger we mean farther away from 0.
	 * @return true if this amount is larger than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @example new Currency({amount: 10, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: 5, code: 'USD'})) => true
	 * @example new Currency({amount: -10, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: 5, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: -5, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: 10, code: 'USD'})) => false
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isLargerThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other, true)

		return comparableResults[0] >= comparableResults[1]
	}

	/**
	 * Checks if this amount is less than other's amount if they can be compared in the same currency.
	 * @return true if this amount is less than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isLessThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] < comparableResults[1]
	}

	/**
	 * Checks if this amount is less than or equal to other's amount if they can be compared in the same currency.
	 * @return true if this amount is less than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isLessThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] <= comparableResults[1]
	}

	/**
	 * Checks if this amount is greater than other's amount if they can be compared in the same currency.
	 * @return true if this amount is greater than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isGreaterThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] > comparableResults[1]
	}

	/**
	 * Checks if this amount is greater than or equal to other's amount if they can be compared in the same currency.
	 * @return true if this amount is greater than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isGreaterThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] >= comparableResults[1]
	}

	/**
	 * Calculate comparable results depending on which codes this vs the other currency has.
	 * @param other the other currency to compare with this one
	 * @return two amounts in the same currency code that can be compared
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if they have totally different
	 * currency codes. As long as two of the codes (doesn't matter if its code or localCode) are equal
	 * they can be compared
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	private getComparableResults(other: Currency, positive: boolean = false): bigint[] {
		if (!this.isComparableTo(other)) {
			throw new InternalError(InternalError.Types.comparableError, [OutputError.Types.currenciesNotComparable])
		}

		let first: Currency = this
		let second: Currency = other

		if (this.localCode == other.localCode) {
			first = this.getLocalCurrency()
			second = other.getLocalCurrency()
		} else if (this.code == other.localCode) {
			first = this
			second = other.getLocalCurrency()
		} else if (this.localCode == other.code) {
			first = this.getLocalCurrency()
			second = other
		}

		if (positive) {
			first = first.absolute()
			second = second.absolute()
		}

		return [first.amount, second.amount]
	}

	/**
	 * Checks if the two currencies are comparable
	 * @param other the other to check if it's comparable with this one
	 * @return true if they are comparable
	 * @see isEqualTo() to compare if the amount is equal
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isComparableTo(other: Currency): boolean {
		if (this.code == other.code) {
			return true
		}

		if (this.localCode == other.localCode && typeof this.localCode !== 'undefined') {
			return true
		}

		if (this.code == other.localCode || this.localCode == other.code) {
			return true
		}

		return false
	}

	/**
	 * Negate the currency
	 * @return creates a new currency that has negated the amount
	 */
	negate(): Currency {
		let localAmount = this.localAmount
		if (typeof localAmount !== 'undefined') {
			localAmount = -localAmount
		}

		return new Currency({
			amount: -this.amount,
			code: this.code,
			localAmount: localAmount,
			localCode: this.localCode,
			exchangeRate: this.exchangeRate,
		})
	}

	/**
	 * Return this currency if the amount is positive, or create a new currency that has been negated so
	 * the amount is positive
	 * @return absolute currency (amount) from this currency
	 */
	absolute(): Currency {
		let currency: Currency = this
		if (this.isNegative()) {
			currency = this.negate()
		}
		return currency
	}

	private calculateLocalAmount(): bigint {
		if (typeof this.localCode === 'undefined') {
			return this.amount
		}

		let localAmount = this.amount

		// Check precision difference
		const precisionDiff = BigInt(this.localCode.precision - this.code.precision)

		// If we have larger precision afterwards, multiply now
		if (precisionDiff > 0) {
			localAmount *= 10n ** precisionDiff
		}

		// Calculate the precision of the exchange rate
		const exchangeRatePrecision = Currency.calculatePrecision(this.exchangeRate!)

		// Make exchange rate as a bigint
		const exchangeRate = BigInt(Math.round(10 ** Number(exchangeRatePrecision) * this.exchangeRate!))

		localAmount *= exchangeRate

		// Calculate how much we should divide the local amount with
		let precisionDivide: bigint = exchangeRatePrecision
		if (precisionDiff < 0) {
			precisionDivide += -precisionDiff
		}

		// Divide the local amount (but keep one precision)
		if (precisionDivide >= 2) {
			localAmount /= 10n ** (precisionDivide - 1n)
		}
		// Check the rest (so we can round up if necessary)
		if (precisionDivide >= 1) {
			const rest = localAmount % 10n
			localAmount /= 10n

			// Positive amount
			if (this.isPositive()) {
				if (rest >= 5n) {
					localAmount += 1n
				}
			}
			// Negative amount
			else {
				if (rest <= -5n) {
					localAmount -= 1n
				}
			}
		}
		return localAmount
	}

	/**
	 * Calculate the local amount, i.e., amount * exchangeRate
	 * @return amount * exchangeRate, or just amount if no exchangeRate has been set
	 */
	getLocalCurrency(): Currency {
		if (typeof this.localCode === 'undefined' || typeof this.localAmount === 'undefined') {
			return this
		}

		const option: Currency.Option = {
			amount: this.localAmount,
			code: this.localCode.name,
		}
		return new Currency(option)
	}

	/**
	 * Get the precision of a number
	 * @param num number to get how many numbers after the precision there is
	 * @return how many numbers are after the precision.
	 * @example precision(10.235) -> 3
	 */
	private static calculatePrecision(num: number): bigint {
		if (!isFinite(num)) return 0n
		let e = 1,
			p = 0
		while (Math.round(num * e) / e !== num) {
			e *= 10
			p++
		}
		return BigInt(p)
	}
}

export namespace Currency {
	export interface Option {
		readonly amount: bigint | number
		readonly code: string | Codes
		readonly localAmount?: bigint
		readonly localCode?: string | Codes
		readonly exchangeRate?: number
	}

	export class Codes {
		readonly name: string
		readonly precision: number

		private constructor(name: string, precision: number) {
			this.name = name
			this.precision = precision
		}

		static readonly AED: Codes = new Codes('AED', 2)
		static readonly AFN: Codes = new Codes('AFN', 2)
		static readonly ALL: Codes = new Codes('ALL', 2)
		static readonly AMD: Codes = new Codes('AMD', 2)
		static readonly ANG: Codes = new Codes('ANG', 2)
		static readonly AOA: Codes = new Codes('AOA', 2)
		static readonly ARS: Codes = new Codes('ARS', 2)
		static readonly AUD: Codes = new Codes('AUD', 2)
		static readonly AWG: Codes = new Codes('AWG', 2)
		static readonly AZN: Codes = new Codes('AZN', 2)
		static readonly BAM: Codes = new Codes('BAM', 2)
		static readonly BBD: Codes = new Codes('BBD', 2)
		static readonly BDT: Codes = new Codes('BDT', 2)
		static readonly BGN: Codes = new Codes('BGN', 2)
		static readonly BHD: Codes = new Codes('BHD', 3)
		static readonly BIF: Codes = new Codes('BIF', 0)
		static readonly BMD: Codes = new Codes('BMD', 2)
		static readonly BND: Codes = new Codes('BND', 2)
		static readonly BOB: Codes = new Codes('BOB', 2)
		static readonly BOV: Codes = new Codes('BOV', 2)
		static readonly BRL: Codes = new Codes('BRL', 2)
		static readonly BSD: Codes = new Codes('BSD', 2)
		static readonly BTN: Codes = new Codes('BTN', 2)
		static readonly BWP: Codes = new Codes('BWP', 2)
		static readonly BYN: Codes = new Codes('BYN', 2)
		static readonly BZD: Codes = new Codes('BZD', 2)
		static readonly CAD: Codes = new Codes('CAD', 2)
		static readonly CDF: Codes = new Codes('CDF', 2)
		static readonly CHE: Codes = new Codes('CHE', 2)
		static readonly CHF: Codes = new Codes('CHF', 2)
		static readonly CHW: Codes = new Codes('CHW', 2)
		static readonly CLF: Codes = new Codes('CLF', 4)
		static readonly CLP: Codes = new Codes('CLP', 0)
		static readonly CNY: Codes = new Codes('CNY', 2)
		static readonly COP: Codes = new Codes('COP', 2)
		static readonly COU: Codes = new Codes('COU', 2)
		static readonly CRC: Codes = new Codes('CRC', 2)
		static readonly CUC: Codes = new Codes('CUC', 2)
		static readonly CUP: Codes = new Codes('CUP', 2)
		static readonly CVE: Codes = new Codes('CVE', 2)
		static readonly CZK: Codes = new Codes('CZK', 2)
		static readonly DJF: Codes = new Codes('DJF', 0)
		static readonly DKK: Codes = new Codes('DKK', 2)
		static readonly DOP: Codes = new Codes('DOP', 2)
		static readonly DZD: Codes = new Codes('DZD', 2)
		static readonly EGP: Codes = new Codes('EGP', 2)
		static readonly ERN: Codes = new Codes('ERN', 2)
		static readonly ETB: Codes = new Codes('ETB', 2)
		static readonly EUR: Codes = new Codes('EUR', 2)
		static readonly FJD: Codes = new Codes('FJD', 2)
		static readonly FKP: Codes = new Codes('FKP', 2)
		static readonly GBP: Codes = new Codes('GBP', 2)
		static readonly GEL: Codes = new Codes('GEL', 2)
		static readonly GHS: Codes = new Codes('GHS', 2)
		static readonly GIP: Codes = new Codes('GIP', 2)
		static readonly GMD: Codes = new Codes('GMD', 2)
		static readonly GNF: Codes = new Codes('GNF', 0)
		static readonly GTQ: Codes = new Codes('GTQ', 2)
		static readonly GYD: Codes = new Codes('GYD', 2)
		static readonly HKD: Codes = new Codes('HKD', 2)
		static readonly HNL: Codes = new Codes('HNL', 2)
		static readonly HRK: Codes = new Codes('HRK', 2)
		static readonly HTG: Codes = new Codes('HTG', 2)
		static readonly HUF: Codes = new Codes('HUF', 2)
		static readonly IDR: Codes = new Codes('IDR', 2)
		static readonly ILS: Codes = new Codes('ILS', 2)
		static readonly INR: Codes = new Codes('INR', 2)
		static readonly IQD: Codes = new Codes('IQD', 3)
		static readonly IRR: Codes = new Codes('IRR', 2)
		static readonly ISK: Codes = new Codes('ISK', 0)
		static readonly JMD: Codes = new Codes('JMD', 2)
		static readonly JOD: Codes = new Codes('JOD', 3)
		static readonly JPY: Codes = new Codes('JPY', 0)
		static readonly KES: Codes = new Codes('KES', 2)
		static readonly KGS: Codes = new Codes('KGS', 2)
		static readonly KHR: Codes = new Codes('KHR', 2)
		static readonly KMF: Codes = new Codes('KMF', 0)
		static readonly KPW: Codes = new Codes('KPW', 2)
		static readonly KRW: Codes = new Codes('KRW', 0)
		static readonly KWD: Codes = new Codes('KWD', 3)
		static readonly KYD: Codes = new Codes('KYD', 2)
		static readonly KZT: Codes = new Codes('KZT', 2)
		static readonly LAK: Codes = new Codes('LAK', 2)
		static readonly LBP: Codes = new Codes('LBP', 2)
		static readonly LKR: Codes = new Codes('LKR', 2)
		static readonly LRD: Codes = new Codes('LRD', 2)
		static readonly LSL: Codes = new Codes('LSL', 2)
		static readonly LYD: Codes = new Codes('LYD', 3)
		static readonly MAD: Codes = new Codes('MAD', 2)
		static readonly MDL: Codes = new Codes('MDL', 2)
		static readonly MGA: Codes = new Codes('MGA', 2)
		static readonly MKD: Codes = new Codes('MKD', 2)
		static readonly MMK: Codes = new Codes('MMK', 2)
		static readonly MNT: Codes = new Codes('MNT', 2)
		static readonly MOP: Codes = new Codes('MOP', 2)
		static readonly MRU: Codes = new Codes('MRU', 2)
		static readonly MUR: Codes = new Codes('MUR', 2)
		static readonly MVR: Codes = new Codes('MVR', 2)
		static readonly MWK: Codes = new Codes('MWK', 2)
		static readonly MXN: Codes = new Codes('MXN', 2)
		static readonly MXV: Codes = new Codes('MXV', 2)
		static readonly MYR: Codes = new Codes('MYR', 2)
		static readonly MZN: Codes = new Codes('MZN', 2)
		static readonly NAD: Codes = new Codes('NAD', 2)
		static readonly NGN: Codes = new Codes('NGN', 2)
		static readonly NIO: Codes = new Codes('NIO', 2)
		static readonly NOK: Codes = new Codes('NOK', 2)
		static readonly NPR: Codes = new Codes('NPR', 2)
		static readonly NZD: Codes = new Codes('NZD', 2)
		static readonly OMR: Codes = new Codes('OMR', 3)
		static readonly PAB: Codes = new Codes('PAB', 2)
		static readonly PEN: Codes = new Codes('PEN', 2)
		static readonly PGK: Codes = new Codes('PGK', 2)
		static readonly PHP: Codes = new Codes('PHP', 2)
		static readonly PKR: Codes = new Codes('PKR', 2)
		static readonly PLN: Codes = new Codes('PLN', 2)
		static readonly PYG: Codes = new Codes('PYG', 0)
		static readonly QAR: Codes = new Codes('QAR', 2)
		static readonly RON: Codes = new Codes('RON', 2)
		static readonly RSD: Codes = new Codes('RSD', 2)
		static readonly RUB: Codes = new Codes('RUB', 2)
		static readonly RWF: Codes = new Codes('RWF', 0)
		static readonly SAR: Codes = new Codes('SAR', 2)
		static readonly SBD: Codes = new Codes('SBD', 2)
		static readonly SCR: Codes = new Codes('SCR', 2)
		static readonly SDG: Codes = new Codes('SDG', 2)
		static readonly SEK: Codes = new Codes('SEK', 2)
		static readonly SGD: Codes = new Codes('SGD', 2)
		static readonly SHP: Codes = new Codes('SHP', 2)
		static readonly SLL: Codes = new Codes('SLL', 2)
		static readonly SOS: Codes = new Codes('SOS', 2)
		static readonly SRD: Codes = new Codes('SRD', 2)
		static readonly SSP: Codes = new Codes('SSP', 2)
		static readonly STN: Codes = new Codes('STN', 2)
		static readonly SVC: Codes = new Codes('SVC', 2)
		static readonly SYP: Codes = new Codes('SYP', 2)
		static readonly SZL: Codes = new Codes('SZL', 2)
		static readonly THB: Codes = new Codes('THB', 2)
		static readonly TJS: Codes = new Codes('TJS', 2)
		static readonly TMT: Codes = new Codes('TMT', 2)
		static readonly TND: Codes = new Codes('TND', 3)
		static readonly TOP: Codes = new Codes('TOP', 2)
		static readonly TRY: Codes = new Codes('TRY', 2)
		static readonly TTD: Codes = new Codes('TTD', 2)
		static readonly TWD: Codes = new Codes('TWD', 2)
		static readonly TZS: Codes = new Codes('TZS', 2)
		static readonly UAH: Codes = new Codes('UAH', 2)
		static readonly UGX: Codes = new Codes('UGX', 0)
		static readonly USD: Codes = new Codes('USD', 2)
		static readonly USN: Codes = new Codes('USN', 2)
		static readonly UYI: Codes = new Codes('UYI', 0)
		static readonly UYU: Codes = new Codes('UYU', 2)
		static readonly UYW: Codes = new Codes('UYW', 4)
		static readonly UZS: Codes = new Codes('UZS', 2)
		static readonly VES: Codes = new Codes('VES', 2)
		static readonly VND: Codes = new Codes('VND', 0)
		static readonly VUV: Codes = new Codes('VUV', 0)
		static readonly WST: Codes = new Codes('WST', 2)
		static readonly XAF: Codes = new Codes('XAF', 0)
		static readonly XCD: Codes = new Codes('XCD', 2)
		static readonly XOF: Codes = new Codes('XOF', 0)
		static readonly XPF: Codes = new Codes('XPF', 0)
		static readonly XTS: Codes = new Codes('XTS', 0)
		static readonly YER: Codes = new Codes('YER', 2)
		static readonly ZAR: Codes = new Codes('ZAR', 2)
		static readonly ZMW: Codes = new Codes('ZMW', 2)
		static readonly ZWL: Codes = new Codes('ZWL', 2)

		/**
		 * Convert a string currency code into an {Code} object
		 * @param code currency code to convert to a Code if it exists (case-insensitive)
		 * @return the Correct {Code} object if found
		 * @throws {InternalError.Types.currencyCodeNotFound} if the currency code wasn't found
		 */
		static fromString(code: string): Codes | undefined {
			const values = Object.values(Codes)
			for (const value of values) {
				if (value.hasOwnProperty('precision')) {
					const codeObject = value as Codes
					if (codeObject.name == code.toUpperCase()) {
						return codeObject
					}
				}
			}
			return undefined
		}

		static isValid(code: string): boolean {
			if (Object.keys(Codes).includes(code)) {
				return true
			}
			return false
		}
	}
}
