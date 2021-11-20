import { Output } from '../../core/definitions/Output'
import { Verification } from '../../core/entities/Verification'

export interface VerificationGetAllOutput extends Output {
	verifications: Verification[]
}
