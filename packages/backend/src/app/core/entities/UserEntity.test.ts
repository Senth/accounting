import { UserEntity } from './UserEntity'
import faker from 'faker'
import { OutputError } from '../definitions/OutputError'

faker.seed(123)

class UserEntityImpl extends UserEntity {
  constructor(data: UserEntity.Option) {
    super(data)
  }
}

describe('Validate user entity #cold', () => {
  let entity: UserEntityImpl

  beforeEach(() => {
    entity = new UserEntityImpl({
      userId: faker.datatype.number(),
    })
  })

  // User ID
  it('User id is of type number and valid', () => {
    entity.userId = faker.datatype.number()
    expect(entity.validate()).toStrictEqual([])
  })

  it('User id is of type string and valid', () => {
    entity.userId = faker.datatype.uuid()
    expect(entity.validate()).toStrictEqual([])
  })

  it('User id is of type string and invalid (empty)', () => {
    entity.userId = ''
    expect(entity.validate()).toStrictEqual([{ type: OutputError.Types.userIdIsEmpty }])
  })
})
