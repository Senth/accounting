import { Input } from '../../core/definitions/Input'
import { Verification } from '../../core/entities/Verification'

export interface VerificationSaveInput extends Input {
	readonly verification: Verification
	readonly files?: string[]
}
