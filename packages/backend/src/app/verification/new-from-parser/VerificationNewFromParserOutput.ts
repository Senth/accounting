import { Output } from '../../core/definitions/Output'
import { Verification } from '../../core/entities/Verification'

export interface VerificationNewFromParserOutput extends Output {
	verifications: Verification[]
}
