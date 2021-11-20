# VerificationNewFromParser use case

Create a verification from a PDF or text file

## Input Data

- PDF or Text files

## Output Data

- Multiple valid verifications with all transactions (without IDs)
- The verifications are only created and haven't been saved
- Invoices and invoice payment won't be bound to each other

## Primary Course

1. Convert the file to a text that can be parsed
1. Check which parser to use for the text
1. Parse the text and create verificaiton data to be used for creating verifications
1. Create the verifications
1. Check if the verifications are valid
1. Return the valid verifications

## Exception Cases

- parserNotFound if no parser matched the text
- invalidInput if the parser cannot parse some parts of the text
- internalError if the parser is in an invalid state (shouldn't be possible)
