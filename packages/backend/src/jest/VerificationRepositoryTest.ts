import { VerificationNewRepository } from '../app/verification/new/VerificationNewRepository'
import { VerificationNewCustomTransactionRepository } from '../app/verification/new-custom-transaction/VerificationNewCustomTransactionRepository'
import { Currency } from '../app/core/entities/Currency'
import { Account } from '../app/core/entities/Account'
import { Accounts } from './AccountTestData'
import { Id } from '../app/core/definitions/Id'

export class VerificationRepositoryTest
	implements VerificationNewRepository, VerificationNewCustomTransactionRepository {
	static readonly LOCAL_CODE = Currency.Codes.SEK
	static readonly EXCHANGE_RATE = 10

	async getAccountDetails(userId: Id, accountNumber: number): Promise<Account> {
		return Accounts.findByNumber(accountNumber)
	}

	/**
	 * @return by default return 10
	 */
	async getExchangeRate(date: string, fromCode: Currency.Codes, toCode: Currency.Codes): Promise<number> {
		return VerificationRepositoryTest.EXCHANGE_RATE
	}

	/**
	 * @return SEK by default
	 */
	async getLocalCurrency(userId: Id): Promise<Currency.Codes> {
		return VerificationRepositoryTest.LOCAL_CODE
	}

	/**
	 * @return 2 by default
	 */
	async getFiscalYear(userId: Id, date: string): Promise<Id> {
		return 2
	}
}
