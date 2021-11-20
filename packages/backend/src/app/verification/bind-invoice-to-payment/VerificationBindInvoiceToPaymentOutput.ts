import { Output } from '../../core/definitions/Output'
import { Verification } from '../../core/entities/Verification'
import { Immutable } from '../../core/definitions/Immutable'

export interface VerificationBindInvoiceToPaymentOutput extends Output {
	invoice: Immutable<Verification>
	payment: Immutable<Verification>
}
