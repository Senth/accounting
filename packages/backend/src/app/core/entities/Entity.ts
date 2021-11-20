import { Id } from '../definitions/Id'
import { OutputError } from '../definitions/OutputError'

/** Date: 2000-01-01 */
const VALID_DATE_AFTER = 946684800000

export namespace Entity {
	export interface Option {
		id?: Id
		dateCreated?: number
		dateModified?: number
		dateDeleted?: number
	}
}

export class Entity implements Entity.Option {
	id?: Id
	dateCreated: number
	dateModified: number
	dateDeleted?: number

	constructor(data: Entity.Option) {
		this.id = data.id
		this.dateDeleted = data.dateDeleted

		// Use the current date as default when it hasn't been set
		if (typeof data.dateCreated === 'undefined') {
			this.dateCreated = new Date().getTime()
		} else {
			this.dateCreated = data.dateCreated
		}

		// Use the current date as default when it hasn't been set
		if (typeof data.dateModified === 'undefined') {
			this.dateModified = new Date().getTime()
		} else {
			this.dateModified = data.dateModified
		}
	}

	/**
	 * Update modified date
	 */
	updateModified() {
		this.dateModified = new Date().getTime()
	}

	/**
	 * Set as deleted (and updates modified)
	 */
	setAsDeleted() {
		const time = new Date().getTime()
		this.dateModified = time
		this.dateDeleted = time
	}

	/**
	 * @return true if this entity has been set as deleted
	 */
	isDeleted(): boolean {
		return this.dateDeleted !== undefined
	}

	/**
	 * Validate the entity so it has correct values
	 * @return all error, or empty list if the entity is valid
	 */
	validate(): OutputError.Info[] {
		const errors: OutputError.Info[] = []

		// ID checks
		if (typeof this.id === 'string') {
			if (this.id.length <= 0) {
				errors.push({ type: OutputError.Types.idIsEmpty })
			}
		}

		// Date created
		const now = new Date().getTime()
		if (this.dateCreated) {
			// Invalid before a specified date
			if (this.dateCreated < VALID_DATE_AFTER) {
				const data = `${this.dateCreated} < ${VALID_DATE_AFTER}`
				errors.push({ type: OutputError.Types.dateCreatedTooEarly, data: data })
			}
			// In the future
			else if (this.dateCreated > now) {
				const data = `${this.dateCreated} > ${now}`
				errors.push({ type: OutputError.Types.dateCreatedInTheFuture, data: data })
			}
		}

		// Date modified
		if (this.dateModified) {
			// Requires date_created
			if (!this.dateCreated) {
				errors.push({ type: OutputError.Types.dateModifiedRequiresDateCreated })
			}
			// Before date created
			else if (this.dateModified < this.dateCreated) {
				const data = `${this.dateModified} < ${this.dateCreated}`
				errors.push({ type: OutputError.Types.dateModifiedBeforeCreated, data: data })
			}
			// In the future
			else if (this.dateModified > now) {
				const data = `${this.dateModified} > ${now}`
				errors.push({ type: OutputError.Types.dateModifiedInTheFuture, data: data })
			}
		}

		// Date deleted
		if (this.dateDeleted) {
			// Requires date_modified
			if (!this.dateModified) {
				errors.push({ type: OutputError.Types.dateDeletedRequiresDateModified })
			}
			// Not equal to modified
			else if (this.dateDeleted !== this.dateModified) {
				const data = `${this.dateDeleted} !== ${this.dateModified}`
				errors.push({ type: OutputError.Types.dateDeletedNotSameAsModified, data: data })
			}
		}

		return errors
	}
}
