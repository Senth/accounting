import { FixerIoGateway } from './FixerIoGateway'
import { Currency } from '../../app/core/entities/Currency'

describe('FixerIoGateway #limit #api-call', () => {
	let gateway: FixerIoGateway

	beforeAll(() => {
		gateway = new FixerIoGateway()
	})

	it('getExchangeRate()', async () => {
		const promise = gateway.getExchangeRate('2020-01-16', Currency.Codes.USD, Currency.Codes.SEK)

		const validValue = 9.490202099652692
		expect(promise).resolves.toStrictEqual(validValue)
	})
})
