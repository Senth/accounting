import { VerificationSaveOutput } from '../../../app/verification/save/VerificationSaveOutput'
import { ApiVerificationOutput } from './helpers/ApiVerificationOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'
import { ApiVerificationAddOutput } from './ApiVerificationAddOutput'

export interface ApiVerificationAddFromParserOutput {
	readonly added: Immutable<ApiVerificationAddOutput[]>
}

export namespace ApiVerificationAddFromParserOutput {
	export function fromInteractorOutput(
		interactorOutput: VerificationSaveOutput[]
	): Immutable<ApiVerificationAddFromParserOutput> {
		const added = interactorOutput.reduce((array, saved) => {
			const added: Immutable<ApiVerificationAddOutput> = {
				verification: ApiVerificationOutput.fromVerification(saved.verification),
				successType: saved.successType,
			}
			return array
		}, new Array<ApiVerificationAddOutput>())

		return { added: added }
	}
}
