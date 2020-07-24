import { UserGetByKeyInteractor } from './UserGetByKeyInteractor'
import { UserGetByKeyRepository } from './UserGetByKeyRepository'
import * as faker from 'faker'
import { UserGetByKeyInput } from './UserGetByKeyInput'
import { UserGetByKeyOutput } from './UserGetByKeyOutput'
import { InternalError } from '../../core/definitions/InternalError'
import { OutputError } from '../../core/definitions/OutputError'

describe('Verify Api Key #cold #use-case', () => {
	let interactor: UserGetByKeyInteractor
	let repository: UserGetByKeyRepository
	let input: UserGetByKeyInput
	let output: UserGetByKeyOutput

	beforeEach(() => {
		input = {
			apiKey: faker.internet.password(),
		}
		output = {
			id: faker.random.uuid(),
		}
	})

	it('Search and find a user with API key', () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => Promise.resolve(output.id)),
		}

		interactor = new UserGetByKeyInteractor(repository)

		return expect(interactor.execute(input)).resolves.toStrictEqual(output)
	})

	it(`Can't find a user with API key`, async () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => {
				throw new InternalError(InternalError.Types.userNotFound)
			}),
		}

		interactor = new UserGetByKeyInteractor(repository)

		expect.assertions(1)
		await expect(interactor.execute(input)).rejects.toStrictEqual(OutputError.create(OutputError.Types.userNotFound))
	})

	it('Repository throws an unknown internal error', async () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => {
				throw new InternalError(InternalError.Types.unknown)
			}),
		}

		interactor = new UserGetByKeyInteractor(repository)

		expect.assertions(1)
		await expect(interactor.execute(input)).rejects.toStrictEqual(OutputError.create(OutputError.Types.internalError))
	})

	it(`Repository throws an error that isn't of the Internal Error type. Should still be treated as an internal error`, async () => {
		repository = {
			findUserWithApiKey: jest.fn(async () => {
				throw new Error(faker.lorem.words(5))
			}),
		}

		interactor = new UserGetByKeyInteractor(repository)

		expect.assertions(1)
		await expect(interactor.execute(input)).rejects.toStrictEqual(OutputError.create(OutputError.Types.internalError))
	})
})
