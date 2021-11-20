import { FiscalYearGetAllInput } from '../../app/fiscal-year/get-all/FiscalYearGetAllInput'
import { UserGetByKeyInput } from '../../app/user/get-by-key/UserGetByKeyInput'
import { InteractorAppAdapter } from '../interactors/InteractorAppAdapter'
import { ApiAdapter } from './ApiAdapter'
import { ApiFiscalYearGetAllOutput } from './out/ApiFiscalYearGetAllOutput'
import { ApiUserGetByKeyOutput } from './out/ApiUserGetByKeyOutput'
import { VerificationGetAllInput } from '../../app/verification/get-all/VerificationGetAllInput'
import { ApiVerificationGetAllOutput } from './out/ApiVerificationGetAllOutput'
import { VerificationNewInput } from '../../app/verification/new/VerificationNewInput'
import { ApiVerificationAddOutput } from './out/ApiVerificationAddOutput'
import { VerificationSaveInput } from '../../app/verification/save/VerificationSaveInput'
import { VerificationNewCustomTransactionInput } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionInput'
import { ApiVerificationAddCustomOutput } from './out/ApiVerificationAddCustomOutput'
import { VerificationNewFromParserInput } from '../../app/verification/new-from-parser/VerificationNewFromParserInput'
import { ApiVerificationAddFromParserOutput } from './out/ApiVerificationAddFromParserOutput'
import { VerificationSaveOutput } from '../../app/verification/save/VerificationSaveOutput'
import { create } from 'domain'
import { ApiUserCreateOutput } from './out/ApiUserCreateOutput'
import { UserCreateInput } from '../../app/user/create/UserCreateInput'

export class ApiAppAdapter implements ApiAdapter {
	static interactorAdapter = new InteractorAppAdapter()

	// Verification
	verification = {
		async getAll(input: VerificationGetAllInput): Promise<ApiVerificationGetAllOutput> {
			return ApiAppAdapter.interactorAdapter.verification.getAll.execute(input).then((output) => {
				return ApiVerificationGetAllOutput.fromInteractorOutput(output)
			})
		},

		async add(input: VerificationNewInput): Promise<ApiVerificationAddOutput> {
			return ApiAppAdapter.interactorAdapter.verification.new
				.execute(input)
				.then((createdVerification) => {
					const input: VerificationSaveInput = {
						verification: createdVerification,
					}
					// Save the files
					return ApiAppAdapter.interactorAdapter.verification.save.execute(input)
				})
				.then((savedVerification) => {
					return ApiVerificationAddOutput.fromInteractorOutput(savedVerification)
				})
		},

		async addCustom(input: VerificationNewCustomTransactionInput): Promise<ApiVerificationAddCustomOutput> {
			return ApiAppAdapter.interactorAdapter.verification.newCustomTransaction
				.execute(input)
				.then((createdVerification) => {
					const input: VerificationSaveInput = {
						verification: createdVerification,
					}
					// Save the files
					return ApiAppAdapter.interactorAdapter.verification.save.execute(input)
				})
				.then((savedVerification) => {
					return ApiVerificationAddOutput.fromInteractorOutput(savedVerification)
				})
		},

		async addFromParser(input: VerificationNewFromParserInput): Promise<ApiVerificationAddFromParserOutput> {
			return ApiAppAdapter.interactorAdapter.verification.newFromParser
				.execute(input)
				.then((createdVerifications) => {
					// Save verifications
					const promises = new Array<Promise<VerificationSaveOutput>>()

					for (const verification of createdVerifications.verifications) {
						const input: VerificationSaveInput = {
							verification: verification,
						}
						promises.push(ApiAppAdapter.interactorAdapter.verification.save.execute(input))
					}

					return Promise.all(promises)
				})
				.then((savedVerifications) => {
					return ApiVerificationAddFromParserOutput.fromInteractorOutput(savedVerifications)
				})
		},
	}

	// User
	user = {
		async getByKey(input: UserGetByKeyInput): Promise<ApiUserGetByKeyOutput> {
			return ApiAppAdapter.interactorAdapter.user.getByKey.execute(input).then((output) => {
				return ApiUserGetByKeyOutput.fromInteractorOutput(output)
			})
		},

		async create(input: UserCreateInput): Promise<ApiUserCreateOutput> {
			return ApiAppAdapter.interactorAdapter.user.create.execute(input).then((output) => {
				return ApiUserCreateOutput.fromInteractorOutput(output)
			})
		},
	}

	// Fiscal Year
	fiscalYear = {
		async getAll(input: FiscalYearGetAllInput): Promise<ApiFiscalYearGetAllOutput> {
			return ApiAppAdapter.interactorAdapter.fiscalYear.getAll.execute(input).then((output) => {
				return ApiFiscalYearGetAllOutput.fromInteractorOutput(output)
			})
		},
	}
}
