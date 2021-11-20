import { FiscalYearGetAllInteractor } from './FiscalYearGetAllInteractor'
import { FiscalYearGetAllRepository } from './FiscalYearGetAllRepository'
import { FiscalYearGetAllInput } from './FiscalYearGetAllInput'
import { FiscalYearGetAllOutput } from './FiscalYearGetAllOutput'
import { FiscalYear } from '../../core/entities/FiscalYear'
import { Id } from '../../core/definitions/Id'
import { OutputError } from '../../core/definitions/OutputError'

describe('FiscalYearGetAll() #cold #use-case', () => {
  let interactor: FiscalYearGetAllInteractor
  let repository: FiscalYearGetAllRepository
  let input: FiscalYearGetAllInput
  let output: FiscalYearGetAllOutput
  let promise: Promise<FiscalYearGetAllOutput>

  beforeAll(() => {
    repository = {
      async getFiscalYears(userId: Id): Promise<FiscalYear[]> {
        if (userId === 1) {
          return [
            new FiscalYear({
              userId: 1,
              startingBalances: [],
              from: '2012-01-01',
              to: '2012-12-31',
            }),
          ]
        } else if (userId === -1) {
          throw Error('Test error')
        } else {
          return []
        }
      },
    }
    interactor = new FiscalYearGetAllInteractor(repository)
  })

  it('FiscalYearGetAll()', async () => {
    // Found years
    input = { userId: 1 }
    output = await interactor.execute(input)
    expect(output.fiscalYears).toHaveLength(1)

    // None found
    input = { userId: 1656 }
    output = await interactor.execute(input)
    expect(output.fiscalYears).toHaveLength(0)

    // Internal error
    input = { userId: -1 }
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.internalError))
  })
})
