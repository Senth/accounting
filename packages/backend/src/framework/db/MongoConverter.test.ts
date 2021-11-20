import faker from 'faker'
import { MongoConverter } from './MongoConverter'
import { InternalError } from '../../app/core/definitions/InternalError'
import { ObjectId } from 'mongodb'
import { Currency } from '../../app/core/entities/Currency'
import { Transaction } from '../../app/core/entities/Transaction'
import { Verification } from '../../app/core/entities/Verification'
import { Account } from '../../app/core/entities/Account'
import { ParserSingle } from '../../app/core/entities/ParserSingle'
import { ParserMulti } from '../../app/core/entities/ParserMulti'
import { Consts } from '../../app/core/definitions/Consts'
import { FiscalYear } from '../../app/core/entities/FiscalYear'

faker.seed(123)

describe('MongoConverter #cold #helper', () => {
  // toDbObject()
  it('toDbObject() Test simple object', () => {
    const entity: any = {
      text: faker.random.words(),
      number: faker.datatype.number(),
    }

    const object = MongoConverter.toDbObject(entity)
    entity._id = object._id
    expect(object).toStrictEqual(entity)
  })

  it('toDbObject() Test object hiearchy', () => {
    const entity = {
      text: faker.random.words(),
      innerObject: {
        otherText: faker.random.words(),
      },
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      text: entity.text,
      innerObject: {
        otherText: entity.innerObject.otherText,
      },
    }

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Test bigint', () => {
    const entity = {
      biggie: 12345678912356546456n,
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      biggie: `${entity.biggie}n`,
    }
    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Test undefined', () => {
    const entity = {
      text: '',
      nothing: undefined,
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      text: '',
    }

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Test null', () => {
    const entity = {
      text: '',
      nothing: null,
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      text: '',
    }

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Test arrays', () => {
    const entity = {
      array: ['test', 123n],
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      array: ['test', '123n'],
    }

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Test ids', () => {
    const entity = {
      id: new ObjectId().toHexString(),
      userId: new ObjectId().toHexString(),
    }

    const valid = {
      _id: new ObjectId(entity.id),
      userId: new ObjectId(entity.userId),
    }

    const object = MongoConverter.toDbObject(entity)

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Test empty object', () => {
    expect.assertions(1)
    try {
      MongoConverter.toDbObject({})
    } catch (exception) {
      expect(exception).toBeInstanceOf(InternalError)
    }
  })

  it('toDbObject() Regex', () => {
    const entity = {
      regex: /hello world/,
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      regex: entity.regex,
    }

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Currency', () => {
    const entity = {
      currency: new Currency({
        amount: 1n,
        code: Currency.Codes.SEK,
      }),
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      currency: {
        amount: '1n',
        code: 'SEK',
      },
    }

    expect(object).toStrictEqual(valid)
  })

  it('toDbObject() Transaction', () => {
    const entity = {
      transaction: new Transaction({
        accountNumber: 1000,
        currency: new Currency({
          amount: 1n,
          code: Currency.Codes.SEK,
        }),
      }),
    }

    const object = MongoConverter.toDbObject(entity)

    const valid = {
      _id: object._id,
      transaction: {
        dateCreated: entity.transaction.dateCreated,
        dateModified: entity.transaction.dateModified,
        accountNumber: 1000,
        currency: {
          amount: '1n',
          code: 'SEK',
        },
      },
    }

    expect(object).toStrictEqual(valid)
  })

  // toOption()
  it('toOption() Test simple object', () => {
    const object: any = {
      text: faker.random.words(),
      number: faker.datatype.number(),
    }

    const entity = MongoConverter.toOption(object)
    expect(entity).toStrictEqual(object)
  })

  it('toOption() Test object hiearchy', () => {
    const object = {
      text: faker.random.words(),
      innerObject: {
        otherText: faker.random.words(),
      },
    }

    const entity = MongoConverter.toOption(object)

    expect(entity).toStrictEqual(object)
  })

  it('toOption() Test bigint', () => {
    const valid = {
      biggie: 12345678912356546456n,
    }
    const object = {
      biggie: `${valid.biggie}n`,
    }

    const entity = MongoConverter.toOption(object)

    expect(entity).toStrictEqual(valid)
  })

  it('toOption() Test null', () => {
    const object = {
      text: '',
      nothing: null,
    }

    const entity = MongoConverter.toOption(object)

    expect(entity).toStrictEqual(object)
  })

  it('toOption() Test arrays', () => {
    const object = {
      array: ['test', '123n'],
    }

    const entity = MongoConverter.toOption(object)

    const valid = {
      array: ['test', 123n],
    }

    expect(entity).toStrictEqual(valid)
  })

  it('toOption() Test ids', () => {
    const valid = {
      id: new ObjectId().toHexString(),
      userId: new ObjectId().toHexString(),
    }

    const object = {
      _id: new ObjectId(valid.id),
      userId: new ObjectId(valid.userId),
    }

    const entity = MongoConverter.toOption(object)

    expect(entity).toStrictEqual(valid)
  })

  it('toOption() Test invalid _id', () => {
    const valid = {
      _id: new ObjectId().toHexString(),
      userId: new ObjectId().toHexString(),
    }

    const object = {
      _id: valid._id,
      userId: valid.userId,
    }

    const entity = MongoConverter.toOption(object)

    expect(entity).toStrictEqual(valid)
  })

  it('toOption() Test empty object', () => {
    expect.assertions(1)
    try {
      MongoConverter.toOption({})
    } catch (exception) {
      expect(exception).toBeInstanceOf(InternalError)
    }
  })

  it('Regexp converter', () => {
    const entity = {
      id: new ObjectId().toHexString(),
      regex: /hello world/,
    }

    expect(MongoConverter.toOption(MongoConverter.toDbObject(entity))).toStrictEqual(entity)
  })

  it('toVerification() Minimum verification', () => {
    const valid = new Verification({
      id: new ObjectId().toHexString(),
      date: '2020-01-01',
      userId: new ObjectId().toHexString(),
      name: faker.commerce.productName(),
      type: Verification.Types.TRANSACTION,
      transactions: [],
    })

    const object = {
      _id: new ObjectId(valid.id),
      dateCreated: valid.dateCreated,
      dateModified: valid.dateModified,
      userId: new ObjectId(valid.userId),
      date: valid.date,
      name: valid.name,
      type: 'TRANSACTION',
      transactions: [],
    }

    const entity = MongoConverter.toVerification(object)

    expect(entity).toStrictEqual(valid)
  })

  it('toVerification() Full verification', () => {
    const option: Verification.Option = {
      id: new ObjectId().toHexString(),
      userId: new ObjectId().toHexString(),
      name: faker.commerce.productName(),
      internalName: faker.commerce.product(),
      number: faker.datatype.number(),
      date: '2020-01-01',
      dateFiled: faker.datatype.number(),
      dateCreated: faker.datatype.number(),
      dateModified: faker.datatype.number(),
      dateDeleted: faker.datatype.number(),
      type: Verification.Types.TRANSACTION,
      description: 'A description',
      totalAmount: {
        amount: 1n,
        code: 'SEK',
      },
      files: ['hello', 'another file'],
      invoiceId: new ObjectId().toHexString(),
      paymentId: new ObjectId().toHexString(),
      requireConfirmation: true,
      transactions: [
        {
          dateCreated: faker.datatype.number(),
          dateModified: faker.datatype.number(),
          dateDeleted: faker.datatype.number(),
          accountNumber: 2020,
          currency: {
            amount: 1n,
            localAmount: 10n,
            code: 'USD',
            localCode: 'SEK',
            exchangeRate: 10,
          },
        },
        {
          dateCreated: faker.datatype.number(),
          dateModified: faker.datatype.number(),
          dateDeleted: faker.datatype.number(),
          accountNumber: 4661,
          currency: {
            amount: -1n,
            localAmount: -10n,
            code: 'USD',
            localCode: 'SEK',
            exchangeRate: 10,
          },
        },
      ],
    }

    const valid = new Verification(option)

    const object = {
      _id: new ObjectId(option.id),
      userId: new ObjectId(option.userId),
      name: option.name,
      internalName: option.internalName,
      number: option.number,
      date: '2020-01-01',
      dateFiled: option.dateFiled,
      dateCreated: option.dateCreated,
      dateModified: option.dateModified,
      dateDeleted: option.dateDeleted,
      type: Verification.Types.TRANSACTION,
      description: 'A description',
      totalAmount: {
        amount: '1n',
        code: 'SEK',
      },
      files: ['hello', 'another file'],
      invoiceId: new ObjectId(option.invoiceId),
      paymentId: new ObjectId(option.paymentId),
      requireConfirmation: true,
      transactions: [
        {
          dateCreated: option.transactions[0].dateCreated,
          dateModified: option.transactions[0].dateModified,
          dateDeleted: option.transactions[0].dateDeleted,
          accountNumber: 2020,
          currency: {
            amount: '1n',
            localAmount: '10n',
            code: 'USD',
            localCode: 'SEK',
            exchangeRate: 10,
          },
        },
        {
          dateCreated: option.transactions[1].dateCreated,
          dateModified: option.transactions[1].dateModified,
          dateDeleted: option.transactions[1].dateDeleted,
          accountNumber: 4661,
          currency: {
            amount: '-1n',
            localAmount: '-10n',
            code: 'USD',
            localCode: 'SEK',
            exchangeRate: 10,
          },
        },
      ],
    }

    const entity = MongoConverter.toVerification(object)

    expect(entity).toStrictEqual(valid)

    // Test back and forth
    expect(MongoConverter.toVerification(MongoConverter.toDbObject(entity))).toStrictEqual(valid)
  })

  it('Account converter', () => {
    const account = new Account({
      id: new ObjectId().toHexString(),
      name: 'Test',
      userId: new ObjectId().toHexString(),
      number: 2020,
      vatAccount: 2449,
      reverseVatAccount: 2555,
      vatCode: 15,
      vatPercentage: 0.25,
    })

    expect(MongoConverter.toAccount(MongoConverter.toDbObject(account))).toStrictEqual(account)
  })

  it('Single parser converter', () => {
    const parser = new ParserSingle({
      id: new ObjectId().toHexString(),
      name: 'Test parser',
      identifier: /test/,
      userId: new ObjectId().toHexString(),
      verification: {
        name: 'Name',
        internalName: 'INTERNAL_NAME',
        type: Verification.Types.INVOICE_IN,
        accountFrom: 2499,
        accountTo: 4330,
      },
      matcher: {
        date: {
          find: /\d{4}-\d{2}-\d{2}/,
        },
        currencyCode: {
          find: /(?<=code: )\w{3}/,
        },
        amount: {
          find: /(?<=total: )\d{1,4}/,
        },
      },
    })

    expect(MongoConverter.toParser(MongoConverter.toDbObject(parser))).toStrictEqual(parser)
  })

  it('Multiple parser converter', () => {
    const parser = new ParserMulti({
      id: new ObjectId().toHexString(),
      userId: new ObjectId().toHexString(),
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
          currencyCodeDefault: 'USD',
        },
      ],
    })

    expect(MongoConverter.toParser(MongoConverter.toDbObject(parser))).toStrictEqual(parser)
  })

  it('toFiscalYear()', () => {
    const fiscalYear = new FiscalYear({
      id: new ObjectId().toHexString(),
      userId: new ObjectId().toHexString(),
      simpleName: faker.date.past().toISOString(),
      from: '2000-01-01',
      to: '2000-12-31',
      startingBalances: [
        {
          accountNumber: faker.datatype.number({ min: Consts.ACCOUNT_NUMBER_START, max: Consts.ACCOUNT_NUMBER_END }),
          amount: BigInt(faker.datatype.number()),
        },
      ],
    })

    expect(MongoConverter.toFiscalYear(MongoConverter.toDbObject(fiscalYear))).toStrictEqual(fiscalYear)
  })
})
