import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'

export interface VerificationNewFromParserInput extends Input {
	userId: Id
	files: string[]
}

export namespace VerificationNewFromParserInput {
	export function validate(object: any): object is VerificationNewFromParserInput {
		const implementation = object as VerificationNewFromParserInput

		if (typeof implementation.userId !== 'number' && typeof implementation.userId !== 'string') {
			throw OutputError.create(OutputError.Types.userIdMissing)
		}

		// Optional files
		if (implementation.files !== undefined && !(implementation.files instanceof Array)) {
			throw new InternalError(InternalError.Types.invalidEntityState, 'files not an array')
		} else if (implementation.files instanceof Array) {
			for (const file of implementation.files) {
				if (typeof file !== 'string') {
					throw new InternalError(InternalError.Types.invalidEntityState, 'files[index] not a string')
				}
			}
		}

		return true
	}
}
