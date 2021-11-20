import { Id } from '../../app/core/definitions/Id'
import { Verification } from '../../app/core/entities/Verification'
import { VerificationBindInvoiceToPaymentRepository } from '../../app/verification/bind-invoice-to-payment/VerificationBindInvoiceToPaymentRepository'
import { BaseAdapter } from './BaseAdapter'

export class VerificationBindInvoiceToPaymentRepositoryAdapter extends BaseAdapter
	implements VerificationBindInvoiceToPaymentRepository {
	saveVerification(verification: Verification): Promise<Verification> {
		return BaseAdapter.dbGateway.saveVerification(verification)
	}
	getVerification(userId: Id, verificationId: Id): Promise<Verification> {
		return BaseAdapter.dbGateway.getVerification(userId, verificationId)
	}
}
