import { Interactor } from '../../core/definitions/Interactor'
import { VerificationBindInvoiceToPaymentInput } from './VerificationBindInvoiceToPaymentInput'
import { VerificationBindInvoiceToPaymentOutput } from './VerificationBindInvoiceToPaymentOutput'
import { VerificationBindInvoiceToPaymentRepository } from './VerificationBindInvoiceToPaymentRepository'
import { Verification } from '../../core/entities/Verification'
import { OutputError } from '../../core/definitions/OutputError'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/entities/Currency'
import { InternalError } from '../../core/definitions/InternalError'

const ACCOUNT_INVOICE_DEBT = 2440
const ACCOUNT_CURRENCY_GAIN = 3960
const ACCOUNT_CURRENCY_LOSS = 7960
const ACCOUNT_BANK_EXPENSES = 6570

/**
 * Binds two verifications (one invoice the other payment) to each other.
 * It automatically updates the payment so that all transactions are correct;
 * i.e. if there's any gain/loss due to currency fluctuations, and also using the correct local amount
 */
export class VerificationBindInvoiceToPaymentInteractor extends Interactor<
	VerificationBindInvoiceToPaymentInput,
	VerificationBindInvoiceToPaymentOutput,
	VerificationBindInvoiceToPaymentRepository
> {
	constructor(repository: VerificationBindInvoiceToPaymentRepository) {
		super(repository)
	}

	/**
	 * Bind two verifications to each other.
	 * Automatically updates to payment's transactions to be correct
	 * @param input
	 * @return {Promise.<VerificationBindInvoiceToPaymentOutput>}
	 * @throws {OutputError} if the verificaitons cannot be bound together
	 */
	async execute(input: VerificationBindInvoiceToPaymentInput): Promise<VerificationBindInvoiceToPaymentOutput> {
		this.input = input

		const getInvoicePromise = this.repository.getVerification(input.userId, input.invoiceId)
		const getPaymentPromise = this.repository.getVerification(input.userId, input.paymentId)

		return Promise.all([getInvoicePromise, getPaymentPromise])
			.then(([invoice, payment]) => {
				this.validateCanBeBound(invoice, payment)

				return this.bind(invoice, payment)
			})
			.then(([invoice, payment]) => {
				const saveInvoicePromise = this.repository.saveVerification(invoice)
				const savePaymentPromise = this.repository.saveVerification(payment)

				return Promise.all([saveInvoicePromise, savePaymentPromise])
			})
			.then(([invoice, payment]) => {
				const output: VerificationBindInvoiceToPaymentOutput = {
					invoice: invoice,
					payment: payment,
				}
				return output
			})
			.catch((reason) => {
				if (reason instanceof OutputError) {
					throw reason
				}
				throw OutputError.create(OutputError.Types.internalError)
			})
	}

	/**
	 * Validates if the invoice and payment verifications can be bound
	 * @param invoice the invoice verification to validate
	 * @param payment the payment verification to validate
	 * @throws {OutputError} if the invoice and payment verifications cannot be bound
	 */
	private validateCanBeBound(invoice: Verification, payment: Verification) {
		// Invoice needs to be an invoice type
		if (!(invoice.type === Verification.Types.INVOICE_IN || invoice.type === Verification.Types.INVOICE_OUT)) {
			throw OutputError.create(OutputError.Types.invoiceNotValidType, invoice.type)
		}

		// Payment needs to be a payment type
		if (
			!(
				payment.type === Verification.Types.INVOICE_IN_PAYMENT ||
				payment.type === Verification.Types.INVOICE_OUT_PAYMENT
			)
		) {
			throw OutputError.create(OutputError.Types.paymentNotValidType, payment.type)
		}

		// Payment and invoice must match types
		if (invoice.type === Verification.Types.INVOICE_IN) {
			if (payment.type !== Verification.Types.INVOICE_IN_PAYMENT) {
				throw OutputError.create(OutputError.Types.invoicePaymentTypeMismatch)
			}
		} else {
			if (payment.type !== Verification.Types.INVOICE_OUT_PAYMENT) {
				throw OutputError.create(OutputError.Types.invoicePaymentTypeMismatch)
			}
		}

		// Already bound
		if (invoice.paymentId || invoice.invoiceId) {
			throw OutputError.create(OutputError.Types.invoiceAlreadyBound)
		}
		if (payment.paymentId || payment.invoiceId) {
			throw OutputError.create(OutputError.Types.paymentAlreadyBound)
		}
	}

	private async bind(invoice: Verification, payment: Verification): Promise<[Verification, Verification]> {
		invoice.setPaymentId(payment.id)
		payment.setInvoiceId(invoice.id)

		// It's only necessary to do anything if the currency has a local code (meaning dealing with foreign currencies)
		if (!(invoice.totalAmount.localCode && payment.totalAmount.localCode)) {
			if (invoice.totalAmount.code !== payment.totalAmount.code) {
				throw OutputError.create(OutputError.Types.transactionsCurrencyCodeLocalMismatch)
			}
			return [invoice, payment]
		}

		if (invoice.totalAmount.localCode !== payment.totalAmount.localCode) {
			throw OutputError.create(OutputError.Types.transactionsCurrencyCodeLocalMismatch)
		}

		if (invoice.type === Verification.Types.INVOICE_IN) {
			return this.bindInvoiceIn(invoice, payment)
		} else if (invoice.type === Verification.Types.INVOICE_OUT) {
			return this.bindInvoiceOut(invoice, payment)
		} else {
			const errorObject = {
				message:
					'VerificationBindInvoiceToPaymentInteractor.bind() but invoice should only be INVOICE_IN or INVOICE_OUT',
				invoice: invoice,
				payment: payment,
			}
			throw new InternalError(InternalError.Types.stateInvalid, errorObject)
		}
	}

	private async bindInvoiceIn(invoice: Verification, payment: Verification): Promise<[Verification, Verification]> {
		const localCode = invoice.totalAmount.localCode!

		// Get the invoice amount
		const invoiceDebtsTransaction = invoice.getTransaction(ACCOUNT_INVOICE_DEBT)
		if (!invoiceDebtsTransaction) {
			throw OutputError.create(OutputError.Types.transactionInvoiceAccountNotFound, `${ACCOUNT_INVOICE_DEBT}`)
		}

		// Get the payment amount
		const paymentDebtsTransaction = payment.getTransaction(ACCOUNT_INVOICE_DEBT)
		if (!paymentDebtsTransaction) {
			throw OutputError.create(OutputError.Types.transactionInvoiceAccountNotFound, `${ACCOUNT_INVOICE_DEBT}`)
		}
		payment.removeTransaction(ACCOUNT_INVOICE_DEBT)

		// Update invoice account (use invoice amount)
		const updatedDebtTransaction = new Transaction({
			accountNumber: ACCOUNT_INVOICE_DEBT,
			currency: invoiceDebtsTransaction.currency.negate(),
		})
		payment.addTransaction(updatedDebtTransaction)

		// Calculate gain/loss depending on currency fluctuations between invoice and payed date
		let localAmountDiff = paymentDebtsTransaction.currency.localAmount! + invoiceDebtsTransaction.currency.localAmount!
		const exchangeRateDiff =
			paymentDebtsTransaction.currency.exchangeRate! - invoiceDebtsTransaction.currency.exchangeRate!

		let gainLossCurrency: Currency | undefined

		if (exchangeRateDiff > 0 || exchangeRateDiff < 0) {
			gainLossCurrency = new Currency({
				amount: -invoiceDebtsTransaction.currency.amount,
				code: invoiceDebtsTransaction.currency.code,
				localCode: localCode,
				exchangeRate: exchangeRateDiff,
			})
			let accountNumber

			// Gain
			if (exchangeRateDiff > 0) {
				accountNumber = ACCOUNT_CURRENCY_GAIN
			}
			// Loss
			else {
				accountNumber = ACCOUNT_CURRENCY_LOSS
			}
			payment.addTransaction(
				new Transaction({
					accountNumber: accountNumber,
					currency: gainLossCurrency,
				})
			)

			localAmountDiff -= gainLossCurrency.localAmount!
		}

		// Add bank expenses
		payment.addTransaction(
			new Transaction({
				accountNumber: ACCOUNT_BANK_EXPENSES,
				currency: {
					amount: localAmountDiff,
					code: localCode,
				},
			})
		)

		const errors = payment.validate()
		if (errors.length > 0) {
			throw new OutputError(errors)
		}

		return [invoice, payment]
	}

	private async bindInvoiceOut(invoice: Verification, payment: Verification): Promise<[Verification, Verification]> {
		// TODO INVOICE_OUT hasn't been implemented yet
		throw OutputError.create(OutputError.Types.invoiceOutBindNotImplemented)
	}
}
