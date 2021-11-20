import { VerificationNewBaseRepository } from '../../app/verification/VerificationNewBaseRepository'
import { BaseAdapter } from './BaseAdapter'
import { Currency } from '../../app/core/entities/Currency'
import { Id } from '../../app/core/definitions/Id'

export abstract class VerificationNewBaseRepositoryAdapter extends BaseAdapter
	implements VerificationNewBaseRepository {
	async getExchangeRate(date: string, fromCode: any, toCode: any): Promise<number> {
		return BaseAdapter.exchangeGateway.getExchangeRate(date, fromCode, toCode)
	}

	async getLocalCurrency(userId: Id): Promise<Currency.Codes> {
		return BaseAdapter.dbGateway.getLocalCurrency(userId)
	}

	async getFiscalYear(userId: Id, date: string): Promise<Id> {
		return BaseAdapter.dbGateway.getFiscalYear(userId, date).then((fiscalYear) => {
			return fiscalYear.id!
		})
	}
}
