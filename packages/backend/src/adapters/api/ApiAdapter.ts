import { FiscalYearGetAllInput } from '../../app/fiscal-year/get-all/FiscalYearGetAllInput'
import { UserGetByKeyInput } from '../../app/user/get-by-key/UserGetByKeyInput'
import { VerificationGetAllInput } from '../../app/verification/get-all/VerificationGetAllInput'
import { VerificationNewCustomTransactionInput } from '../../app/verification/new-custom-transaction/VerificationNewCustomTransactionInput'
import { VerificationNewFromParserInput } from '../../app/verification/new-from-parser/VerificationNewFromParserInput'
import { VerificationNewInput } from '../../app/verification/new/VerificationNewInput'
import { ApiFiscalYearGetAllOutput } from './out/ApiFiscalYearGetAllOutput'
import { ApiUserGetByKeyOutput } from './out/ApiUserGetByKeyOutput'
import { ApiVerificationAddCustomOutput } from './out/ApiVerificationAddCustomOutput'
import { ApiVerificationAddFromParserOutput } from './out/ApiVerificationAddFromParserOutput'
import { ApiVerificationAddOutput } from './out/ApiVerificationAddOutput'
import { ApiVerificationGetAllOutput } from './out/ApiVerificationGetAllOutput'
import { UserCreateInput } from '../../app/user/create/UserCreateInput'
import { ApiUserCreateOutput } from './out/ApiUserCreateOutput'

export interface ApiAdapter {
	verification: {
		/**
		 * Get all the user's verifications for a specific fiscal year
		 * @return all the user's verification, or empty if the user doesn't exist or the user doesn't have any verificaitons
		 * @throws {OutputError} if something went wrong
		 */
		getAll(input: VerificationGetAllInput): Promise<ApiVerificationGetAllOutput>
		/**
		 * Create and save a new valid verification from the specified input
		 * @return the added (or updated) verification
		 * @throws {OutputError} if the input is invalid
		 */
		add(input: VerificationNewInput): Promise<ApiVerificationAddOutput>
		/**
		 * Create and save a custom valid verification from the specified input
		 * @return the added (or update) verification
		 * @throws {OutputError} if the input is invalid
		 */
		addCustom(input: VerificationNewCustomTransactionInput): Promise<ApiVerificationAddCustomOutput>
		/**
		 * Create and save one or many verifications from parsing the files
		 * @return the added (or updated) verifications
		 * @throws {OutputError} if something went wrong
		 */
		addFromParser(input: VerificationNewFromParserInput): Promise<ApiVerificationAddFromParserOutput>
	}
	user: {
		/**
		 * Create a new user
		 * TODO add authorization checks to see if the user can be created
		 * @throws {OutputError} if the input is invalid
		 */
		create(input: UserCreateInput): Promise<ApiUserCreateOutput>

		/**
		 * Get the user's id with the specified api key
		 * @return user id for the specified api key
		 * @throws {OutputError} if the user wasn't found
		 */
		getByKey(input: UserGetByKeyInput): Promise<ApiUserGetByKeyOutput>
	}
	fiscalYear: {
		/**
		 * Get all the user's fiscal years
		 * @return all the user's fiscal years, or empty if the user doesn't exist or doesn't have any fiscal years
		 * @throws {OutputError} if something went wrong
		 */
		getAll(input: FiscalYearGetAllInput): Promise<ApiFiscalYearGetAllOutput>
	}
}
