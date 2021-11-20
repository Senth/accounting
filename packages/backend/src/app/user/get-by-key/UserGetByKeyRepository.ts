import { Repository } from '../../core/definitions/Repository'
import { User } from '../../core/entities/User'

export interface UserGetByKeyRepository extends Repository {
	/**
	 * Get user id with the specified API key
	 * @param apiKey get the user id which has this API key
	 * @returns Promise that contains the user
	 * @throws {OutputError.Types.userNotFound} if the user isn't found
	 * @throws {OutputError.Types.internalError} if something else went wrong
	 */
	findUserWithApiKey(apiKey: string): Promise<User>
}
