import { Entity } from '../entities/Entity'

export interface Model {
	toEntity(): Entity
}
