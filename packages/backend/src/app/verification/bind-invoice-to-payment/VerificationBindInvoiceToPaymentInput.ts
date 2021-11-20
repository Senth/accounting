import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'

export interface VerificationBindInvoiceToPaymentInput extends Input {
	userId: Id
	invoiceId: Id
	paymentId: Id
}
