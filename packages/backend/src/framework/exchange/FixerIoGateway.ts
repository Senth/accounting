import { ExchangeGateway } from './ExchangeGateway'
import { Currency } from '../../app/core/entities/Currency'
import { config } from '../../config'
import fetch from 'node-fetch'
import '../../app/core/definitions/String'
import { OutputError } from '../../app/core/definitions/OutputError'
import { InternalError } from '../../app/core/definitions/InternalError'

export class FixerIoGateway implements ExchangeGateway {
	getExchangeRate(date: string, from: Currency.Codes, to: Currency.Codes): Promise<number> {
		if (!date.isValidIsoDate()) {
			throw OutputError.create(OutputError.Types.dateFormatInvalid, date)
		}

		const url = `http://data.fixer.io/api/${date}?symbols=${from.name},${to.name}&access_key=${config.apiKeys.fixerIo}`

		return fetch(url)
			.then((response) => {
				if (response.ok) {
					return response.json()
				}
				throw new InternalError(InternalError.Types.exchangeRateAccessError, response.statusText)
			})
			.then((object) => {
				if (object) {
					const fromRate = object.rates[`${from.name}`] as number
					const toRate = object.rates[`${to.name}`] as number

					return toRate / fromRate
				}
				throw new InternalError(InternalError.Types.exchangeRateAccessError, 'Object not found')
			})
			.catch((reason) => {
				throw new InternalError(InternalError.Types.exchangeRateAccessError, reason)
			})
	}
}
