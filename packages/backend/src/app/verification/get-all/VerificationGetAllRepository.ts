import { Repository } from '../../core/definitions/Repository'
import { Id } from '../../core/definitions/Id'
import { Verification } from '../../core/entities/Verification'

export interface VerificationGetAllRepository extends Repository {
	/**
	 * Get all verifications for the specified fiscal year
	 * @param userId the user id to get the verification for
	 * @param fiscalYearId the id of the fiscal year to get the verifications for
	 */
	getVerifications(userId: Id, fiscalYearId: Id): Promise<Verification[]>
}
