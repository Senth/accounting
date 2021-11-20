import { VerificationNewBaseRepositoryAdapter } from './VerificationNewBaseRepositoryAdapter'
import { VerificationNewRepository } from '../../app/verification/new/VerificationNewRepository'
import { Account } from '../../app/core/entities/Account'
import { Id } from '../../app/core/definitions/Id'
import { BaseAdapter } from './BaseAdapter'

export class VerificationNewRepositoryAdapter extends VerificationNewBaseRepositoryAdapter
	implements VerificationNewRepository {
	async getAccountDetails(userId: Id, accountNumber: number): Promise<Account> {
		return BaseAdapter.dbGateway.getAccount(userId, accountNumber)
	}
}
