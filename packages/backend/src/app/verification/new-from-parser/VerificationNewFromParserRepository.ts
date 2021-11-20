import { Repository } from '../../core/definitions/Repository'
import { Parser } from '../../core/entities/Parser'
import { Id } from '../../core/definitions/Id'
import { VerificationNewRepository } from '../new/VerificationNewRepository'

export interface VerificationNewFromParserRepository extends VerificationNewRepository {
	/**
	 * @param userId the user to get all the parsers for
	 * @return all parser
	 */
	getParsers(userId: Id): Promise<Parser[]>

	/**
	 * Read the file and return a string of the file contents
	 * @param filename the file to read
	 * @return the read string
	 * @throws {OutputError.Types.notImplemented} if the filetype hasn't been implemented
	 */
	readFile(filename: string): Promise<string>
}
