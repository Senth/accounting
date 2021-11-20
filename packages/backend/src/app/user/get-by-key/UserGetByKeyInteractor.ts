import { Interactor } from '../../core/definitions/Interactor'
import { UserGetByKeyInput } from './UserGetByKeyInput'
import { UserGetByKeyOutput } from './UserGetByKeyOutput'
import { UserGetByKeyRepository } from './UserGetByKeyRepository'
import { InternalError } from '../../core/definitions/InternalError'
import { OutputError } from '../../core/definitions/OutputError'

/**
 * Verifies if there is a user with the API key and returns that user's id
 */
export class UserGetByKeyInteractor extends Interactor<UserGetByKeyInput, UserGetByKeyOutput, UserGetByKeyRepository> {
	constructor(repository: UserGetByKeyRepository) {
		super(repository)
	}

	/**
	 * Verifies if there is a user with the specified API key
	 * @param input an object containing the API key
	 * @return An object containing the user id if successful
	 * @throws {OutputError.Types.userNotFound} if no user was found with the specified APi key
	 * @throws {OutputError.Types.internalError} if an internal error occurred
	 */
	async execute(input: UserGetByKeyInput): Promise<UserGetByKeyOutput> {
		const findUserPromise = this.repository.findUserWithApiKey(input.apiKey)

		return findUserPromise
			.then((user) => {
				return { user: user }
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					if (reason.type == InternalError.Types.userNotFound) {
						throw OutputError.create(OutputError.Types.userNotFound)
					}
				}
				throw OutputError.create(OutputError.Types.internalError)
			})
	}
}
