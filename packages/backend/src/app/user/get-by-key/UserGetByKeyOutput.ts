import { Id } from '../../core/definitions/Id'
import { Output } from '../../core/definitions/Output'
import { User } from '../../core/entities/User'

export interface UserGetByKeyOutput extends Output {
	readonly user: User
}
