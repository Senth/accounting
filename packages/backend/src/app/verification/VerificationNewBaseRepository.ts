import { VerificationRepository } from './VerificationRepository'
import { Currency } from '../core/entities/Currency'
import { Id } from '../core/definitions/Id'

export interface VerificationNewBaseRepository extends VerificationRepository {
	/**
	 * Get the exchange rate from the specified currency to the local currency
	 * @param date when to lookup the currency exchange in format YYYY-MM-DD
	 * @param fromCode from which currency
	 * @param toCode to this currency
	 * @return exchangeRate on the specified date
	 * @throws {InternalError.serviceNotReachable} if the service isn't reachable
	 */
	getExchangeRate(date: string, fromCode: Currency.Codes, toCode: Currency.Codes): Promise<number>

	/**
	 * Get the local currency for the specified user
	 * @param userId the user to get the local currency code from
	 * @return local currency code
	 */
	getLocalCurrency(userId: Id): Promise<Currency.Codes>

	/**
	 * Get the id of the fiscal year.
	 * @param userId the user id to get the fiscal year from
	 * @param date a YYYY-MM-DD date that will be in the range [fiscalyYear.from, fiscalYear.to]
	 * @return the fiscal year's id
	 * @throws {OutputErrors.Types.fiscalYearNotFound} if no fiscal year was found between these dates
	 * @throws {OutputErrors.Types.dateFormatInvalid} if date has an invalid format
	 */
	getFiscalYear(userId: Id, date: string): Promise<Id>
}
