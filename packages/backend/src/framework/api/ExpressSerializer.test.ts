import { ExpressSerializer } from './ExpressSerializer'

describe('Express Serializer #cold #api', () => {
	it('serialize() minimal object', () => {
		const data = {
			test: 'hello',
			age: 13,
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(data)
	})

	it('serialize() bigint test', () => {
		const data = {
			text: 'some text',
			big: 13557665468864665468469843168468n,
			big2: -1n,
			age: 15,
		}

		const valid = {
			text: data.text,
			big: '13557665468864665468469843168468n',
			big2: `-1n`,
			age: data.age,
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(valid)
	})

	it('serialize() regexp', () => {
		const data = {
			text: 'some text',
			regex: /some regex/,
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(data)
	})

	it('serialize() recursive object', () => {
		const data = {
			text: 'some text',
			big: 12n,
			child: {
				big: 123n,
			},
		}

		const valid = {
			text: data.text,
			big: '12n',
			child: {
				big: '123n',
			},
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(valid)
	})

	it('deserialize() simple object', () => {
		expect(ExpressSerializer.deserialize('some text')).toStrictEqual('some text')
		expect(ExpressSerializer.deserialize(123)).toStrictEqual(123)
		expect(ExpressSerializer.deserialize(123n)).toStrictEqual(123n)

		const data = {
			text: 'some text',
			number: 123,
			big: 12345n,
		}

		expect(ExpressSerializer.deserialize(data)).toStrictEqual(data)
	})

	it('deserialize() number conversion', () => {
		expect(ExpressSerializer.deserialize('123')).toStrictEqual(123)
	})

	it('deserialize() bigint conversion', () => {
		expect(ExpressSerializer.deserialize('123n')).toStrictEqual(123n)
	})

	it('deserialize() regexp', () => {
		expect(ExpressSerializer.deserialize(/regexp/)).toStrictEqual(/regexp/)
	})

	it('deserialize() object recursively', () => {
		const data = {
			text: 'some text',
			number: '123',
			big: '123n',
			child: {
				number: '123',
				number2: 1234,
				big: '123456n',
			},
		}

		const valid = {
			text: 'some text',
			number: 123,
			big: 123n,
			child: {
				number: 123,
				number2: 1234,
				big: 123456n,
			},
		}

		expect(ExpressSerializer.deserialize(data)).toStrictEqual(valid)
	})
})
