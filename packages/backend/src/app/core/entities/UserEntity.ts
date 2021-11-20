import { Entity } from './Entity'
import { Id } from '../definitions/Id'
import { OutputError } from '../definitions/OutputError'

export namespace UserEntity {
	export interface Option extends Entity.Option {
		userId: Id
	}
}

export abstract class UserEntity extends Entity implements UserEntity.Option {
	userId: Id

	constructor(data: UserEntity.Option) {
		super(data)

		this.userId = data.userId
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// User id
		if (typeof this.userId === 'string') {
			if (this.userId.length <= 0) {
				errors.push({ type: OutputError.Types.userIdIsEmpty })
			}
		}

		return errors
	}
}
