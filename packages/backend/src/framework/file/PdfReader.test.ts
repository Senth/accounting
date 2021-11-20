import { PdfReader } from './PdfReader'
import { InternalError } from '../../app/core/definitions/InternalError'

describe('PdfReader #cold #adapter', () => {
	const DUMMY_FILE = 'src/jest/test-files/dummy.pdf'

	let reader: PdfReader

	beforeEach(() => {
		reader = new PdfReader()
	})

	it('Read minimal file', async () => {
		const promise = reader.read(DUMMY_FILE)

		expect.assertions(1)
		await expect(promise).resolves.toContain('Dummy PDF file')
	})

	it('File does not exist', async () => {
		const promise = reader.read('FILE_DOES_NOT_EXIST.pdf')
		const error = {
			type: InternalError.Types.fileNotFound,
		}

		expect.assertions(1)
		await expect(promise).rejects.toMatchObject(error)
	})
})
