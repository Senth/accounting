import { Verification } from '../../app/core/entities/Verification'
import { Id } from '../../app/core/definitions/Id'
import { Currency } from '../../app/core/entities/Currency'
import { Account } from '../../app/core/entities/Account'
import { User } from '../../app/core/entities/User'
import { Parser } from '../../app/core/entities/Parser'
import { FiscalYear } from '../../app/core/entities/FiscalYear'

export interface DbGateway {
	/**
	 * Save the verification and returns the verification's id if successfully saved
	 * @param verification the verification to save
	 * @return Id of the verification if successfully saved
	 */
	saveVerification(verification: Verification): Promise<Id>

	/**
	 * Check if the verification already exists and returns that instance.
	 * This method doesn't check by id, but rather on the content of the verification
	 * @param verification the verification to check if it exists
	 * @return the existing verification if it exists, undefined otherwise
	 */
	getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined>

	/**
	 * Get the local currency of a user
	 * @param userId the user to get the local currency for
	 * @return local currency for the specified user
	 */
	getLocalCurrency(userId: Id): Promise<Currency.Code>

	/**
	 * Get the specific account number from the user
	 * @param userId the user which the account belongs to
	 * @param accountNumber get the account with this account number
	 * @return The account with the specified account number
	 * @throws {OutputErrors.Types.accountNumberNotFound} if the account number does not exist
	 */
	getAccount(userId: Id, accountNumber: number): Promise<Account>

	/**
	 * Get the specified verification
	 * @param userId the user which the verification belongs to
	 * @param verificationId the verification id to get
	 * @return The verification with the specified Id
	 * @throws {OutputErrors.Types.verificationNotFound} if the verification does not exist
	 */
	getVerification(userId: Id, verificationId: Id): Promise<Verification>

	/**
	 * Get the user for the specified API key
	 * @param apiKey the user's API key
	 * @return user found with the specified API key
	 * @throws {OutputErrors.Types.userNotFound} if no user with the specified API key was found
	 */
	getUser(apiKey: string): Promise<User>

	/**
	 * Get all the parsers from the user
	 * @param userId the user to get all parsers from
	 * @return all parsers found from the users
	 */
	getParsers(userId: Id): Promise<Parser[]>

	/**
	 * Save a parser
	 * @param parser the parser to save
	 * @return Id of the parser if saved successfully
	 */
	saveParser(parser: Parser): Promise<Id>

	/**
	 * Get the fiscal year that would contain the specified date
	 * @param userId the user id to get the fiscal year from
	 * @param date a YYYY-MM-DD date
	 * @return the fiscal year that contains the specified date. I.e. the date will
	 * be between fiscalYear.from and fiscalYear.to
	 * @throws {OutputErrors.Types.fiscalYearNotFound} if no fiscal year was found between these dates
	 * @throws {OutputErrors.Types.dateFormatInvalid} if date has an invalid format
	 */
	getFiscalYear(userId: Id, date: string): Promise<FiscalYear>

	/**
	 * Get all verifications for the specified fiscal year
	 * @param userId the user id to get the verification for
	 * @param fiscalYearId the id of the fiscal year to get the verifications for
	 */
	getVerifications(userId: Id, fiscalYearId: Id): Promise<Verification[]>
}
