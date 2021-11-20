import { Id } from '../../app/core/definitions/Id'
import { Account } from '../../app/core/entities/Account'
import { Parser } from '../../app/core/entities/Parser'
import { VerificationNewFromParserRepository } from '../../app/verification/new-from-parser/VerificationNewFromParserRepository'
import { BaseAdapter } from './BaseAdapter'
import { VerificationNewBaseRepositoryAdapter } from './VerificationNewBaseRepositoryAdapter'

export class VerificationNewFromParserRepositoryAdapter extends VerificationNewBaseRepositoryAdapter
	implements VerificationNewFromParserRepository {
	async getParsers(userId: Id): Promise<Parser[]> {
		return BaseAdapter.dbGateway.getParsers(userId)
	}

	async readFile(filename: string): Promise<string> {
		return BaseAdapter.fileGateway.read(filename)
	}

	async getAccountDetails(userId: Id, accountNumber: number): Promise<Account> {
		return BaseAdapter.dbGateway.getAccount(userId, accountNumber)
	}
}
