# VerificationNew use case

Create a valid new verification. The verification is created from limited amount of information, meaning VAT and other things are calculated automatically.

This verification can be any of the types invoice, invoice payment, or direct payment, including in/out variations.

## Input Data

- Verification information
  - Date
  - How much was payed
  - VAT percentage
  - Type invoice, invoice payment, direct payment (in/out)
  - _Currency (optional)_
  - _PDFs (optional)_
- An id of the user that wants to create this verification

## Output Data

- A valid verification with all transactions (without IDs).
  - The verifications are only created and not saved.
  - Invoices and invoice payment won't be bound to each other

## Primary Course

1. Convert the input to an internal data entity
1. Create the verification including transactions
1. Check so that the verification are valid
   - Including account number exists
1. Return the valid verification

## Exception Cases

- Invalid input data
