import { ObjectId } from 'mongodb'
import { InternalError } from '../../app/core/definitions/InternalError'
import { Account } from '../../app/core/entities/Account'
import { Verification } from '../../app/core/entities/Verification'
import { Parser } from '../../app/core/entities/Parser'
import { User } from '../../app/core/entities/User'
import { ParserSingle } from '../../app/core/entities/ParserSingle'
import { ParserMulti } from '../../app/core/entities/ParserMulti'
import { FiscalYear } from '../../app/core/entities/FiscalYear'
import { Currency } from '../../app/core/entities/Currency'

type AddId = 'add-id' | 'dont-add-id'
type RemoveUndefined = 'remove-undefined' | 'keep-undefined'

export namespace MongoConverter {
  /**
   * Serialize an entity to a DB object.
   * Automatically converts bigint to string, and ids to Mongo db's internal id type.
   * The id property is mapped to _id.
   * @param entity the entity to serialize to a DB object
   * @param addId if _id should be added to the DB object if one doesn't exist, defaults to 'add-id'
   * @param removeUndefined if all undefined properties should be removed from the object, defaults to 'remove-undefined'
   * @return the serialized object
   * @throws {InternalError.Types.dbError} if the entity is empty, or only contains undefined or null properties
   */
  export function toDbObject(
    entity: {},
    addId: AddId = 'add-id',
    removeUndefined: RemoveUndefined = 'remove-undefined'
  ): { _id: ObjectId } {
    if (!entity || Object.keys(entity).length === 0) {
      throw new InternalError(InternalError.Types.dbError, 'toEntity() empty object')
    }

    const dbObject = serialize(entity, removeUndefined) as { _id: ObjectId }

    if (typeof dbObject === 'undefined') {
      throw new InternalError(InternalError.Types.dbError, 'toDbObject() supplied empty object')
    }

    if (addId === 'add-id' && typeof dbObject._id === 'undefined') {
      dbObject._id = new ObjectId()
    }

    return dbObject
  }

  function serialize(entity: {}, removeUndefined: RemoveUndefined): {} | undefined {
    const object: any = entity instanceof Array ? [] : {}
    for (let [key, value] of Object.entries(entity)) {
      if ((typeof value !== 'undefined' && value !== null) || removeUndefined === 'keep-undefined') {
        // Convert id
        if ((key === 'id' || key.endsWith('Id')) && (typeof value === 'string' || typeof value === 'number')) {
          if (key === 'id') {
            object._id = new ObjectId(value)
          } else {
            object[key] = new ObjectId(value)
          }
        }

        // Convert bigint
        else if (typeof value === 'bigint') {
          object[key] = `${value}n`
        }

        // Currency code - only use name
        else if (value instanceof Currency.Codes) {
          object[key] = value.name
        }

        // Regexp - Use value directly
        else if (value instanceof RegExp) {
          object[key] = value
        }

        // Recursive object
        else if (typeof value === 'object' && value) {
          const child = serialize(value!, removeUndefined)
          if (child) {
            object[key] = child
          }
        }

        // Use value
        else {
          object[key] = value
        }
      }
    }

    return object
  }

  /**
   * Deserialize a Mongo DB object to an entity option.
   * Automatically converts bigint, and Mongo db's internal id to string ids.
   * The _id property is mapped to id.
   * @param object the DB object to serialize to an entity
   * @return the deserialized object into an entity option
   * @throws {InternalError.Types.dbError} if the object is empty
   */
  export function toOption(object: Document): any {
    if (!object || Object.keys(object).length === 0) {
      throw new InternalError(InternalError.Types.dbError, 'toEntity() empty object')
    }

    return deserialize(object)
  }

  export function toAccount(object: any): Account {
    const entityOption = toOption(object)
    return new Account(entityOption)
  }

  export function toVerification(object: any): Verification {
    const entityOption = toOption(object)
    return new Verification(entityOption)
  }

  export function toParser(object: any): Parser {
    const entityOption = toOption(object)

    switch (entityOption.type) {
      case Parser.Types.single:
        return new ParserSingle(entityOption)
      case Parser.Types.multi:
        return new ParserMulti(entityOption)
      default:
        throw new InternalError(
          InternalError.Types.notImplemented,
          `Parser type ${entityOption.type} not implementd in MongoConverter`
        )
    }
  }

  export function toUser(object: any): User {
    const entityOption = toOption(object)
    return new User(entityOption)
  }

  export function toFiscalYear(object: any): FiscalYear {
    const entityOption = toOption(object)
    return new FiscalYear(entityOption)
  }

  function deserialize(object: any): {} {
    const entity: any = object instanceof Array ? [] : {}

    for (let [key, value] of Object.entries(object)) {
      // Convert id
      if (value instanceof ObjectId) {
        if (key === '_id') {
          entity.id = value.toHexString()
        } else {
          entity[key] = value.toHexString()
        }
      }

      // Convert bigint
      else if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
        entity[key] = BigInt(value.substr(0, value.length - 1))
      }

      // Object
      else if (typeof value === 'object' && value) {
        // Regexp - use value directly
        if (value instanceof RegExp) {
          entity[key] = value
        }
        // Recursive object
        else {
          entity[key] = deserialize(value)
        }
      }

      // Use value
      else {
        entity[key] = value
      }
    }

    return entity
  }
}
