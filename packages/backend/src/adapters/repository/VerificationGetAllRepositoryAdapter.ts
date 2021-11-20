import { BaseAdapter } from './BaseAdapter'
import { Id } from '../../app/core/definitions/Id'
import { Verification } from '../../app/core/entities/Verification'

export class VerificationGetAllRepositoryAdapter extends BaseAdapter {
	/**
	 * Get all verifications for the specified fiscal year
	 * @param userId the user id to get the verification for
	 * @param fiscalYearId the id of the fiscal year to get the verifications for
	 */
	getVerifications(userId: Id, fiscalYearId: Id): Promise<Verification[]> {
		return BaseAdapter.dbGateway.getVerifications(userId, fiscalYearId)
	}
}
