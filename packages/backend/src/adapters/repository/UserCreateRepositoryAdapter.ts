import { BaseAdapter } from './BaseAdapter'
import { UserCreateRepository } from '../../app/user/create/UserCreateRepository'
import { User } from '../../app/core/entities/User'

export class UserCreateRepositoryAdapter extends BaseAdapter implements UserCreateRepository {
	async saveUser(user: User): Promise<User> {
		return BaseAdapter.dbGateway.saveUser(user)
	}
}
