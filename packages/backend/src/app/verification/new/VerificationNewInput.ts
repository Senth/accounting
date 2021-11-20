import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'
import { OutputError } from '../../core/definitions/OutputError'
import { InternalError } from '../../core/definitions/InternalError'

export interface VerificationNewInput extends Input {
	readonly userId: Id
	readonly verification: {
		readonly name: string
		readonly description?: string
		readonly files?: string[]
		readonly type: string
		readonly date: string
		readonly amount: number
		readonly accountFrom: number
		readonly accountTo: number
		readonly currencyCode: string
	}
}

export namespace VerificationNewInput {
	export function validate(object: any): object is VerificationNewInput {
		const implementation = object as VerificationNewInput

		if (typeof implementation.userId !== 'number' && typeof implementation.userId !== 'string') {
			throw OutputError.create(OutputError.Types.userIdMissing)
		}
		if (implementation.verification === undefined) {
			throw OutputError.create(OutputError.Types.verificationMissing)
		} else {
			if (typeof implementation.verification.name !== 'string') {
				throw OutputError.create(OutputError.Types.nameMissing)
			}
			if (typeof implementation.verification.type !== 'string') {
				throw OutputError.create(OutputError.Types.verificationTypeMissing)
			}
			if (typeof implementation.verification.date !== 'string') {
				throw OutputError.create(OutputError.Types.dateMissing)
			}
			if (typeof implementation.verification.amount !== 'number') {
				throw OutputError.create(OutputError.Types.amountMissing)
			}
			if (typeof implementation.verification.accountFrom !== 'number') {
				throw OutputError.create(OutputError.Types.accountFromMissing)
			}
			if (typeof implementation.verification.accountTo !== 'number') {
				throw OutputError.create(OutputError.Types.accountToMissing)
			}
			if (typeof implementation.verification.currencyCode !== 'string') {
				throw OutputError.create(OutputError.Types.currencyCodeMissing)
			}

			// Optional description
			if (
				implementation.verification.description !== undefined &&
				typeof implementation.verification.description !== 'string'
			) {
				throw OutputError.create(OutputError.Types.descriptionInvalidFormat)
			}
			// Optional files
			if (implementation.verification.files !== undefined && !(implementation.verification.files instanceof Array)) {
				throw new InternalError(InternalError.Types.invalidEntityState, 'verification.files not an array')
			} else if (implementation.verification.files instanceof Array) {
				for (const file of implementation.verification.files) {
					if (typeof file !== 'string') {
						throw new InternalError(InternalError.Types.invalidEntityState, 'verification.files[index] not a string')
					}
				}
			}
		}

		return true
	}
}
