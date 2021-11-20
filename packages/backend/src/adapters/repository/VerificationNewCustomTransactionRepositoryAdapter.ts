import { VerificationNewBaseRepositoryAdapter } from './VerificationNewBaseRepositoryAdapter'
import { VerificationNewCustomTransactionRepository } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionRepository'

export class VerificationNewCustomTransactionRepositoryAdapter extends VerificationNewBaseRepositoryAdapter
	implements VerificationNewCustomTransactionRepository {
	// Only acts as a wrapper for the VerificationNewBaseRepositoryAdapter
}
