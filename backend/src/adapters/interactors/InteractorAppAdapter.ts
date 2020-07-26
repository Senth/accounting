import { InteractorAdapter } from './InteractorAdapter'
import { VerificationBindInvoiceToPaymentRepository } from '../../app/verification/bind-invoice-to-payment/VerificationBindInvoiceToPaymentRepository'
import { VerificationNewCustomTransactionRepository } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionRepository'
import { VerificationNewFromParserRepository } from '../../app/verification/new-from-parser/VerificationNewFromParserRepository'
import { VerificationNewRepository } from '../../app/verification/new/VerificationNewRepository'
import { VerificationSaveRepository } from '../../app/verification/save/VerificationSaveRepository'
import { VerificationBindInvoiceToPaymentRepositoryAdapter } from '../repository/VerificationBindInvoiceToPaymentRepositoryAdapter'
import { VerificationNewCustomTransactionRepositoryAdapter } from '../repository/VerificationNewCustomTransactionRepositoryAdapter'
import { VerificationNewFromParserRepositoryAdapter } from '../repository/VerificationNewFromParserRepositoryAdapter'
import { UserGetByKeyRepositoryAdapter } from '../repository/UserGetByKeyRepositoryAdapter'
import { VerificationNewRepositoryAdapter } from '../repository/VerificationNewRepositoryAdapter'
import { VerificationSaveRepositoryAdapter } from '../repository/VerificationSaveRepositoryAdapter'
import { VerificationBindInvoiceToPaymentInteractor } from '../../app/verification/bind-invoice-to-payment/VerificationBindInvoiceToPaymentInteractor'
import { VerificationNewCustomTransactionInteractor } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionInteractor'
import { VerificationNewFromParserInteractor } from '../../app/verification/new-from-parser/VerificationNewFromParserInteractor'
import { VerificationNewInteractor } from '../../app/verification/new/VerificationNewInteractor'
import { VerificationSaveInteractor } from '../../app/verification/save/VerificationSaveInteractor'
import { UserGetByKeyInteractor } from '../../app/user/get-by-key/UserGetByKeyInteractor'
import { FiscalYearGetAllInteractor } from '../../app/fiscal-year/get-all/FiscalYearGetAllInteractor'
import { FiscalYearGetAllRepositoryAdapter } from '../repository/FiscalYearGetAllRepositoryAdapter'
import { VerificationGetAllInteractor } from '../../app/verification/get-all/VerificationGetAllInteractor'
import { VerificationGetAllRepositoryAdapter } from '../repository/VerificationGetAllRepositoryAdapter'

export class InteractorAppAdapter implements InteractorAdapter {
	verification = {
		bindInvoiceToPayment: new VerificationBindInvoiceToPaymentInteractor(
			new VerificationBindInvoiceToPaymentRepositoryAdapter()
		),
		newCustomTransaction: new VerificationNewCustomTransactionInteractor(
			new VerificationNewCustomTransactionRepositoryAdapter()
		),
		newFromParser: new VerificationNewFromParserInteractor(new VerificationNewFromParserRepositoryAdapter()),
		new: new VerificationNewInteractor(new VerificationNewRepositoryAdapter()),
		save: new VerificationSaveInteractor(new VerificationSaveRepositoryAdapter()),
		getAll: new VerificationGetAllInteractor(new VerificationGetAllRepositoryAdapter()),
	}

	user = {
		getByKey: new UserGetByKeyInteractor(new UserGetByKeyRepositoryAdapter()),
	}

	fiscalYear = {
		getAll: new FiscalYearGetAllInteractor(new FiscalYearGetAllRepositoryAdapter()),
	}
}
