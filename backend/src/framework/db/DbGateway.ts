import { Verification } from '../../app/core/entities/Verification'
import { Id } from '../../app/core/definitions/Id'
import { Currency } from '../../app/core/entities/Currency'
import { Account } from '../../app/core/entities/Account'
import { User } from '../../app/core/entities/User'
import { Parser } from '../../app/core/entities/Parser'

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
	 * @throws {OutputErrors.accountNumberNotFound} if the account number does not exist
	 */
	getAccount(userId: Id, accountNumber: number): Promise<Account>

	/**
	 * Get the specified verification
	 * @param userId the user which the verification belongs to
	 * @param verificationId the verification id to get
	 * @return The verification with the specified Id
	 * @throws {OutputErrors.verificationNotFound} if the verification does not exist
	 */
	getVerification(userId: Id, verificationId: Id): Promise<Verification>

	/**
	 * Get the user for the specified API key
	 * @param apiKey the user's API key
	 * @return user found with the specified API key
	 * @throws {OutputErrors.userNotFound} if no user with the specified API key was found
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

	// TODO getFiscalYear()
	// TODO getVerifications(FiscalYear)
}