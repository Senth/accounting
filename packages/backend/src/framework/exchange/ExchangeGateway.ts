import { Currency } from '../../app/core/entities/Currency'

export interface ExchangeGateway {
	/**
	 * Get the exchange rate between two currencies on the specified date
	 * @param date YYYY-MM-DD format of when to get the exchange rate for
	 * @param from convert from this currency
	 * @param to convert to this currency
	 * @throws {OutputError.Types.dateFormatInvalid} if the date format is invalid
	 */
	getExchangeRate(date: string, from: Currency.Codes, to: Currency.Codes): Promise<number>
}
