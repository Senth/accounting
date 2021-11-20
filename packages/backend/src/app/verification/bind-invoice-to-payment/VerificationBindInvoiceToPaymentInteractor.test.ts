import { VerificationBindInvoiceToPaymentInteractor } from './VerificationBindInvoiceToPaymentInteractor'
import { VerificationBindInvoiceToPaymentRepository } from './VerificationBindInvoiceToPaymentRepository'
import { VerificationBindInvoiceToPaymentInput } from './VerificationBindInvoiceToPaymentInput'
import { VerificationBindInvoiceToPaymentOutput } from './VerificationBindInvoiceToPaymentOutput'
import faker from 'faker'
import { Id } from '../../core/definitions/Id'
import { Verification } from '../../core/entities/Verification'
import { Transaction } from '../../core/entities/Transaction'
import { Currency } from '../../core/entities/Currency'
import { OutputError } from '../../core/definitions/OutputError'

faker.seed(123)
const ACCOUNT_INVOICE_DEBT = 2440
const ACCOUNT_CURRENCY_GAIN = 3960
const ACCOUNT_CURRENCY_LOSS = 7960
const ACCOUNT_BANK_EXPENSES = 6570

describe('Bind a payment to an invoice verification #cold #use-case', () => {
  let interactor: VerificationBindInvoiceToPaymentInteractor
  let repository: VerificationBindInvoiceToPaymentRepository
  let input: VerificationBindInvoiceToPaymentInput
  let output: VerificationBindInvoiceToPaymentOutput
  let promise: Promise<VerificationBindInvoiceToPaymentOutput>

  let invoice: Verification | undefined
  let payment: Verification | undefined
  let savedPayment: Verification | undefined
  let savedInvoice: Verification | undefined

  beforeAll(() => {
    repository = {
      async getVerification(userId: Id, verificationId: Id): Promise<Verification> {
        if (typeof verificationId === 'number') {
          if (verificationId === 0) {
            return new Verification(invoice!)
          } else if (verificationId === 1) {
            return new Verification(payment!)
          }
        }

        throw Error('Invaild id type')
      },
      async saveVerification(verification: Verification): Promise<Verification> {
        if (typeof verification.id === 'number') {
          if (verification.id === 0) {
            savedInvoice = verification
          } else if (verification.id === 1) {
            savedPayment = verification
          }
        }
        return verification
      },
    }

    interactor = new VerificationBindInvoiceToPaymentInteractor(repository)
  })

  beforeEach(() => {
    invoice = undefined
    payment = undefined
    savedInvoice = undefined
    savedPayment = undefined
    input = {
      userId: 1,
      invoiceId: 0,
      paymentId: 1,
    }
  })

  it('Bind with local invoice in', async () => {
    const paymentCurrency = new Currency({
      amount: 100n,
      code: 'SEK',
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, paymentCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    output = await interactor.execute(input)

    expect(savedPayment).toBeInstanceOf(Verification)
    expect(savedInvoice).toBeInstanceOf(Verification)
    expect(savedInvoice!.dateModified).not.toEqual(payment.dateModified)
    expect(savedPayment!.dateModified).not.toEqual(payment.dateModified)
    expect(savedInvoice!.paymentId).toEqual(payment.id)
    expect(savedPayment!.invoiceId).toEqual(invoice.id)
    expect(output.invoice).toStrictEqual(savedInvoice)
    expect(output.payment).toStrictEqual(savedPayment)
  })

  it('Bind with foreign invoice in - currency gain', async () => {
    const invoiceCurrency = new Currency({
      amount: 100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    })

    const paymentCurrency = new Currency({
      amount: 100n,
      localAmount: 1100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10.5,
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, invoiceCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    output = await interactor.execute(input)

    // Verificaiton info checks
    expect(savedPayment).toBeInstanceOf(Verification)
    expect(savedInvoice).toBeInstanceOf(Verification)
    expect(savedInvoice!.dateModified).not.toEqual(payment.dateModified)
    expect(savedPayment!.dateModified).not.toEqual(payment.dateModified)
    expect(savedInvoice!.paymentId).toEqual(payment.id)
    expect(savedPayment!.invoiceId).toEqual(invoice.id)
    expect(output.invoice).toStrictEqual(savedInvoice)
    expect(output.payment).toStrictEqual(savedPayment)
    expect(savedInvoice!.transactions).toHaveLength(2)

    // New invoice debt transaction
    const validInvoiceDebtTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_INVOICE_DEBT,
      currency: {
        amount: 100n,
        localAmount: 1000n,
        code: Currency.Codes.USD,
        localCode: Currency.Codes.SEK,
        exchangeRate: 10,
      },
    }
    const invoiceDebtTransaction = savedPayment!.getTransaction(ACCOUNT_INVOICE_DEBT)
    expect(invoiceDebtTransaction).toMatchObject(validInvoiceDebtTransaction)

    // Gain transaction
    const validGainTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_CURRENCY_GAIN,
      currency: {
        amount: 100n,
        localAmount: 50n,
        code: Currency.Codes.USD,
        localCode: Currency.Codes.SEK,
        exchangeRate: 0.5,
      },
    }
    const gainTransaction = savedPayment!.getTransaction(ACCOUNT_CURRENCY_GAIN)
    expect(gainTransaction).toMatchObject(validGainTransaction)

    // Bank expense
    const validBankExpenseTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_BANK_EXPENSES,
      currency: {
        amount: 50n,
        code: Currency.Codes.SEK,
      },
    }
    const bankExpenseTransaction = savedPayment!.getTransaction(ACCOUNT_BANK_EXPENSES)
    expect(bankExpenseTransaction).toMatchObject(validBankExpenseTransaction)
  })

  it('Bind with foreign invoice in - currency loss', async () => {
    const invoiceCurrency = new Currency({
      amount: 100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    })

    const paymentCurrency = new Currency({
      amount: 100n,
      localAmount: 1000n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 9.5,
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, invoiceCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    output = await interactor.execute(input)

    // Verificaiton info checks
    expect(savedPayment).toBeInstanceOf(Verification)
    expect(savedInvoice).toBeInstanceOf(Verification)
    expect(savedInvoice!.dateModified).not.toEqual(payment.dateModified)
    expect(savedPayment!.dateModified).not.toEqual(payment.dateModified)
    expect(savedInvoice!.paymentId).toEqual(payment.id)
    expect(savedPayment!.invoiceId).toEqual(invoice.id)
    expect(output.invoice).toStrictEqual(savedInvoice)
    expect(output.payment).toStrictEqual(savedPayment)
    expect(savedInvoice!.transactions).toHaveLength(2)

    // New invoice debt transaction
    const validInvoiceDebtTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_INVOICE_DEBT,
      currency: {
        amount: 100n,
        localAmount: 1000n,
        code: Currency.Codes.USD,
        localCode: Currency.Codes.SEK,
        exchangeRate: 10,
      },
    }
    const invoiceDebtTransaction = savedPayment!.getTransaction(ACCOUNT_INVOICE_DEBT)
    expect(invoiceDebtTransaction).toMatchObject(validInvoiceDebtTransaction)

    // Gain transaction
    const validLossTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_CURRENCY_LOSS,
      currency: {
        amount: 100n,
        localAmount: -50n,
        code: Currency.Codes.USD,
        localCode: Currency.Codes.SEK,
        exchangeRate: -0.5,
      },
    }
    const lossTransaction = savedPayment!.getTransaction(ACCOUNT_CURRENCY_LOSS)
    expect(lossTransaction).toMatchObject(validLossTransaction)

    // Bank expense
    const validBankExpenseTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_BANK_EXPENSES,
      currency: {
        amount: 50n,
        code: Currency.Codes.SEK,
      },
    }
    const bankExpenseTransaction = savedPayment!.getTransaction(ACCOUNT_BANK_EXPENSES)
    expect(bankExpenseTransaction).toMatchObject(validBankExpenseTransaction)
  })

  it('Bind with foreign invoice in - no change in currency', async () => {
    const invoiceCurrency = new Currency({
      amount: 100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    })

    const paymentCurrency = new Currency({
      amount: 100n,
      localAmount: 1100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, invoiceCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    output = await interactor.execute(input)

    // Verificaiton info checks
    expect(savedPayment).toBeInstanceOf(Verification)
    expect(savedInvoice).toBeInstanceOf(Verification)
    expect(savedInvoice!.dateModified).not.toEqual(payment.dateModified)
    expect(savedPayment!.dateModified).not.toEqual(payment.dateModified)
    expect(savedInvoice!.paymentId).toEqual(payment.id)
    expect(savedPayment!.invoiceId).toEqual(invoice.id)
    expect(output.invoice).toStrictEqual(savedInvoice)
    expect(output.payment).toStrictEqual(savedPayment)
    expect(savedInvoice!.transactions).toHaveLength(2)

    // New invoice debt transaction
    const validInvoiceDebtTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_INVOICE_DEBT,
      currency: {
        amount: 100n,
        localAmount: 1000n,
        code: Currency.Codes.USD,
        localCode: Currency.Codes.SEK,
        exchangeRate: 10,
      },
    }
    const invoiceDebtTransaction = savedPayment!.getTransaction(ACCOUNT_INVOICE_DEBT)
    expect(invoiceDebtTransaction).toMatchObject(validInvoiceDebtTransaction)

    // Bank expense
    const validBankExpenseTransaction: Transaction.Option = {
      accountNumber: ACCOUNT_BANK_EXPENSES,
      currency: {
        amount: 100n,
        code: Currency.Codes.SEK,
      },
    }
    const bankExpenseTransaction = savedPayment!.getTransaction(ACCOUNT_BANK_EXPENSES)
    expect(bankExpenseTransaction).toMatchObject(validBankExpenseTransaction)
  })

  // Invalid testing
  it('Bind with existing invoice/payment id', async () => {
    const paymentCurrency = new Currency({
      amount: 100n,
      code: 'SEK',
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, paymentCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    // Test invoice
    invoice.paymentId = 10
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceAlreadyBound))

    invoice.invoiceId = 10
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceAlreadyBound))

    invoice.paymentId = undefined
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceAlreadyBound))

    invoice.invoiceId = undefined

    // Test payment
    payment.paymentId = 10
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentAlreadyBound))

    payment.invoiceId = 10
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentAlreadyBound))

    payment.paymentId = undefined
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentAlreadyBound))
  })

  it('Bind with invalid verification type', async () => {
    const paymentCurrency = new Currency({
      amount: 100n,
      code: 'SEK',
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, paymentCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    // Test invoice
    invoice.type = Verification.Types.INVALID
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceNotValidType, invoice.type))

    invoice.type = Verification.Types.INVOICE_IN_PAYMENT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceNotValidType, invoice.type))

    invoice.type = Verification.Types.INVOICE_OUT_PAYMENT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceNotValidType, invoice.type))

    invoice.type = Verification.Types.PAYMENT_DIRECT_IN
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceNotValidType, invoice.type))

    invoice.type = Verification.Types.PAYMENT_DIRECT_OUT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoiceNotValidType, invoice.type))

    invoice.type = Verification.Types.INVOICE_IN

    // Test invoice
    payment.type = Verification.Types.INVALID
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentNotValidType, payment.type))

    payment.type = Verification.Types.INVOICE_IN
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentNotValidType, payment.type))

    payment.type = Verification.Types.INVOICE_OUT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentNotValidType, payment.type))

    payment.type = Verification.Types.PAYMENT_DIRECT_IN
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentNotValidType, payment.type))

    payment.type = Verification.Types.PAYMENT_DIRECT_OUT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.paymentNotValidType, payment.type))
  })

  it('Invoice and payment must match types', async () => {
    const paymentCurrency = new Currency({
      amount: 100n,
      code: 'SEK',
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, paymentCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    invoice.type = Verification.Types.INVOICE_OUT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoicePaymentTypeMismatch))

    invoice.type = Verification.Types.INVOICE_IN
    payment.type = Verification.Types.INVOICE_OUT_PAYMENT
    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(OutputError.create(OutputError.Types.invoicePaymentTypeMismatch))
  })

  it('Currency code simple mismatch error', async () => {
    const paymentCurrency = new Currency({
      amount: 100n,
      code: 'SEK',
    })

    const invoiceCurrency = new Currency({
      amount: 100n,
      code: 'USD',
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, invoiceCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(
      OutputError.create(OutputError.Types.transactionsCurrencyCodeLocalMismatch)
    )
  })

  it('Currency code complex mismatch error', async () => {
    const paymentCurrency = new Currency({
      amount: 100n,
      code: 'SEK',
    })

    const invoiceCurrency = new Currency({
      amount: 100n,
      code: 'USD',
      localCode: 'SEK',
      exchangeRate: 10,
    })

    invoice = fakerMinimalVerification(Verification.Types.INVOICE_IN, invoiceCurrency)
    payment = fakerMinimalVerification(Verification.Types.INVOICE_IN_PAYMENT, paymentCurrency)

    promise = interactor.execute(input)
    await expect(promise).rejects.toStrictEqual(
      OutputError.create(OutputError.Types.transactionsCurrencyCodeLocalMismatch)
    )
  })
})

/////////////////////
//			FAKERS
////////////////////
function fakerMinimalVerification(type: Verification.Types, payment: Currency): Verification {
  let transactions = new Array<Transaction>()
  let id: 0 | 1

  switch (type) {
    case Verification.Types.INVOICE_IN:
      id = 0

      // Cost transaction
      transactions.push(
        new Transaction({
          accountNumber: 4330,
          currency: payment,
        })
      )

      // From invoice account
      transactions.push(
        new Transaction({
          accountNumber: ACCOUNT_INVOICE_DEBT,
          currency: payment.negate(),
        })
      )
      break

    case Verification.Types.INVOICE_IN_PAYMENT:
      id = 1

      // Pay to invoice account
      transactions.push(
        new Transaction({
          accountNumber: ACCOUNT_INVOICE_DEBT,
          currency: payment,
        })
      )

      // Take from bank account
      transactions.push(
        new Transaction({
          accountNumber: 1920,
          currency: payment.negate(),
        })
      )
      break

    default:
      throw new Error(`Not implemented type ${type}`)
  }

  const dateAdded = new Date().getTime() - 10000

  return new Verification({
    id: id,
    userId: 1,
    dateCreated: dateAdded,
    dateModified: dateAdded,
    name: faker.name.firstName(),
    transactions: transactions,
    date: '2020-01-01',
    type: type,
  })
}
