# VerificationBindInvoiceToPayment use case

Binds an invoice to a payment

## Input Data

- Invoice verification id
- Payment verification id

## Output Data

- Updated invoice and payment verification

## Primary Course

1. Get invoice and payment verifications
1. Check so that they can be bound (one is invoice and other one is payment)
1. Check so they aren't bound to another verification already
1. Bind the id's together
1. Update the payment's transactions if necessary (when dealing with a non-local currency)
1. Save the updated verifications to the database

## Exception Cases

- Types doesn't match (for example matching invoice_in with a invoice_out_payment)
- Either invoice or payment is already bound to another verification
