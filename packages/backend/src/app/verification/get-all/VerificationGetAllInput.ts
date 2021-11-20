import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'

export interface VerificationGetAllInput extends Input {
	readonly userId: Id
	readonly fiscalYearId: Id
}
