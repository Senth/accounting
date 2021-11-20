import { Repository } from '../../core/definitions/Repository'
import { Id } from '../../core/definitions/Id'
import { FiscalYear } from '../../core/entities/FiscalYear'

export interface FiscalYearGetAllRepository extends Repository {
	/**
	 * Get all the user's fiscal years
	 * @param userId the user id to get the fiscal years from
	 * @return all the user's fiscal years
	 */
	getFiscalYears(userId: Id): Promise<FiscalYear[]>
}
