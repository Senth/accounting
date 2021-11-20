import { Id } from '../../../app/core/definitions/Id'
import { UserCreateOutput } from '../../../app/user/create/UserCreateOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'

export interface ApiUserCreateOutput {
	readonly id: Id
	readonly email: string
	readonly firstName: string
	readonly lastName: string
	readonly localCurrencyCode: string
	readonly apiKey: string
}

export namespace ApiUserCreateOutput {
	export function fromInteractorOutput(interactorOutput: UserCreateOutput): Immutable<ApiUserCreateOutput> {
		return {
			id: interactorOutput.user.id!,
			email: interactorOutput.user.email,
			firstName: interactorOutput.user.firstName,
			lastName: interactorOutput.user.lastName,
			localCurrencyCode: interactorOutput.user.localCurrencyCode.name,
			apiKey: interactorOutput.user.apiKey,
		}
	}
}
