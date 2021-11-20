import { FiscalYearGetAllInteractor } from '../../app/fiscal-year/get-all/FiscalYearGetAllInteractor'
import { UserGetByKeyInteractor } from '../../app/user/get-by-key/UserGetByKeyInteractor'
import { VerificationBindInvoiceToPaymentInteractor } from '../../app/verification/bind-invoice-to-payment/VerificationBindInvoiceToPaymentInteractor'
import { VerificationNewCustomTransactionInteractor } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionInteractor'
import { VerificationNewFromParserInteractor } from '../../app/verification/new-from-parser/VerificationNewFromParserInteractor'
import { VerificationNewInteractor } from '../../app/verification/new/VerificationNewInteractor'
import { VerificationSaveInteractor } from '../../app/verification/save/VerificationSaveInteractor'
import { VerificationGetAllInteractor } from '../../app/verification/get-all/VerificationGetAllInteractor'
import { UserCreateInteractor } from '../../app/user/create/UserCreateInteractor'

export interface InteractorAdapter {
	verification: {
		bindInvoiceToPayment: VerificationBindInvoiceToPaymentInteractor
		newCustomTransaction: VerificationNewCustomTransactionInteractor
		newFromParser: VerificationNewFromParserInteractor
		new: VerificationNewInteractor
		save: VerificationSaveInteractor
		getAll: VerificationGetAllInteractor
	}

	user: {
		getByKey: UserGetByKeyInteractor
		create: UserCreateInteractor
	}

	fiscalYear: {
		getAll: FiscalYearGetAllInteractor
	}
}
