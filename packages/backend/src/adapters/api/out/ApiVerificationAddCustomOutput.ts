import { ApiVerificationOutput } from './helpers/ApiVerificationOutput'
import { VerificationSaveOutput } from '../../../app/verification/save/VerificationSaveOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'
import { OutputError } from '../../../app/core/definitions/OutputError'
import { ApiVerificationAddOutput } from './ApiVerificationAddOutput'

export interface ApiVerificationAddCustomOutput extends ApiVerificationAddOutput {}

export namespace ApiVerificationAddCustomOutput {
	export function fromInteractorOutput(
		interactorOutput: VerificationSaveOutput
	): Immutable<ApiVerificationAddCustomOutput> {
		return ApiVerificationAddOutput.fromInteractorOutput(interactorOutput)
	}
}
