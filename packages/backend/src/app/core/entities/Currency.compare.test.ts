import faker from 'faker'
import { Currency } from './Currency'

faker.seed(123)

function faker_valid_amount(): bigint {
  return BigInt(faker.datatype.number({ min: -10000000, max: 1000000 }))
}

describe('Currency compare tests #cold #entity', () => {
  let data: Currency.Option

  // Less than -> Greater than test data
  const fullValue = new Currency({
    amount: 10n,
    code: 'USD',
    localCode: 'SEK',
    exchangeRate: 10,
  })

  const lessThanMinimal = new Currency({
    amount: 15n,
    code: 'SEK',
  })

  const greaterThanFull = new Currency({
    amount: 10n,
    code: 'EUR',
    localCode: 'SEK',
    exchangeRate: 11,
  })

  const equalMinimal = new Currency({
    amount: 100n,
    code: 'SEK',
  })

  const equalFull = new Currency({
    amount: 50n,
    code: 'EUR',
    localCode: 'SEK',
    exchangeRate: 2,
  })

  const minimalPositive = new Currency({
    amount: 10n,
    code: 'SEK',
  })

  const minimalNegative = new Currency({
    amount: -10n,
    code: 'SEK',
  })

  // Smaller than -> Larger than test data
  const slSmallerThanMinimal = new Currency({
    amount: -lessThanMinimal.amount,
    code: lessThanMinimal.code,
  })

  const slLargerThanFull = new Currency({
    amount: -greaterThanFull.amount,
    code: greaterThanFull.code,
    localCode: greaterThanFull.localCode,
    exchangeRate: greaterThanFull.exchangeRate,
  })

  const slEqualMinimal = new Currency({
    amount: -equalMinimal.amount,
    code: equalMinimal.code,
  })

  const slEqualFull = new Currency({
    amount: -equalFull.amount,
    code: equalFull.code,
    localCode: equalFull.localCode,
    exchangeRate: equalFull.exchangeRate,
  })

  const slMinimalLarger = new Currency({
    amount: -10n,
    code: 'SEK',
  })

  const slMinimalSmaller = new Currency({
    amount: -5n,
    code: 'SEK',
  })

  // isComparableTo()
  it('isComparableTo() -> Minimum data', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
    }
    let first = new Currency(data)
    expect(first.isComparableTo(first)).toBe(true)

    data = {
      amount: faker_valid_amount(),
      code: Currency.Codes.SEK,
    }
    let second = new Currency(data)
    expect(second.isComparableTo(second)).toBe(true)

    expect(first.isComparableTo(second)).toBe(true)
    expect(second.isComparableTo(first)).toBe(true)
  })

  it('isComparableTo() -> Extra data that is not used', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1,
    }
    let first = new Currency(data)
    expect(first.isComparableTo(first)).toBe(true)

    data = {
      amount: faker_valid_amount(),
      code: 'USD',
      localCode: Currency.Codes.AED,
      exchangeRate: 1,
    }
    let second = new Currency(data)
    expect(second.isComparableTo(second)).toBe(true)

    expect(first.isComparableTo(second)).toBe(true)
    expect(second.isComparableTo(first)).toBe(true)
  })

  it('isComparableTo() -> Can convert to local', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1,
    }
    let first = new Currency(data)

    data = {
      amount: faker_valid_amount(),
      code: 'AED',
      localCode: 'SEK',
      exchangeRate: 1,
    }
    let second = new Currency(data)

    expect(first.isComparableTo(second)).toBe(true)
    expect(second.isComparableTo(first)).toBe(true)
  })

  it('isComparableTo() -> Can compare where first.code == second.localCode', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1,
    }
    let first = new Currency(data)

    data = {
      amount: faker_valid_amount(),
      code: 'AED',
      localCode: 'USD',
      exchangeRate: 1,
    }
    let second = new Currency(data)

    expect(first.isComparableTo(second)).toBe(true)
    expect(second.isComparableTo(first)).toBe(true)
  })

  it('isComparableTo() -> Cannot compare with different local codes', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1,
    }
    let first = new Currency(data)

    data = {
      amount: faker_valid_amount(),
      code: 'AED',
      localCode: Currency.Codes.AFN,
      exchangeRate: 1,
    }
    let second = new Currency(data)

    expect(first.isComparableTo(second)).toBe(false)
    expect(second.isComparableTo(first)).toBe(false)
  })

  it('isComparableTo() -> Different codes and no locals are set', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'USD',
    }
    let first = new Currency(data)

    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
    }
    let second = new Currency(data)

    expect(first.isComparableTo(second)).toBe(false)
    expect(second.isComparableTo(first)).toBe(false)
  })

  // isEqualTo()
  it('isEqualTo() -> Basic inputs', () => {
    expect(minimalNegative.isEqualTo(minimalPositive)).toBe(false)
    expect(minimalPositive.isEqualTo(minimalNegative)).toBe(false)

    expect(minimalNegative.isEqualTo(minimalNegative)).toBe(true)
    expect(minimalPositive.isEqualTo(minimalPositive)).toBe(true)

    data = {
      amount: minimalNegative.amount,
      code: minimalNegative.code,
    }
    const other = new Currency(data)
    expect(minimalNegative.isEqualTo(other)).toBe(true)
  })

  // isEquallyLarge()
  it('isEquallyLarge() -> Full', () => {
    // Test aginst minimal
    expect(fullValue.isEquallyLarge(lessThanMinimal)).toBe(false)
    expect(fullValue.isEquallyLarge(slSmallerThanMinimal)).toBe(false)
    expect(lessThanMinimal.isEquallyLarge(fullValue)).toBe(false)
    expect(slSmallerThanMinimal.isEquallyLarge(fullValue)).toBe(false)

    // Both are converted
    expect(fullValue.isEquallyLarge(greaterThanFull)).toBe(false)
    expect(fullValue.isEquallyLarge(slLargerThanFull)).toBe(false)
    expect(greaterThanFull.isEquallyLarge(fullValue)).toBe(false)
    expect(slLargerThanFull.isEquallyLarge(fullValue)).toBe(false)

    // Equality
    expect(fullValue.isEquallyLarge(equalMinimal)).toBe(true)
    expect(fullValue.isEquallyLarge(slEqualMinimal)).toBe(true)
    expect(equalMinimal.isEquallyLarge(fullValue)).toBe(true)
    expect(slEqualMinimal.isEquallyLarge(fullValue)).toBe(true)
    expect(fullValue.isEquallyLarge(equalFull)).toBe(true)
    expect(fullValue.isEquallyLarge(slEqualFull)).toBe(true)
    expect(equalFull.isEquallyLarge(fullValue)).toBe(true)
    expect(slEqualFull.isEquallyLarge(fullValue)).toBe(true)
  })

  // isLessThan()
  it('isLessThan() -> Basic inputs', () => {
    expect(minimalPositive.isLessThan(minimalNegative)).toBe(false)
    expect(minimalNegative.isLessThan(minimalPositive)).toBe(true)

    // Equality
    expect(minimalPositive.isLessThan(minimalPositive)).toBe(false)
    expect(minimalNegative.isLessThan(minimalNegative)).toBe(false)
  })

  it('isLessThan() -> Currency conversion test', () => {
    // Test against minimal
    expect(fullValue.isLessThan(lessThanMinimal)).toBe(false)
    expect(lessThanMinimal.isLessThan(fullValue)).toBe(true)

    // Both are converted
    expect(fullValue.isLessThan(greaterThanFull)).toBe(true)
    expect(greaterThanFull.isLessThan(fullValue)).toBe(false)

    // Equality
    expect(fullValue.isLessThan(equalMinimal)).toBe(false)
    expect(equalMinimal.isLessThan(fullValue)).toBe(false)
    expect(fullValue.isLessThan(equalFull)).toBe(false)
    expect(equalFull.isLessThan(fullValue)).toBe(false)
  })

  // isLessThanEqualTo()
  it('isLessThanEqualTo() -> Basic inputs', () => {
    expect(minimalPositive.isLessThanEqualTo(minimalNegative)).toBe(false)
    expect(minimalNegative.isLessThanEqualTo(minimalPositive)).toBe(true)

    // Equality
    expect(minimalPositive.isLessThanEqualTo(minimalPositive)).toBe(true)
    expect(minimalNegative.isLessThanEqualTo(minimalNegative)).toBe(true)
  })

  it('isLessThanEqualTo() -> Currency conversion test', () => {
    // Test against minimal
    expect(fullValue.isLessThanEqualTo(lessThanMinimal)).toBe(false)
    expect(lessThanMinimal.isLessThanEqualTo(fullValue)).toBe(true)

    // Both are converted
    expect(fullValue.isLessThanEqualTo(greaterThanFull)).toBe(true)
    expect(greaterThanFull.isLessThanEqualTo(fullValue)).toBe(false)

    // Equality
    expect(fullValue.isLessThanEqualTo(equalMinimal)).toBe(true)
    expect(equalMinimal.isLessThanEqualTo(fullValue)).toBe(true)
    expect(fullValue.isLessThanEqualTo(equalFull)).toBe(true)
    expect(equalFull.isLessThanEqualTo(fullValue)).toBe(true)
  })

  // isGreaterThan()
  it('isGreaterThan() -> Basic inputs', () => {
    expect(minimalPositive.isGreaterThan(minimalNegative)).toBe(true)
    expect(minimalNegative.isGreaterThan(minimalPositive)).toBe(false)

    // Equality
    expect(minimalPositive.isGreaterThan(minimalPositive)).toBe(false)
    expect(minimalNegative.isGreaterThan(minimalNegative)).toBe(false)
  })

  it('isGreaterThan() -> Currency conversion test', () => {
    // Test against minimal
    expect(fullValue.isGreaterThan(lessThanMinimal)).toBe(true)
    expect(lessThanMinimal.isGreaterThan(fullValue)).toBe(false)

    // Both are converted
    expect(fullValue.isGreaterThan(greaterThanFull)).toBe(false)
    expect(greaterThanFull.isGreaterThan(fullValue)).toBe(true)

    // Equality
    expect(fullValue.isGreaterThan(equalMinimal)).toBe(false)
    expect(equalMinimal.isGreaterThan(fullValue)).toBe(false)
    expect(fullValue.isGreaterThan(equalFull)).toBe(false)
    expect(equalFull.isGreaterThan(fullValue)).toBe(false)
  })

  // isGreaterThanEqualTo()
  it('isGreaterThanEqualTo() -> Basic inputs', () => {
    expect(minimalPositive.isGreaterThanEqualTo(minimalNegative)).toBe(true)
    expect(minimalNegative.isGreaterThanEqualTo(minimalPositive)).toBe(false)

    // Equality
    expect(minimalPositive.isGreaterThanEqualTo(minimalPositive)).toBe(true)
    expect(minimalNegative.isGreaterThanEqualTo(minimalNegative)).toBe(true)
  })

  it('isGreaterThanEqualTo() -> Currency conversion test', () => {
    // Test against minimal
    expect(fullValue.isGreaterThanEqualTo(lessThanMinimal)).toBe(true)
    expect(lessThanMinimal.isGreaterThanEqualTo(fullValue)).toBe(false)

    // Both are converted
    expect(fullValue.isGreaterThanEqualTo(greaterThanFull)).toBe(false)
    expect(greaterThanFull.isGreaterThanEqualTo(fullValue)).toBe(true)

    // Equality
    expect(fullValue.isGreaterThanEqualTo(equalMinimal)).toBe(true)
    expect(equalMinimal.isGreaterThanEqualTo(fullValue)).toBe(true)
    expect(fullValue.isGreaterThanEqualTo(equalFull)).toBe(true)
    expect(equalFull.isGreaterThanEqualTo(fullValue)).toBe(true)
  })

  // isSmallerThan()
  it('isSmallerThan() -> Basic inputs', () => {
    expect(slMinimalLarger.isSmallerThan(slMinimalSmaller)).toBe(false)
    expect(slMinimalSmaller.isSmallerThan(slMinimalLarger)).toBe(true)
    expect(minimalPositive.isSmallerThan(slMinimalSmaller)).toBe(false)
    expect(slMinimalSmaller.isSmallerThan(minimalPositive)).toBe(true)

    // Equality
    expect(minimalPositive.isSmallerThan(minimalPositive)).toBe(false)
    expect(minimalNegative.isSmallerThan(minimalNegative)).toBe(false)
    expect(minimalPositive.isSmallerThan(minimalNegative)).toBe(false)
    expect(minimalNegative.isSmallerThan(minimalPositive)).toBe(false)
  })

  it('isSmallerThan() -> Currency conversion test', () => {
    // Test aginst minimal
    expect(fullValue.isSmallerThan(lessThanMinimal)).toBe(false)
    expect(fullValue.isSmallerThan(slSmallerThanMinimal)).toBe(false)
    expect(lessThanMinimal.isSmallerThan(fullValue)).toBe(true)
    expect(slSmallerThanMinimal.isSmallerThan(fullValue)).toBe(true)

    // Both are converted
    expect(fullValue.isSmallerThan(greaterThanFull)).toBe(true)
    expect(fullValue.isSmallerThan(slLargerThanFull)).toBe(true)
    expect(greaterThanFull.isSmallerThan(fullValue)).toBe(false)
    expect(slLargerThanFull.isSmallerThan(fullValue)).toBe(false)

    // Equality
    expect(fullValue.isSmallerThan(equalMinimal)).toBe(false)
    expect(fullValue.isSmallerThan(slEqualMinimal)).toBe(false)
    expect(equalMinimal.isSmallerThan(fullValue)).toBe(false)
    expect(slEqualMinimal.isSmallerThan(fullValue)).toBe(false)
    expect(fullValue.isSmallerThan(equalFull)).toBe(false)
    expect(fullValue.isSmallerThan(slEqualFull)).toBe(false)
    expect(equalFull.isSmallerThan(fullValue)).toBe(false)
    expect(slEqualFull.isSmallerThan(fullValue)).toBe(false)
  })

  // isSmallerThanEqualTo()
  it('isSmallerThanEqualTo() -> Basic inputs', () => {
    expect(slMinimalLarger.isSmallerThanEqualTo(slMinimalSmaller)).toBe(false)
    expect(slMinimalSmaller.isSmallerThanEqualTo(slMinimalLarger)).toBe(true)
    expect(minimalPositive.isSmallerThanEqualTo(slMinimalSmaller)).toBe(false)
    expect(slMinimalSmaller.isSmallerThanEqualTo(minimalPositive)).toBe(true)

    // Equality
    expect(minimalPositive.isSmallerThanEqualTo(minimalPositive)).toBe(true)
    expect(minimalNegative.isSmallerThanEqualTo(minimalNegative)).toBe(true)
    expect(minimalPositive.isSmallerThanEqualTo(minimalNegative)).toBe(true)
    expect(minimalNegative.isSmallerThanEqualTo(minimalPositive)).toBe(true)
  })

  it('isSmallerThanEqualTo() -> Currency conversion test', () => {
    // Test aginst minimal
    expect(fullValue.isSmallerThanEqualTo(lessThanMinimal)).toBe(false)
    expect(fullValue.isSmallerThanEqualTo(slSmallerThanMinimal)).toBe(false)
    expect(lessThanMinimal.isSmallerThanEqualTo(fullValue)).toBe(true)
    expect(slSmallerThanMinimal.isSmallerThanEqualTo(fullValue)).toBe(true)

    // Both are converted
    expect(fullValue.isSmallerThanEqualTo(greaterThanFull)).toBe(true)
    expect(fullValue.isSmallerThanEqualTo(slLargerThanFull)).toBe(true)
    expect(greaterThanFull.isSmallerThanEqualTo(fullValue)).toBe(false)
    expect(slLargerThanFull.isSmallerThanEqualTo(fullValue)).toBe(false)

    // Equality
    expect(fullValue.isSmallerThanEqualTo(equalMinimal)).toBe(true)
    expect(fullValue.isSmallerThanEqualTo(slEqualMinimal)).toBe(true)
    expect(equalMinimal.isSmallerThanEqualTo(fullValue)).toBe(true)
    expect(slEqualMinimal.isSmallerThanEqualTo(fullValue)).toBe(true)
    expect(fullValue.isSmallerThanEqualTo(equalFull)).toBe(true)
    expect(fullValue.isSmallerThanEqualTo(slEqualFull)).toBe(true)
    expect(equalFull.isSmallerThanEqualTo(fullValue)).toBe(true)
    expect(slEqualFull.isSmallerThanEqualTo(fullValue)).toBe(true)
  })

  // isLargerThan()
  it('isLargerThan() -> Basic inputs', () => {
    expect(slMinimalLarger.isLargerThan(slMinimalSmaller)).toBe(true)
    expect(slMinimalSmaller.isLargerThan(slMinimalLarger)).toBe(false)
    expect(minimalPositive.isLargerThan(slMinimalSmaller)).toBe(true)
    expect(slMinimalSmaller.isLargerThan(minimalPositive)).toBe(false)

    // Equality
    expect(minimalPositive.isLargerThan(minimalPositive)).toBe(false)
    expect(minimalNegative.isLargerThan(minimalNegative)).toBe(false)
    expect(minimalPositive.isLargerThan(minimalNegative)).toBe(false)
    expect(minimalNegative.isLargerThan(minimalPositive)).toBe(false)
  })

  it('isLargerThan() -> Currency conversion test', () => {
    // Test aginst minimal
    expect(fullValue.isLargerThan(lessThanMinimal)).toBe(true)
    expect(fullValue.isLargerThan(slSmallerThanMinimal)).toBe(true)
    expect(lessThanMinimal.isLargerThan(fullValue)).toBe(false)
    expect(slSmallerThanMinimal.isLargerThan(fullValue)).toBe(false)

    // Both are converted
    expect(fullValue.isLargerThan(greaterThanFull)).toBe(false)
    expect(fullValue.isLargerThan(slLargerThanFull)).toBe(false)
    expect(greaterThanFull.isLargerThan(fullValue)).toBe(true)
    expect(slLargerThanFull.isLargerThan(fullValue)).toBe(true)

    // Equality
    expect(fullValue.isLargerThan(equalMinimal)).toBe(false)
    expect(fullValue.isLargerThan(slEqualMinimal)).toBe(false)
    expect(equalMinimal.isLargerThan(fullValue)).toBe(false)
    expect(slEqualMinimal.isLargerThan(fullValue)).toBe(false)
    expect(fullValue.isLargerThan(equalFull)).toBe(false)
    expect(fullValue.isLargerThan(slEqualFull)).toBe(false)
    expect(equalFull.isLargerThan(fullValue)).toBe(false)
    expect(slEqualFull.isLargerThan(fullValue)).toBe(false)
  })

  // isLargerThanEqualTo()
  it('isLargerThanEqualTo() -> Basic inputs', () => {
    expect(slMinimalLarger.isLargerThanEqualTo(slMinimalSmaller)).toBe(true)
    expect(slMinimalSmaller.isLargerThanEqualTo(slMinimalLarger)).toBe(false)
    expect(minimalPositive.isLargerThanEqualTo(slMinimalSmaller)).toBe(true)
    expect(slMinimalSmaller.isLargerThanEqualTo(minimalPositive)).toBe(false)

    // Equality
    expect(minimalPositive.isLargerThanEqualTo(minimalPositive)).toBe(true)
    expect(minimalNegative.isLargerThanEqualTo(minimalNegative)).toBe(true)
    expect(minimalPositive.isLargerThanEqualTo(minimalNegative)).toBe(true)
    expect(minimalNegative.isLargerThanEqualTo(minimalPositive)).toBe(true)
  })

  it('isLargerThanEqualTo() -> Currency conversion test', () => {
    // Test aginst minimal
    expect(fullValue.isLargerThanEqualTo(lessThanMinimal)).toBe(true)
    expect(fullValue.isLargerThanEqualTo(slSmallerThanMinimal)).toBe(true)
    expect(lessThanMinimal.isLargerThanEqualTo(fullValue)).toBe(false)
    expect(slSmallerThanMinimal.isLargerThanEqualTo(fullValue)).toBe(false)

    // Both are converted
    expect(fullValue.isLargerThanEqualTo(greaterThanFull)).toBe(false)
    expect(fullValue.isLargerThanEqualTo(slLargerThanFull)).toBe(false)
    expect(greaterThanFull.isLargerThanEqualTo(fullValue)).toBe(true)
    expect(slLargerThanFull.isLargerThanEqualTo(fullValue)).toBe(true)

    // Equality
    expect(fullValue.isLargerThanEqualTo(equalMinimal)).toBe(true)
    expect(fullValue.isLargerThanEqualTo(slEqualMinimal)).toBe(true)
    expect(equalMinimal.isLargerThanEqualTo(fullValue)).toBe(true)
    expect(slEqualMinimal.isLargerThanEqualTo(fullValue)).toBe(true)
    expect(fullValue.isLargerThanEqualTo(equalFull)).toBe(true)
    expect(fullValue.isLargerThanEqualTo(slEqualFull)).toBe(true)
    expect(equalFull.isLargerThanEqualTo(fullValue)).toBe(true)
    expect(slEqualFull.isLargerThanEqualTo(fullValue)).toBe(true)
  })

  // isCodeEqualTo - true equalit
  it('isCodeEqualTo() check true equality for codes', () => {
    // Both undefined
    expect(Currency.isCodeEqualTo(undefined, undefined)).toStrictEqual(true)

    // One undefined
    expect(Currency.isCodeEqualTo(undefined, 'SEK')).toStrictEqual(false)
    expect(Currency.isCodeEqualTo('SEK', undefined)).toStrictEqual(false)
    expect(Currency.isCodeEqualTo(undefined, Currency.Codes.SEK)).toStrictEqual(false)
    expect(Currency.isCodeEqualTo(Currency.Codes.SEK, undefined)).toStrictEqual(false)

    // string against string
    expect(Currency.isCodeEqualTo('SEK', 'SEK')).toStrictEqual(true)
    expect(Currency.isCodeEqualTo('SEK', 'USD')).toStrictEqual(false)
    expect(Currency.isCodeEqualTo('USD', 'SEK')).toStrictEqual(false)

    // Code against Code
    expect(Currency.isCodeEqualTo(Currency.Codes.SEK, Currency.Codes.SEK)).toStrictEqual(true)
    expect(Currency.isCodeEqualTo(Currency.Codes.SEK, Currency.Codes.USD)).toStrictEqual(false)
    expect(Currency.isCodeEqualTo(Currency.Codes.USD, Currency.Codes.SEK)).toStrictEqual(false)

    // Code against string
    expect(Currency.isCodeEqualTo(Currency.Codes.SEK, 'SEK')).toStrictEqual(true)
    expect(Currency.isCodeEqualTo('SEK', Currency.Codes.SEK)).toStrictEqual(true)
    expect(Currency.isCodeEqualTo('USD', Currency.Codes.SEK)).toStrictEqual(false)
    expect(Currency.isCodeEqualTo(Currency.Codes.SEK, 'USD')).toStrictEqual(false)
  })

  // isEqualTo - true equality
  it('isEqualTo() check true equality for currency', () => {
    // Code is already checked in isCodeEqualTo(), no need for extensive testing there
    let first: Currency.Option = {
      amount: 1n,
      code: 'SEK',
    }

    let second: Currency.Option = {
      amount: 1n,
      code: Currency.Codes.SEK,
    }

    // Equal minimal
    expect(Currency.isEqualTo(first, second)).toStrictEqual(true)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(true)

    // Not equal minimal
    first = {
      amount: 10n,
      code: 'SEK',
    }

    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)

    // Full equality
    const full: Currency.Option = {
      amount: 1n,
      localAmount: 10n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    }
    first = full

    second = {
      amount: 1n,
      localAmount: 10n,
      code: Currency.Codes.USD,
      localCode: Currency.Codes.SEK,
      exchangeRate: 10,
    }

    expect(Currency.isEqualTo(first, second)).toStrictEqual(true)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(true)

    // Change exchangeRate
    first = {
      ...full,
      exchangeRate: 100,
    }
    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)

    // Change exchangeRate to undefined
    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)
    first = {
      ...full,
      exchangeRate: undefined,
    }

    // Change localcode
    first = {
      ...full,
      localCode: 'XTS',
    }
    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)

    // Undefined local code
    first = {
      ...full,
      localCode: undefined,
    }
    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)

    // Change localAmount
    first = {
      ...full,
      localAmount: 0n,
    }
    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)

    // Undefined localAmonut
    first = {
      ...full,
      localAmount: undefined,
    }
    expect(Currency.isEqualTo(first, second)).toStrictEqual(false)
    expect(Currency.isEqualTo(second, first)).toStrictEqual(false)
  })
})
