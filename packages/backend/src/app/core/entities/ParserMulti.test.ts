import { ParserMulti } from './ParserMulti'
import { Verification } from './Verification'
import { readFileSync } from 'fs'
import { Parser } from './Parser'
import { Currency } from './Currency'
import faker from 'faker'
import { Consts } from '../definitions/Consts'
import { OutputError } from '../definitions/OutputError'

faker.seed(123)
const TAX_FILE = 'src/jest/test-files/Skattekonto.txt'

function fakerParserOption(): ParserMulti.Option {
  return {
    userId: faker.datatype.number(),
    name: faker.finance.accountName(),
    identifier: /this/,
    accountFrom: faker.datatype.number({ min: Consts.ACCOUNT_NUMBER_START, max: Consts.ACCOUNT_NUMBER_END }),
    currencyCodeDefault: 'SEK',
    matcher: /(?<date>\d{4}-\d{2}-\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g,
    lineMatchers: [fakerLineMatcher(/line/)],
  }
}

function fakerLineMatcher(identifier: RegExp): ParserMulti.LineInfo {
  return {
    identifier: identifier,
    internalName: faker.commerce.product(),
    accountTo: faker.datatype.number({ min: Consts.ACCOUNT_NUMBER_START, max: Consts.ACCOUNT_NUMBER_END }),
    type: Verification.Types.TRANSACTION,
  }
}

describe('Parser Multi #cold #entity', () => {
  const TAX_PARSER_OPTIONS: ParserMulti.Option = {
    userId: 1,
    name: 'Skattekonto',
    identifier: /Omfattar transaktionstyp/,
    accountFrom: 1630,
    currencyCodeDefault: 'SEK',
    matcher: /(?<year>\d{2})(?<month>\d{2})(?<day>\d{2})\s+(?<name>.*?)\s{4}\s+(?<amount>-?\d*?\s?\d*)\s{4}/g,
    lineMatchers: [
      {
        identifier: /Debiterad preliminärskatt/,
        internalName: 'TAX_ACCOUNT_PRELIMINARY_TAX',
        type: Verification.Types.TRANSACTION,
        accountTo: 2518,
      },
      {
        identifier: /Moms/,
        internalName: 'TAX_ACCOUNT_TAX_COLLECT',
        type: Verification.Types.TRANSACTION,
        accountTo: 1650,
      },
      {
        identifier: /ostnadsränta/,
        internalName: 'TAX_ACCOUNT_INTEREST_EXPENSE',
        type: Verification.Types.TRANSACTION,
        accountTo: 8423,
      },
    ],
  }

  let parser: ParserMulti

  beforeEach(() => {
    parser = new ParserMulti(fakerParserOption())
  })

  // Test taxes
  it('Tax example test', () => {
    const options = TAX_PARSER_OPTIONS
    const parser = new ParserMulti(options)

    const text = readFileSync(TAX_FILE, 'utf8')
    expect(parser.isOfType(text)).toStrictEqual(true)

    // Only test a few answers
    const valids: Parser.VerificationInfo[] = [
      {
        date: '2019-01-17',
        code: Currency.Codes.SEK,
        name: 'Skattekonto: Debiterad preliminärskatt',
        internalName: 'TAX_ACCOUNT_PRELIMINARY_TAX',
        type: Verification.Types.TRANSACTION,
        amount: 555,
        accountFrom: 1630,
        accountTo: 2518,
      },
      {
        date: '2019-02-27',
        code: Currency.Codes.SEK,
        name: 'Skattekonto: Moms jan 2018 - dec 2018',
        internalName: 'TAX_ACCOUNT_TAX_COLLECT',
        type: Verification.Types.TRANSACTION,
        amount: -1111,
        accountFrom: 1630,
        accountTo: 1650,
      },
    ]

    const output = parser.parse(text)
    for (const valid of valids) {
      expect(output).toContainEqual(expect.objectContaining(valid))
    }
  })

  // Default currency codes
  it('Default currency codes', () => {
    let lineMatcher = fakerLineMatcher(/Line/)
    lineMatcher.currencyCodeDefault = 'USD'
    parser.lineMatchers = [lineMatcher, fakerLineMatcher(/Parser/)]

    const text =
      '2020-01-01; defaultCurrencyParser; 1;\n' +
      '2020-01-02; defaultCurrencyLine; 2;\n' +
      '2020-01-03; defaultCurrencyParser; 3; XTS;' + // Use set currency
      '2020-01-04; defaultCurrencyLine; 4; XTS;' // Use set currency

    const output = parser.parse(text)

    // SEK (using default from parser)
    expect(output[0]).toMatchObject({ code: Currency.Codes.SEK })

    // USD (using default from line)
    expect(output[1]).toMatchObject({ code: Currency.Codes.USD })

    // XTS for the rest
    expect(output[2]).toMatchObject({ code: Currency.Codes.XTS })
    expect(output[3]).toMatchObject({ code: Currency.Codes.XTS })
  })

  // Replace name
  it('Replace name', () => {
    const replacement = 'replacement'
    const lineMatcher = fakerLineMatcher(/line/)
    lineMatcher.nameReplacement = replacement
    parser.lineMatchers = [lineMatcher]

    const text = '2020-01-01; some line name; 1;' + '2020-01-01; another line; 1;'

    const output = parser.parse(text)

    expect.assertions(2)
    for (const outputLine of output) {
      expect(outputLine).toMatchObject({ name: replacement })
    }
  })

  // Use generic for non-matching lines
  it('Generic line info', () => {
    parser.generic = fakerLineMatcher(/generic/)
    parser.generic.internalName = 'GENERIC'
    const lineMatcher = fakerLineMatcher(/line/)
    lineMatcher.internalName = 'MATCHED_LINE'
    parser.lineMatchers = [lineMatcher]

    const text = '2020-01-01; line; 1; 2020-01-01; another; 1;'

    const output = parser.parse(text)
    expect(output[0]).toMatchObject({ internalName: 'MATCHED_LINE' })
    expect(output[1]).toMatchObject({ internalName: 'GENERIC' })
  })

  // Matcher with year, month, and day
  it('Matcher with year, month, and day', () => {
    parser.matcher =
      /(?<year>\d{2})(?<month>\d{2})(?<day>\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g

    const text = '200101; a line; 1; 200102; another line; 2; USD'

    const output = parser.parse(text)

    expect(output[0]).toMatchObject({ date: '2020-01-01' })
    expect(output[1]).toMatchObject({ date: '2020-01-02' })
  })

  // Validate matcher name
  it('Validate matcher name', () => {
    parser.matcher = /(?<date>\d{4}-\d{2}-\d{2}); (?<namee>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g

    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.parserMatcherGroupMissing,
        data: 'name',
      },
    ])

    parser.matcher = /(?<date>\d{4}-\d{2}-\d{2}); .*?; (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.parserMatcherGroupMissing,
        data: 'name',
      },
    ])
  })

  // Validate matcher amount
  it('Validate matcher amount', () => {
    parser.matcher = /(?<date>\d{4}-\d{2}-\d{2}); (?<name>.*?); (?<amountt>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g

    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.parserMatcherGroupMissing,
        data: 'amount',
      },
    ])

    parser.matcher = /(?<date>\d{4}-\d{2}-\d{2}); (?<name>.*?); (-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.parserMatcherGroupMissing,
        data: 'amount',
      },
    ])
  })

  // Validate matcher date
  it('Validate matcher date', () => {
    const errorDate = {
      type: OutputError.Types.parserMatcherGroupMissing,
      data: 'date',
    }
    const errorYear = {
      type: OutputError.Types.parserMatcherGroupMissing,
      data: 'year',
    }
    const errorDay = {
      type: OutputError.Types.parserMatcherGroupMissing,
      data: 'day',
    }
    const errorMonth = {
      type: OutputError.Types.parserMatcherGroupMissing,
      data: 'month',
    }

    // Missing all
    const validErrors = [errorDate, errorDay, errorYear, errorMonth]
    parser.matcher = /(?<daete>\d{4}-\d{2}-\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    for (const validError of validErrors) {
      expect(parser.validate()).toContainEqual(expect.objectContaining(validError))
    }

    parser.matcher = /(\d{4}-\d{2}-\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    for (const validError of validErrors) {
      expect(parser.validate()).toContainEqual(expect.objectContaining(validError))
    }

    // Missing day
    parser.matcher = parser.matcher =
      /(?<year>\d{2})(?<month>\d{2})(?<days>\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    expect(parser.validate()).toStrictEqual([errorDay])

    // Missing month
    parser.matcher = parser.matcher =
      /(?<year>\d{2})(?<months>\d{2})(?<day>\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    expect(parser.validate()).toStrictEqual([errorMonth])

    // Missing year
    parser.matcher = parser.matcher =
      /(?<years>\d{2})(?<month>\d{2})(?<day>\d{2}); (?<name>.*?); (?<amount>-?\d*?\s?\d*)(; (?<currency>\w{3});|;)/g
    expect(parser.validate()).toStrictEqual([errorYear])
  })

  // Validate parser name
  it('Validate parser name', () => {
    parser.name = '123'
    expect(parser.validate()).toStrictEqual([])

    parser.name = '12'
    expect(parser.validate()).toStrictEqual([{ type: OutputError.Types.nameTooShort, data: parser.name }])
  })

  // Validate account from
  it('Validate account from', () => {
    // Valid
    parser.accountFrom = 1000
    expect(parser.validate()).toStrictEqual([])
    parser.accountFrom = 9999
    expect(parser.validate()).toStrictEqual([])

    // Out of range
    parser.accountFrom = 999
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${parser.accountFrom}`,
      },
    ])

    parser.accountFrom = -100
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${parser.accountFrom}`,
      },
    ])

    parser.accountFrom = 10000
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${parser.accountFrom}`,
      },
    ])

    // Invalid format
    parser.accountFrom = 5555.5
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberInvalidFormat,
        data: `${parser.accountFrom}`,
      },
    ])
  })

  // Validate required line matchers or generic
  it('Validate required line matchers or generic', () => {
    parser.lineMatchers = []
    expect(parser.validate()).toStrictEqual([{ type: OutputError.Types.parserLineMatchersOrGenericRequired }])

    parser.generic = fakerLineMatcher(/generic/)
    expect(parser.validate()).toStrictEqual([])
  })

  // Validate line info name replacement (both generic and lineMatchers)
  it('Validate line info name replacement (both generic and lineMatchers)', () => {
    const lineInfo = fakerLineMatcher(/line/)
    lineInfo.nameReplacement = '123'

    // Passing
    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([])

    // Invalid
    lineInfo.nameReplacement = '12'

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.nameTooShort,
        data: lineInfo.nameReplacement,
      },
    ])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.nameTooShort,
        data: lineInfo.nameReplacement,
      },
    ])
  })

  // Validate line info internal name (both generic and lineMatchers)
  it('Validate line info internal name (both generic and lineMatchers)', () => {
    const lineInfo = fakerLineMatcher(/line/)
    lineInfo.internalName = '123'

    // Passing
    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([])

    // Invalid
    lineInfo.internalName = '12'

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.internalNameTooShort,
        data: lineInfo.internalName,
      },
    ])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.internalNameTooShort,
        data: lineInfo.internalName,
      },
    ])
  })

  // Validate line info account number to (both generic and lineMatchers)
  it('Validate line info account number to (both generic and lineMatchers)', () => {
    const lineInfo = fakerLineMatcher(/line/)

    // Passing
    lineInfo.accountTo = 1000

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([])

    lineInfo.accountTo = 9999

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([])

    // Out of range
    lineInfo.accountTo = 999

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${lineInfo.accountTo}`,
      },
    ])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${lineInfo.accountTo}`,
      },
    ])

    lineInfo.accountTo = 10000

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${lineInfo.accountTo}`,
      },
    ])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberOutOfRange,
        data: `${lineInfo.accountTo}`,
      },
    ])

    // Invalid Format
    lineInfo.accountTo = 5555.5

    parser.lineMatchers = []
    parser.generic = lineInfo
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberInvalidFormat,
        data: `${lineInfo.accountTo}`,
      },
    ])

    parser.lineMatchers = [lineInfo]
    parser.generic = undefined
    expect(parser.validate()).toStrictEqual([
      {
        type: OutputError.Types.accountNumberInvalidFormat,
        data: `${lineInfo.accountTo}`,
      },
    ])
  })

  it('Test for invalid currency code', () => {
    const text =
      '2020-01-0; line shit; 1;\n' + // Invalid date
      '2020-01-02; line; face; XTU\n' + // Invalid amount and currency
      '2020-01-03; line; 3; XTT;' + // Invalid currency
      '2020-01-04; line; 4; XTS;' // valid

    expect.assertions(2)
    try {
      parser.parse(text)
    } catch (exception) {
      expect(exception).toBeInstanceOf(OutputError)
      expect(exception.errors).toStrictEqual([{ type: OutputError.Types.currencyCodeInvalid, data: 'XTT' }])
    }
  })
})
