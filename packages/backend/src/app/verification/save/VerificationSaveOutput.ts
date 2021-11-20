import { Output } from '../../core/definitions/Output'
import { Verification } from '../../core/entities/Verification'

export namespace VerificationSaveOutput {
	export enum SuccessTypes {
		ADDED_NEW = 'added-new',
		DUPLICATE = 'duplicate',
		DUPLICATE_ADDED_FILES = 'duplicate-added-files',
		INVALID = 'invalid',
	}
}

export interface VerificationSaveOutput extends Output {
	readonly verification: Verification
	readonly successType: VerificationSaveOutput.SuccessTypes
}
