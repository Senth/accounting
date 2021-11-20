import { ApiVerificationOutput } from './helpers/ApiVerificationOutput'
import { VerificationGetAllOutput } from '../../../app/verification/get-all/VerificationGetAllOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'

export interface ApiVerificationGetAllOutput {
	readonly verifications: Immutable<ApiVerificationOutput[]>
}

export namespace ApiVerificationGetAllOutput {
	export function fromInteractorOutput(
		interactorOutput: VerificationGetAllOutput
	): Immutable<ApiVerificationGetAllOutput> {
		const apiVerifications = interactorOutput.verifications.reduce((array, verification) => {
			const apiVerification = ApiVerificationOutput.fromVerification(verification)
			array.push(apiVerification)
			return array
		}, new Array<Immutable<ApiVerificationOutput>>())

		return { verifications: apiVerifications }
	}
}
