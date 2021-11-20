import { BaseAdapter } from './BaseAdapter'
import { Id } from '../../app/core/definitions/Id'
import { FiscalYear } from '../../app/core/entities/FiscalYear'

export class FiscalYearGetAllRepositoryAdapter extends BaseAdapter {
	/**
	 * Get all the user's fiscal years
	 * @param userId the user id to get the fiscal years from
	 * @return all the user's fiscal years
	 */
	getFiscalYears(userId: Id): Promise<FiscalYear[]> {
		return BaseAdapter.dbGateway.getFiscalYears(userId)
	}
}
