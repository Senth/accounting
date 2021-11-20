import { Id } from '../../core/definitions/Id'
import { Account } from '../../core/entities/Account'
import { Verification } from '../../core/entities/Verification'
import { VerificationRepository } from '../VerificationRepository'

export interface VerificationBindInvoiceToPaymentRepository extends VerificationRepository {
	/**
	 * Saves a new verification or overwrite an existing verification if the verification Id has been set.
	 * This automatically saves all the transactions as well, but not the files.
	 * @param verification the verification to save
	 * @return id of the saved verification
	 */
	saveVerification(verification: Verification): Promise<Verification>

	/**
	 * Get the specified verification
	 * @param userId the user which the verification belongs to
	 * @param verificationId the verification id to get
	 * @return The verification with the specified Id
	 * @throws {OutputErrors.Types.verificationNotFound} if the verification does not exist
	 */
	getVerification(userId: Id, verificationId: Id): Promise<Verification>
}
