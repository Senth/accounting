import faker from 'faker'
import { Transaction } from './Transaction'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { Consts } from '../definitions/Consts'

faker.seed(123)
const TEST_TIMES = 1000
const CURRENCY_CODES = Object.values(Currency.Codes)

function fakerValidAccountNumber(): number {
  return faker.datatype.number({ min: Consts.ACCOUNT_NUMBER_START, max: Consts.ACCOUNT_NUMBER_END })
}

function fakerValidAmount(): bigint {
  let number: bigint
  do {
    number = BigInt(faker.datatype.number({ min: -1000000, max: 10000000 }))
  } while (number == 0n)
  return number
}

function fakerValidCurrencyAmount(): Currency.Option {
  return { amount: fakerValidAmount(), code: fakerValidCurrencyCode() }
}

function fakerValidCurrencyCode(): string {
  let currencyCode
  do {
    const index = faker.datatype.number({ min: 0, max: CURRENCY_CODES.length - 1 })
    currencyCode = CURRENCY_CODES[index]
  } while (!currencyCode.hasOwnProperty('precision'))
  return currencyCode.name
}

describe('Validate a transaction #cold #entity', () => {
  let transaction: Transaction

  beforeEach(() => {
    const data: Transaction.Option = {
      accountNumber: fakerValidAccountNumber(),
      currency: fakerValidCurrencyAmount(),
    }
    transaction = new Transaction(data)
  })

  // Account number
  it('Minimal valid transaction', () => {
    expect(transaction.validate()).toStrictEqual([])
  })

  it('Account number fails if negative', () => {
    for (let i = 0; i < TEST_TIMES; ++i) {
      transaction.accountNumber = faker.datatype.number({
        min: Number.MIN_SAFE_INTEGER,
        max: Consts.ACCOUNT_NUMBER_START - 1,
      })
      expect(transaction.validate()).toMatchObject([{ type: OutputError.Types.accountNumberOutOfRange }])
    }
  })

  it('Account number fails if too large', () => {
    for (let i = 0; i < TEST_TIMES; ++i) {
      transaction.accountNumber = faker.datatype.number({
        min: Consts.ACCOUNT_NUMBER_END + 1,
        max: Number.MAX_SAFE_INTEGER,
      })
      expect(transaction.validate()).toMatchObject([{ type: OutputError.Types.accountNumberOutOfRange }])
    }
  })

  it('Account number is invalid format (floating point)', () => {
    transaction.accountNumber = 1500.8
    expect(transaction.validate()).toStrictEqual([
      { type: OutputError.Types.accountNumberInvalidFormat, data: `${transaction.accountNumber}` },
    ])
  })

  // Currency
  it('Valid amount for the currency', () => {
    for (let i = 0; i < TEST_TIMES; ++i) {
      transaction.currency = new Currency(fakerValidCurrencyAmount())
      if (!transaction.currency.isZero()) {
        expect(transaction.validate()).toStrictEqual([])
      }
    }
  })

  it('Currency amount is 0', () => {
    transaction.currency = new Currency({ amount: 0n, code: fakerValidCurrencyCode() })
    expect(transaction.validate()).toStrictEqual([{ type: OutputError.Types.amountIsZero }])
  })
})
