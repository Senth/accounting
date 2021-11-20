import { Interactor } from '../../core/definitions/Interactor'
import { UserCreateInput } from './UserCreateInput'
import { UserCreateOutput } from './UserCreateOutput'
import { UserCreateRepository } from './UserCreateRepository'
import { User } from '../../core/entities/User'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'

/**
 * Creates a new user
 */
export class UserCreateInteractor extends Interactor<UserCreateInput, UserCreateOutput, UserCreateRepository> {
	constructor(repository: UserCreateRepository) {
		super(repository)
	}

	/**
	 * Create a new user
	 * @return the newly created user
	 * @throws {OutputError} if the input is invalid
	 */
	async execute(input: UserCreateInput): Promise<UserCreateOutput> {
		this.input = input

		const user = new User({
			email: input.user.email,
			firstName: input.user.firstName,
			lastName: input.user.lastName,
			localCurrencyCode: input.user.localCurrencyCode,
		})

		return this.repository
			.saveUser(user)
			.then((savedUser) => {
				return {
					user: savedUser,
				}
			})
			.catch((reason) => {
				if (reason instanceof OutputError) {
					throw reason
				}
				// Log error
				else if (!(reason instanceof InternalError)) {
					new InternalError(InternalError.Types.unknown, reason)
				}
				throw OutputError.create(OutputError.Types.internalError)
			})
	}
}
