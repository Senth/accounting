import { VerificationNewBaseRepository as VerificationNewRepositoryBase } from '../VerificationNewBaseRepository'
import { Account } from '../../core/entities/Account'
import { Id } from '../../core/definitions/Id'

export interface VerificationNewRepository extends VerificationNewRepositoryBase {
	/**
	 * Get account details
	 * @param accountNumber the account number to get the details from
	 * @return A promise with all the account details
	 * @throws {OutputErrors.Types.accountNumberNotFound} if the account number does not exist
	 * @throws {InternalError} if something unknown went wrong
	 */
	getAccountDetails(userId: Id, accountNumber: number): Promise<Account>
}
