import { Interactor } from '../../core/definitions/Interactor'
import { VerificationSaveInput } from './VerificationSaveInput'
import { VerificationSaveOutput } from './VerificationSaveOutput'
import { VerificationSaveRepository } from './VerificationSaveRepository'
import { Verification } from '../../core/entities/Verification'

/**
 * Tries to save the verification. If the verification already exists but has new files it will
 * add and save those files to the existing verification
 */
export class VerificationSaveInteractor extends Interactor<
	VerificationSaveInput,
	VerificationSaveOutput,
	VerificationSaveRepository
> {
	constructor(repository: VerificationSaveRepository) {
		super(repository)
	}

	/**
	 * Tries to save the verification
	 * @param input
	 * @return {Promise.<VerificationSaveOutput>}
	 */
	async execute(input: VerificationSaveInput): Promise<VerificationSaveOutput> {
		this.input = input
		let existingVerification: Verification | undefined
		let successType = VerificationSaveOutput.SuccessTypes.INVALID

		return this.repository
			.getExistingVerification(input.verification.getComparable())
			.then((foundVerification) => {
				existingVerification = foundVerification
				return this.saveFiles(existingVerification)
			})
			.then((verification) => {
				successType = VerificationSaveInteractor.calculateSuccessType(verification, existingVerification)

				// Duplicate, no need to save, just return the id directly
				if (successType === VerificationSaveOutput.SuccessTypes.DUPLICATE) {
					return verification
				}
				// New or added files, save the verificatino
				else {
					return this.repository.saveVerification(verification)
				}
			})
			.then((verification) => {
				const output: VerificationSaveOutput = {
					verification: verification,
					successType: successType,
				}

				return Promise.resolve(output)
			})
			.catch((reason) => {
				// TODO Cleanup files after error

				throw reason
			})
	}

	private async saveFiles(existingVerification?: Verification): Promise<Verification> {
		let verification: Verification = this.input.verification

		if (existingVerification) {
			verification = new Verification(existingVerification)
		}

		// Add files to save
		if (this.input.files) {
			if (!verification.files) {
				verification.files = []
			}

			verification.files.push(...this.input.files)
			return this.repository.saveFiles(verification)
		} else {
			return verification
		}
	}

	private static calculateSuccessType(
		verification: Verification,
		existingVerification?: Verification
	): VerificationSaveOutput.SuccessTypes {
		if (!existingVerification) {
			return VerificationSaveOutput.SuccessTypes.ADDED_NEW
		} else {
			const existingFileCount = existingVerification.files?.length
			const totalFileCount = verification.files?.length

			if (existingFileCount !== totalFileCount) {
				return VerificationSaveOutput.SuccessTypes.DUPLICATE_ADDED_FILES
			} else {
				return VerificationSaveOutput.SuccessTypes.DUPLICATE
			}
		}
	}
}
