import { Interactor } from '../../core/definitions/Interactor'
import { VerificationGetAllInput } from './VerificationGetAllInput'
import { VerificationGetAllOutput } from './VerificationGetAllOutput'
import { VerificationGetAllRepository } from './VerificationGetAllRepository'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'

/**
 * Get all user verifications from the specified fiscal year
 */
export class VerificationGetAllInteractor extends Interactor<
	VerificationGetAllInput,
	VerificationGetAllOutput,
	VerificationGetAllRepository
> {
	constructor(repository: VerificationGetAllRepository) {
		super(repository)
	}

	/**
	 * Get all user's verifications from the specified fiscal year
	 */
	async execute(input: VerificationGetAllInput): Promise<VerificationGetAllOutput> {
		return this.repository
			.getVerifications(input.userId, input.fiscalYearId)
			.then((verifications) => {
				return { verifications: verifications }
			})
			.catch((reason) => {
				if (reason instanceof OutputError) {
					throw reason
				} else if (!(reason instanceof InternalError)) {
					// Log error
					new InternalError(InternalError.Types.unknown, reason)
				}
				throw OutputError.create(OutputError.Types.internalError)
			})
	}
}
