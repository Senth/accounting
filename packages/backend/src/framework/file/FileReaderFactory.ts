import { FileReader } from './FileReader'
import { PdfReader } from './PdfReader'
import { InternalError } from '../../app/core/definitions/InternalError'
import { TxtReader } from './TxtReader'

export class FileReaderFactory {
	/**
	 * Creates a correct file reader depending on the file's extension
	 * @param filename the filename to create a reader for
	 * @return a file reader that can read the specified file
	 * @throws {InternalError.Types.notImplemented} if the file's extension hasn't been implemented
	 */
	create(filename: string): FileReader {
		let fileReader: FileReader | undefined
		const extension = FileReaderFactory.getExtension(filename)

		if (extension === 'pdf') {
			fileReader = new PdfReader()
		} else if (extension === 'txt') {
			fileReader = new TxtReader()
		}

		if (fileReader) {
			return fileReader
		}

		const error = {
			message: 'FileReaderDistributor',
			file: filename,
			extension: extension,
		}
		throw new InternalError(InternalError.Types.notImplemented, error)
	}

	/**
	 * Returns the extension of the filename
	 * @param filename the filename to get the extension for
	 * @return lowercase extension of the filename, empty string if no extension was found
	 */
	private static getExtension(filename: string): string {
		const extension = filename.split('.').pop()
		if (extension) {
			return extension.toLowerCase()
		}
		return ''
	}
}
