import faker from 'faker'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { InternalError } from '../definitions/InternalError'

faker.seed(123)

const TEST_TIMES = 1000

function faker_valid_amount(): bigint {
  return BigInt(faker.datatype.number({ min: -10000000, max: 1000000 }))
}

describe('Currency tester #cold #entity', () => {
  let data

  it('Minimum valid currency', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
    }
    const valid = {
      amount: data.amount,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data)).toEqual(valid)

    // Small letters
    data = {
      amount: data.amount,
      code: 'sek',
    }
    expect(new Currency(data)).toEqual(valid)
  })

  // Using number as amount
  it('Amount as number', () => {
    data = {
      amount: 10.501,
      code: 'SEK',
    }

    const valid = {
      amount: 1050n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data)).toEqual(valid)

    data.amount = 10.49999
    expect(new Currency(data)).toEqual(valid)

    data.amount = 10.5049999
    expect(new Currency(data)).toEqual(valid)

    data.amount = 10.505
    valid.amount = 1051n
    expect(new Currency(data)).toEqual(valid)

    data.amount = 10.50500001
    expect(new Currency(data)).toEqual(valid)

    // Negative
    data.amount = -10.501
    valid.amount = -1050n
    expect(new Currency(data)).toEqual(valid)

    data.amount = -10.49999
    expect(new Currency(data)).toEqual(valid)

    data.amount = -10.5049999
    expect(new Currency(data)).toEqual(valid)

    data.amount = -10.505
    valid.amount = -1051n
    expect(new Currency(data)).toEqual(valid)

    data.amount = -10.505000001
    expect(new Currency(data)).toEqual(valid)
  })

  // Currency code
  it('Invalid currency code', () => {
    expect.assertions(2)

    data = {
      amount: faker_valid_amount(),
      code: 'INVALID',
    }

    try {
      new Currency(data)
    } catch (e) {
      const errorObject = [OutputError.Types.currencyCodeInvalid]
      expect(e).toBeInstanceOf(InternalError)
      expect(e).toHaveProperty('error', errorObject)
    }
  })

  it('Input currency code as Code not string', () => {
    data = {
      amount: faker_valid_amount(),
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data)).toEqual(data)
  })

  // Local currency code
  it('Invalid local currency code', () => {
    expect.assertions(2)

    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
      localCode: 'INVALID',
      exchangeRate: 12,
    }

    try {
      new Currency(data)
    } catch (error) {
      const errorObject = [OutputError.Types.currencyCodeLocalInvalid]
      expect(error).toBeInstanceOf(InternalError)
      expect(error).toHaveProperty('error', errorObject)
    }
  })

  it('Input local currency code as Code not string', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
      localCode: Currency.Codes.USD,
      exchangeRate: 1,
    }
    let valid = {
      amount: data.amount,
      localAmount: data.amount,
      code: Currency.Codes.SEK,
      localCode: Currency.Codes.USD,
      exchangeRate: 1,
    }
    expect(new Currency(data)).toEqual(valid)
  })

  it('Missing local currency code', () => {
    expect.assertions(2)

    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
      exchangeRate: 12,
    }
    try {
      new Currency(data)
    } catch (error) {
      const errorObject = [OutputError.Types.currencyCodeLocalNotSet]
      expect(error).toBeInstanceOf(InternalError)
      expect(error).toHaveProperty('error', errorObject)
    }
  })

  it('Currency codes are the same', () => {
    expect.assertions(2)

    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
      localCode: 'SEK',
      exchangeRate: 12,
    }
    try {
      new Currency(data)
    } catch (error) {
      const errorObject = [OutputError.Types.currencyCodesAreSame]
      expect(error).toBeInstanceOf(InternalError)
      expect(error).toHaveProperty('error', errorObject)
    }
  })

  // Exchange rate
  it('Exchange rate below 0', () => {
    for (let i = 0; i < TEST_TIMES; ++i) {
      data = {
        amount: faker_valid_amount(),
        code: 'SEK',
        localCode: 'USD',
        exchangeRate: faker.datatype.number({ min: -1000, max: -0.00001, precision: 6 }),
      }
      new Currency(data)
    }
  })

  it('Exchange rate is 0', () => {
    expect.assertions(2)

    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
      localCode: 'USD',
      exchangeRate: 0,
    }
    try {
      new Currency(data)
    } catch (error) {
      const errorObject = [OutputError.Types.exchangeRateZero]
      expect(error).toBeInstanceOf(InternalError)
      expect(error).toHaveProperty('error', errorObject)
    }
  })

  it('Exchange rate is missing', () => {
    expect.assertions(2)

    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
      localCode: 'USD',
    }
    try {
      new Currency(data)
    } catch (error) {
      const errorObject = [OutputError.Types.exchangeRateNotSet]
      expect(error).toBeInstanceOf(InternalError)
      expect(error).toHaveProperty('error', errorObject)
    }
  })

  // isZero()
  it('isZero() -> Checking if amount is equal to 0', () => {
    data = {
      amount: 0n,
      code: 'SEK',
    }
    let currency = new Currency(data)
    expect(currency.isZero()).toBe(true)

    data = {
      amount: -1n,
      code: 'SEK',
    }
    currency = new Currency(data)
    expect(currency.isZero()).toBe(false)

    data = {
      amount: 1n,
      code: 'SEK',
    }
    currency = new Currency(data)
    expect(currency.isZero()).toBe(false)
  })

  // isPositive()
  it('isPositive() -> Check various inputs', () => {
    data = {
      amount: 0n,
      code: 'SEK',
    }
    let currency = new Currency(data)
    expect(currency.isPositive()).toBe(false)

    data = {
      amount: -1n,
      code: 'SEK',
    }
    currency = new Currency(data)
    expect(currency.isPositive()).toBe(false)

    data = {
      amount: 1n,
      code: 'SEK',
    }
    currency = new Currency(data)
    expect(currency.isPositive()).toBe(true)
  })

  // isNegative()
  it('isNegative() -> Check various inputs', () => {
    data = {
      amount: 0n,
      code: 'SEK',
    }
    let currency = new Currency(data)
    expect(currency.isNegative()).toBe(false)

    data = {
      amount: -1n,
      code: 'SEK',
    }
    currency = new Currency(data)
    expect(currency.isNegative()).toBe(true)

    data = {
      amount: 1n,
      code: 'SEK',
    }
    currency = new Currency(data)
    expect(currency.isNegative()).toBe(false)
  })

  // getLocalAmount()
  it('getLocalAmount() -> No local code, returning this directly', () => {
    data = {
      amount: faker_valid_amount(),
      code: 'SEK',
    }
    const currency = new Currency(data)
    expect(currency.getLocalCurrency()).toEqual(currency)

    let valid = {
      amount: data.amount,
      code: Currency.Codes.SEK,
    }
    expect(currency).toEqual(valid)
  })

  it('getLocalAmount() -> Simple test of conversion from 100 USD -> 1000 SEK', () => {
    data = {
      amount: 100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    }
    let valid = {
      amount: 1000n,
      code: Currency.Codes.SEK,
    }
    let currency = new Currency(data)
    expect(currency.getLocalCurrency()).toEqual(valid)

    let validFull = {
      amount: 100n,
      code: Currency.Codes.USD,
      localAmount: 1000n,
      localCode: Currency.Codes.SEK,
      exchangeRate: 10,
    }
    expect(currency).toEqual(validFull)
  })

  it('getLocalAmount() -> Test precision system conversion (with exchange rate of 1)', () => {
    // From SEK to JPY
    data = {
      amount: 1000n,
      code: 'SEK',
      localCode: 'JPY',
      exchangeRate: 1,
    }
    let valid = {
      amount: 10n,
      code: Currency.Codes.JPY,
    }
    let currency = new Currency(data)
    expect(currency.getLocalCurrency()).toEqual(valid)

    let validFull = {
      amount: 1000n,
      code: Currency.Codes.SEK,
      localAmount: 10n,
      localCode: Currency.Codes.JPY,
      exchangeRate: 1,
    }
    expect(currency).toEqual(validFull)

    // Back from JPY to SEK
    data = {
      amount: 10n,
      code: 'JPY',
      localCode: 'SEK',
      exchangeRate: 1,
    }
    valid = {
      amount: 1000n,
      code: Currency.Codes.SEK,
    }
    currency = new Currency(data)
    expect(currency.getLocalCurrency()).toEqual(valid)

    validFull = {
      amount: 10n,
      code: Currency.Codes.JPY,
      localAmount: 1000n,
      localCode: Currency.Codes.SEK,
      exchangeRate: 1,
    }
    expect(currency).toEqual(validFull)
  })

  it('getLocalAmount() -> Test various exchange rates to same precision', () => {
    for (let i = 0; i < TEST_TIMES; ++i) {
      const exchangeRate = faker.datatype.number({ min: 0.00001, max: 1000, precision: 0.00000001 })
      const from = faker_valid_amount()
      const to = Math.round(Number(from) * (exchangeRate + Number.EPSILON))

      data = {
        amount: from,
        code: 'SEK',
        localCode: 'USD',
        exchangeRate: exchangeRate,
      }

      let valid = {
        amount: BigInt(to),
        code: Currency.Codes.USD,
      }
      let currency = new Currency(data)
      expect(currency.getLocalCurrency()).toEqual(valid)

      let validFull = {
        amount: from,
        code: Currency.Codes.SEK,
        localAmount: BigInt(to),
        localCode: Currency.Codes.USD,
        exchangeRate: exchangeRate,
      }
      expect(currency).toEqual(validFull)
    }
  })

  it('getLocalAmount() -> Testing positive edge cases', () => {
    data = {
      amount: 1000n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1.0005,
    }

    let valid = {
      amount: 1001n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).getLocalCurrency()).toEqual(valid)

    data = {
      amount: 1000n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1.00049999,
    }

    valid = {
      amount: 1000n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).getLocalCurrency()).toEqual(valid)
  })

  it('getLocalAmount() -> Testing negative edge cases', () => {
    data = {
      amount: -1000n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1.0005,
    }

    let valid = {
      amount: -1001n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).getLocalCurrency()).toEqual(valid)

    data = {
      amount: -1000n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 1.00049999,
    }

    valid = {
      amount: -1000n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).getLocalCurrency()).toEqual(valid)
  })

  it('getLocalAmount() -> Changing precision with exchange rate at the same time', () => {
    data = {
      amount: 1000n,
      code: 'JPY',
      localCode: 'SEK',
      exchangeRate: 1.56,
    }

    let valid = {
      amount: 156000n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).getLocalCurrency()).toEqual(valid)
  })

  // negate()
  it('negate() -> Test to negate an amount', () => {
    // Minimal info
    data = {
      amount: 1000n,
      code: 'SEK',
    }
    let valid = {
      amount: -data.amount,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).negate()).toEqual(valid)

    // Full info
    data = {
      amount: 1000n,
      code: 'SEK',
      localCode: 'USD',
      exchangeRate: 15.005,
    }
    let validSecond = {
      amount: -data.amount,
      code: Currency.Codes.SEK,
      localAmount: -15005n,
      localCode: Currency.Codes.USD,
      exchangeRate: data.exchangeRate,
    }
    expect(new Currency(data).negate()).toEqual(validSecond)
  })

  // Absolute
  it('absolute() -> Test for returning absolute', () => {
    // Positive - Minimal info
    data = {
      amount: 1000n,
      code: 'SEK',
    }
    const valid = {
      amount: data.amount,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).absolute()).toEqual(valid)

    // Positive - Full info
    data = {
      amount: 1000n,
      code: 'SEK',
      localCode: 'USD',
      exchangeRate: 15.005,
    }
    const validSecond = {
      amount: data.amount,
      code: Currency.Codes.SEK,
      localAmount: 15005n,
      localCode: Currency.Codes.USD,
      exchangeRate: data.exchangeRate,
    }
    expect(new Currency(data).absolute()).toEqual(validSecond)

    // Negative - Minimal info
    data = {
      amount: -1000n,
      code: 'SEK',
    }
    expect(new Currency(data).absolute()).toEqual(valid)

    // Negative - Full info
    data = {
      amount: -1000n,
      code: 'SEK',
      localCode: 'USD',
      exchangeRate: 15.005,
    }
    expect(new Currency(data).absolute()).toEqual(validSecond)
  })

  // multiply()
  it('multiply() -> Test to multiply values', () => {
    // Minimum value
    data = {
      amount: 100n,
      code: 'SEK',
    }
    let valid = {
      amount: 13n,
      code: Currency.Codes.SEK,
    }
    expect(new Currency(data).multiply(0.13)).toEqual(valid)

    // Full value
    data = {
      amount: -100n,
      code: 'USD',
      localAmount: -500n,
      localCode: 'SEK',
      exchangeRate: 1,
    }
    let validFull = {
      amount: -167n,
      localAmount: -833n,
      code: Currency.Codes.USD,
      localCode: Currency.Codes.SEK,
      exchangeRate: 1,
    }
    expect(new Currency(data).multiply(5 / 3)).toEqual(validFull)
  })

  // split()
  it('split() -> Test for splitting amounts', () => {
    data = {
      amount: 133.34,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 8.354867,
    }

    let currency = new Currency(data)
    let [costPart, vatPart] = currency.split([0.8, 0.2])

    const validCost = {
      amount: 10667n,
      localAmount: 89123n,
      code: Currency.Codes.USD,
      localCode: Currency.Codes.SEK,
      exchangeRate: 8.354867,
    }
    expect(costPart).toEqual(validCost)

    const validVat = {
      amount: 2667n,
      localAmount: 22281n,
      code: Currency.Codes.USD,
      localCode: Currency.Codes.SEK,
      exchangeRate: 8.354867,
    }
    expect(vatPart).toEqual(validVat)

    const valid = {
      amount: 13334n,
      localAmount: 111404n,
      code: Currency.Codes.USD,
      localCode: Currency.Codes.SEK,
      exchangeRate: 8.354867,
    }
    expect(currency).toEqual(valid)
  })

  it('split() -> Invalid number of inputs', () => {
    expect.assertions(4)
    data = {
      amount: 10n,
      code: 'SEK',
    }
    const currency = new Currency(data)
    try {
      currency.split([])
    } catch (e) {
      expect(e).toBeInstanceOf(InternalError)
      expect(e).toMatchObject({
        type: InternalError.Types.tooFewElements,
      })
    }

    try {
      currency.split([1])
    } catch (e) {
      expect(e).toBeInstanceOf(InternalError)
      expect(e).toMatchObject({
        type: InternalError.Types.tooFewElements,
      })
    }
  })

  // fromString()
  it('fromString() -> function valid', () => {
    expect.assertions(2 * CODES.length)
    for (const codeString of CODES) {
      const code = Currency.Codes.fromString(codeString)
      expect(code).toBeDefined()
      expect(code!.name).toStrictEqual(codeString)
    }
  })
})

const CODES: string[] = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BOV',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BZD',
  'CAD',
  'CDF',
  'CHE',
  'CHF',
  'CHW',
  'CLF',
  'CLP',
  'CNY',
  'COP',
  'COU',
  'CRC',
  'CUC',
  'CUP',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ERN',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'GBP',
  'GEL',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'IQD',
  'IRR',
  'ISK',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KPW',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'LYD',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRU',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MXV',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SDG',
  'SEK',
  'SGD',
  'SHP',
  'SLL',
  'SOS',
  'SRD',
  'SSP',
  'STN',
  'SVC',
  'SYP',
  'SZL',
  'THB',
  'TJS',
  'TMT',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'USD',
  'USN',
  'UYI',
  'UYU',
  'UYW',
  'UZS',
  'VES',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XCD',
  'XOF',
  'XPF',
  'YER',
  'ZAR',
  'ZMW',
  'ZWL',
]
