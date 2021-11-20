import { Output } from '../../core/definitions/Output'
import { Immutable } from '../../core/definitions/Immutable'
import { User } from '../../core/entities/User'

export interface UserCreateOutput extends Output {
	readonly user: Immutable<User>
}
