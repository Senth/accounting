import { Input } from '../../core/definitions/Input'

export interface UserCreateInput extends Input {
	user: {
		email: string
		firstName: string
		lastName: string
		localCurrencyCode: string
	}
}
