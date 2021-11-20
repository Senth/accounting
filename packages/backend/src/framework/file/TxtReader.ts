import { FileReader } from './FileReader'
import { readFileSync } from 'fs'
import { InternalError } from '../../app/core/definitions/InternalError'

export class TxtReader implements FileReader {
	async read(file: string): Promise<string> {
		try {
			const data = readFileSync(file, 'utf8')
			return data
		} catch (error) {
			throw new InternalError(InternalError.Types.fileNotFound, error)
		}
	}
}
