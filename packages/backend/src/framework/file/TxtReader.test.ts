import { TxtReader } from './TxtReader'
import { InternalError } from '../../app/core/definitions/InternalError'

describe('TxtReader #cold #adapter', () => {
	const GOOGLE_INVOICE_FILE = 'src/jest/test-files/Google-invoice.txt'
	const DUMMY_FILE = 'src/jest/test-files/dummy.txt'

	let reader: TxtReader

	beforeEach(() => {
		reader = new TxtReader()
	})

	it('Read minimal file', async () => {
		const promise = reader.read(DUMMY_FILE)

		expect.assertions(1)
		await expect(promise).resolves.toContain('Dummy TXT file')
	})

	it('Read long file', async () => {
		const promise = reader.read(GOOGLE_INVOICE_FILE)

		expect.assertions(1)
		await expect(promise).resolves.toContain('1111-2222-3333')
	})

	it('File does not exist', async () => {
		const promise = reader.read('FILE_DOES_NOT_EXIST.txt')
		const error = {
			type: InternalError.Types.fileNotFound,
		}

		expect.assertions(1)
		await expect(promise).rejects.toMatchObject(error)
	})
})
