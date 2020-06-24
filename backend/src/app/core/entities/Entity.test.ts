import * as faker from 'faker'
import { Entity } from './Entity'
import { EntityErrors } from '../definitions/EntityErrors'

const TEST_TIMES = 1000

function faker_get_time_too_early(): number {
	return faker.date.between('1900-01-01', '1999-12-31').getTime()
}

function faker_get_valid_time(): number {
	return faker.date.between('2000-01-01', new Date()).getTime()
}

describe('Validate entity #cold #entity', () => {
	let entity: Entity

	beforeEach(() => {
		entity = new Entity({})
	})

	it('Validate empty Entity should pass', () => {
		expect(entity.validate()).toStrictEqual([])
	})

	// id
	it('Id is of type number and valid', () => {
		entity.id = faker.random.number()
		expect(entity.validate()).toStrictEqual([])
	})

	it('Id is of type string and valid', () => {
		entity.id = faker.random.uuid()
		expect(entity.validate()).toStrictEqual([])
	})

	it('Id is of type string and invalid (empty)', () => {
		entity.id = ''
		expect(entity.validate()).toStrictEqual([EntityErrors.idIsEmpty])
	})

	// date_created
	it('Date created too early', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateCreated = faker_get_time_too_early()
			expect(entity.validate()).toStrictEqual([EntityErrors.dateCreatedTooEarly])
		}
	})

	it('Date created in the future', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateCreated = faker.date.future().getTime()
			expect(entity.validate()).toStrictEqual([
				EntityErrors.dateCreatedInTheFuture,
				EntityErrors.dateModifiedBeforeCreated,
			])
		}
	})

	it('Date created is valid', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateCreated = faker_get_valid_time()
			expect(entity.validate()).toStrictEqual([])
		}
	})

	it('Date created right now', () => {
		entity.dateCreated = new Date().getTime()
		entity.dateModified = entity.dateCreated
		expect(entity.validate()).toStrictEqual([])
	})

	// date_modified
	it('Date modified in the future', () => {
		entity.dateCreated = faker_get_valid_time()
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateModified = faker.date.future().getTime()
			expect(entity.validate()).toStrictEqual([EntityErrors.dateModifiedInTheFuture])
		}
	})

	it('Date modified is valid', () => {
		entity.dateCreated = faker.date.between('2000-01-01', '2009-12-31').getTime()
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateModified = faker.date.between('2010-01-01', new Date()).getTime()
			expect(entity.validate()).toStrictEqual([])
		}
	})

	it('Date modified is valid when same as the creation date', () => {
		entity.dateCreated = faker_get_valid_time()
		entity.dateModified = entity.dateCreated
		expect(entity.validate()).toStrictEqual([])
	})

	it('Date modified before creating date', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateCreated = faker.date.between('2010-01-01', '2010-12-31').getTime()
			entity.dateModified = faker.date.between('2000-01-01', '2009-12-31').getTime()
			expect(entity.validate()).toStrictEqual([EntityErrors.dateModifiedBeforeCreated])
		}
	})

	// it('Date modified exists but not date created', () => {
	// 	entity.dateModified = faker_get_valid_time()
	// 	expect(entity.validate()).toStrictEqual([EntityErrors.dateModifiedRequiresDateCreated])
	// })

	// date_deleted
	it('Date deleted is not same as date modified', () => {
		entity.dateCreated = faker.date.between('2000-01-01', '2009-12-31').getTime()
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateModified = faker.date.between('2010-01-01', '2015-12-31').getTime()
			entity.dateDeleted = faker.date.between('2016-01-01', new Date()).getTime()
			expect(entity.validate()).toStrictEqual([EntityErrors.dateDeletedNotSameAsModified])
		}
	})

	it('Date deleted is valid', () => {
		entity.dateCreated = faker.date.between('2000-01-01', '2009-12-31').getTime()
		for (let i = 0; i < TEST_TIMES; ++i) {
			entity.dateModified = faker.date.between('2010-01-01', new Date()).getTime()
			entity.dateDeleted = entity.dateModified
			expect(entity.validate()).toStrictEqual([])
		}
	})

	// it('Date deleted requires date modified', () => {
	// 	entity.dateDeleted = faker_get_valid_time()
	// 	expect(entity.validate()).toStrictEqual([EntityErrors.dateDeletedRequiresDateModified])
	// })
})