# VerificationSave use case

Save the verification and it's optional PDF file

## Input Data

- Verification (including transactions)
- Optional PDF file(s)

## Output Data

- Id of the verification

## Primary Course

1. Check if not duplicate
1. Save verification with transactions
1. Save PDF files

## Alternative Courses

- Verification is duplicate but contains new PDF, save new PDF files

## Exception Cases

- Verification is duplicate (and contains no new PDF files)
- Invalid Verification - Transaction sum doesn't add up to 0 - Missing required fields
