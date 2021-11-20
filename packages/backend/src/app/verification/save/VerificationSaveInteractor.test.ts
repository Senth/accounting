import { VerificationSaveInteractor } from './VerificationSaveInteractor'
import { VerificationSaveRepository } from './VerificationSaveRepository'
import { VerificationSaveInput } from './VerificationSaveInput'
import { VerificationSaveOutput } from './VerificationSaveOutput'
import { Verification } from '../../core/entities/Verification'
import faker from 'faker'

faker.seed(123)

function faker_minimum_verification(): Verification {
  return new Verification({
    userId: faker.random.alphaNumeric(10),
    name: faker.commerce.productName(),
    date: '2020-01-01',
    type: Verification.Types.TRANSACTION,
    transactions: [],
  })
}

describe('Save Verification #cold #use-case', () => {
  let interactor: VerificationSaveInteractor
  let repository: VerificationSaveRepository
  let input: VerificationSaveInput
  let output: Promise<VerificationSaveOutput>
  let valid: VerificationSaveOutput

  let spyExists: any
  let spySaveVerification: any
  let spySaveFiles: any

  const NEW_ID = 1

  const EXISTING_VERIFICATION = faker_minimum_verification()
  EXISTING_VERIFICATION.id = faker.random.alphaNumeric(10)
  const EXISTING_VERIFICATION_WITH_FILES = faker_minimum_verification()
  EXISTING_VERIFICATION_WITH_FILES.id = faker.random.alphaNumeric(10)
  EXISTING_VERIFICATION_WITH_FILES.files = ['file1', 'file2']

  beforeEach(() => {
    repository = {
      async getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined> {
        return Promise.resolve(undefined)
      },

      async saveVerification(verification: Verification): Promise<Verification> {
        let savedVerification = new Verification(verification)
        if (!savedVerification.id) {
          savedVerification.id = NEW_ID
        }
        return savedVerification
      },

      async saveFiles(verification: Verification): Promise<Verification> {
        let updated = new Verification(verification)
        if (verification.files) {
          if (verification.files.length > 0) {
            if (!updated.files) {
              updated.files = []
            }
            updated.files = updated.files!.concat(verification.files)

            // Make them unique (to test that we don't added files if they existed)
            updated.files = [...new Set(updated.files)]
          }
        }

        return updated
      },
    }
    interactor = new VerificationSaveInteractor(repository)

    spyExists = jest.spyOn(repository, 'getExistingVerification')
    spySaveFiles = jest.spyOn(repository, 'saveFiles')
    spySaveVerification = jest.spyOn(repository, 'saveVerification')
  })

  it('New minimal verification', async () => {
    input = {
      verification: faker_minimum_verification(),
    }

    output = interactor.execute(input)
    input.verification.id = NEW_ID
    valid = {
      successType: VerificationSaveOutput.SuccessTypes.ADDED_NEW,
      verification: input.verification,
    }

    expect.assertions(4)
    await expect(output).resolves.toStrictEqual(valid)
    expect(spyExists).toHaveBeenCalledTimes(1)
    expect(spySaveFiles).toHaveBeenCalledTimes(0)
    expect(spySaveVerification).toHaveBeenCalledTimes(1)
  })

  it('New verification with files', async () => {
    input = {
      files: ['1', '2', '3'],
      verification: faker_minimum_verification(),
    }

    output = interactor.execute(input)
    input.verification.id = NEW_ID
    valid = {
      successType: VerificationSaveOutput.SuccessTypes.ADDED_NEW,
      verification: input.verification,
    }

    expect.assertions(4)
    await expect(output).resolves.toStrictEqual(valid)
    expect(spyExists).toHaveBeenCalledTimes(1)
    expect(spySaveFiles).toHaveBeenCalledTimes(1)
    expect(spySaveVerification).toHaveBeenCalledTimes(1)
  })

  it('Duplicate verification', async () => {
    input = {
      verification: EXISTING_VERIFICATION,
    }

    repository.getExistingVerification = function (verification: Verification.Comparable): Promise<Verification> {
      return Promise.resolve(EXISTING_VERIFICATION)
    }
    spyExists = jest.spyOn(repository, 'getExistingVerification')

    output = interactor.execute(input)
    valid = {
      successType: VerificationSaveOutput.SuccessTypes.DUPLICATE,
      verification: EXISTING_VERIFICATION,
    }

    expect.assertions(4)
    await expect(output).resolves.toStrictEqual(valid)
    expect(spyExists).toHaveBeenCalledTimes(1)
    expect(spySaveFiles).toHaveBeenCalledTimes(0)
    expect(spySaveVerification).toHaveBeenCalledTimes(0)
  })

  it('Existing verification without files, add new files', async () => {
    input = {
      verification: faker_minimum_verification(),
      files: ['new1', 'new2'],
    }

    repository.getExistingVerification = function (verification: Verification.Comparable): Promise<Verification> {
      return Promise.resolve(EXISTING_VERIFICATION)
    }
    spyExists = jest.spyOn(repository, 'getExistingVerification')

    output = interactor.execute(input)
    const verification = new Verification(EXISTING_VERIFICATION)
    verification.files = input.files
    valid = {
      successType: VerificationSaveOutput.SuccessTypes.DUPLICATE_ADDED_FILES,
      verification: verification,
    }

    expect.assertions(4)
    await expect(output).resolves.toStrictEqual(valid)
    expect(spyExists).toHaveBeenCalledTimes(1)
    expect(spySaveFiles).toHaveBeenCalledTimes(1)
    expect(spySaveVerification).toHaveBeenCalledTimes(1)
  })

  it('Existing verification with files, append new files', async () => {
    input = {
      verification: faker_minimum_verification(),
      files: ['new1', 'new2'],
    }

    repository.getExistingVerification = function (verification: Verification.Comparable): Promise<Verification> {
      return Promise.resolve(EXISTING_VERIFICATION_WITH_FILES)
    }
    spyExists = jest.spyOn(repository, 'getExistingVerification')

    output = interactor.execute(input)
    const verification = new Verification(EXISTING_VERIFICATION_WITH_FILES)
    verification.files?.push(...input.files!)
    valid = {
      successType: VerificationSaveOutput.SuccessTypes.DUPLICATE_ADDED_FILES,
      verification: verification,
    }

    expect.assertions(4)
    await expect(output).resolves.toStrictEqual(valid)
    expect(spyExists).toHaveBeenCalledTimes(1)
    expect(spySaveFiles).toHaveBeenCalledTimes(1)
    expect(spySaveVerification).toHaveBeenCalledTimes(1)
  })

  it('Existing verification with files, try to add the same files', async () => {
    input = {
      verification: faker_minimum_verification(),
      files: EXISTING_VERIFICATION_WITH_FILES.files,
    }

    repository.getExistingVerification = async function (verification: Verification.Comparable): Promise<Verification> {
      return EXISTING_VERIFICATION_WITH_FILES
    }
    spyExists = jest.spyOn(repository, 'getExistingVerification')

    output = interactor.execute(input)
    valid = {
      successType: VerificationSaveOutput.SuccessTypes.DUPLICATE,
      verification: EXISTING_VERIFICATION_WITH_FILES,
    }

    expect.assertions(4)
    await expect(output).resolves.toStrictEqual(valid)
    expect(spyExists).toHaveBeenCalledTimes(1)
    expect(spySaveFiles).toHaveBeenCalledTimes(1)
    expect(spySaveVerification).toHaveBeenCalledTimes(0)
  })
})
