import { Repository } from '../../core/definitions/Repository'
import { User } from '../../core/entities/User'

export interface UserCreateRepository extends Repository {
	/**
	 * Save the user, can either be an existing user or a new user
	 * @param user the user to save
	 * @return either the newly created user or the updated existing user
	 * @throws {OutputError} if the user is invalid
	 */
	saveUser(user: User): Promise<User>
}
