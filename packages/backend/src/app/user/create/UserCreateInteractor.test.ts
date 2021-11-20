import { UserCreateInteractor } from './UserCreateInteractor'
import { UserCreateRepository } from './UserCreateRepository'
import { UserCreateInput } from './UserCreateInput'
import { UserCreateOutput } from './UserCreateOutput'
import faker from 'faker'
import { User } from '../../core/entities/User'
import { Currency } from '../../core/entities/Currency'

faker.seed(123)

describe('UserCreateInteractor #cold #use-case', () => {
  let interactor: UserCreateInteractor
  let repository: UserCreateRepository
  let input: UserCreateInput
  let output: UserCreateOutput
  let promise: Promise<UserCreateOutput>
  let savedUser: User | undefined

  beforeAll(() => {
    repository = {
      saveUser: async (user) => {
        savedUser = user
        return savedUser
      },
    }
    interactor = new UserCreateInteractor(repository)
  })

  beforeEach(() => {
    savedUser = undefined
  })

  it('Create new user and save it', async () => {
    input = {
      user: {
        email: faker.internet.email(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        localCurrencyCode: 'SEK',
      },
    }

    const valid = {
      email: input.user.email,
      firstName: input.user.firstName,
      lastName: input.user.lastName,
      localCurrencyCode: Currency.Codes.fromString(input.user.localCurrencyCode),
    }

    output = await interactor.execute(input)

    expect(output.user).toStrictEqual(savedUser)
    expect(output.user).toMatchObject(valid)
    expect(output.user.apiKey).not.toEqual(undefined)
  })
})
