import { User } from '../../app/core/entities/User'
import { UserGetByKeyRepository } from '../../app/user/get-by-key/UserGetByKeyRepository'
import { BaseAdapter } from './BaseAdapter'

export class UserGetByKeyRepositoryAdapter extends BaseAdapter implements UserGetByKeyRepository {
	async findUserWithApiKey(apiKey: string): Promise<User> {
		return BaseAdapter.dbGateway.getUser(apiKey)
	}
}
