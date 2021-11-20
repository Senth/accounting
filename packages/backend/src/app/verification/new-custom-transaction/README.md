# VerificationNewCustomTransaction use case

Create and check if the verification and transactions are valid for a custom transaction.

## Input Data

- A custom verification with all transactions - Optional PDF file locations
- An id of the user that we want to create this verification for

## Output Data

- A valid verification with all transactions (without IDs). Note, this verification is just created and not saved/inserted yet.

## Primary Course

1. Convert from the input data to an internal data format
1. Create the verification including the transactions
1. Check so that the verification and transactions are valid
   - Fields of the verification (date, name, and so on)
   - All transactions sum up to 0
   - Transaction account numbers exists
1. Return the valid verification

## Exception Cases

- Invalid input data
