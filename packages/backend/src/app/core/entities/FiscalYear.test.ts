import { FiscalYear } from './FiscalYear'
import faker from 'faker'
import { Consts } from '../definitions/Consts'
import { OutputError } from '../definitions/OutputError'

faker.seed(123)

describe('FiscalYear #cold #entity', () => {
  it('validate() simple name', () => {
    const fiscalYear = fakerFiscalYear()
    expect(fiscalYear.validate()).toStrictEqual([])

    fiscalYear.simpleName = '123'
    expect(fiscalYear.validate()).toStrictEqual([])

    // Invalid
    fiscalYear.simpleName = '12'
    const validError: OutputError.Info = {
      type: OutputError.Types.nameTooShort,
      data: fiscalYear.simpleName,
    }
    expect(fiscalYear.validate()).toStrictEqual([validError])
  })

  it('validate() date format', () => {
    let fiscalYear = fakerFiscalYear()
    expect(fiscalYear.validate()).toStrictEqual([])

    fiscalYear.from = '1999-13-01'
    const validError: OutputError.Info = {
      type: OutputError.Types.dateFormatInvalid,
      data: fiscalYear.from,
    }
    expect(fiscalYear.validate()).toStrictEqual([validError])

    fiscalYear = fakerFiscalYear()
    fiscalYear.to = '2000-02-30'
    validError.data = fiscalYear.to
    expect(fiscalYear.validate()).toStrictEqual([validError])
  })

  it('validate() date ordering', () => {
    let fiscalYear = fakerFiscalYear()
    expect(fiscalYear.validate()).toStrictEqual([])

    fiscalYear.from = '2001-01-01'
    fiscalYear.to = '2000-01-01'
    const validError: OutputError.Info = {
      type: OutputError.Types.fiscalYearToBeforeFrom,
    }
    expect(fiscalYear.validate()).toStrictEqual([validError])
  })

  it('validate() account numbering', () => {
    let fiscalYear = fakerFiscalYear()
    expect(fiscalYear.validate()).toStrictEqual([])

    fiscalYear.startingBalances[0].accountNumber = 1000
    expect(fiscalYear.validate()).toStrictEqual([])
    fiscalYear.startingBalances[0].accountNumber = 9999
    expect(fiscalYear.validate()).toStrictEqual([])

    fiscalYear.startingBalances[0].accountNumber = 999
    const validError: OutputError.Info = {
      type: OutputError.Types.accountNumberOutOfRange,
      data: '999',
    }
    expect(fiscalYear.validate()).toStrictEqual([validError])

    fiscalYear.startingBalances[0].accountNumber = 10000
    validError.data = '10000'
    expect(fiscalYear.validate()).toStrictEqual([validError])
  })
})

/////////////////////
//			FAKERS
////////////////////
function fakerFiscalYear(): FiscalYear {
  return new FiscalYear({
    userId: 1,
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
}
