import { config } from '../../config'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as faker from 'faker'
import { Verification } from '../../app/core/entities/Verification'
import { FileSystemGateway } from './FileSystemGateway'

const IN_DIR = path.join(config.fileSystem.writeDir, 'test-files')
const OUT_DIR = path.join(config.fileSystem.writeDir, 'verifications')

describe('FileSystemGateway', () => {
  let verification: Verification
  const gateway = new FileSystemGateway()

  beforeEach(() => {
    verification = fakerVerification()
  })

  afterEach(() => {
    // Clear all temporary files
    if (verification.files) {
      for (const file of verification.files) {
        fs.removeSync(file)
      }
    }
    fs.removeSync(IN_DIR)
    fs.removeSync(OUT_DIR)
  })

  it('remove()', async () => {
    const file = fakerCreateTestFile('test1.txt')
    const promise = gateway.remove(file)
    await expect(promise).resolves.toStrictEqual(undefined)
    await expect(fs.stat(file)).rejects.not.toEqual(undefined)
  })

  it('save() no files', async () => {
    const promise = gateway.save(verification)
    await expect(promise).resolves.toStrictEqual(verification)
  })

  it('save() Multiple files', async () => {
    verification.files = [fakerCreateTestFile('test1.txt'), fakerCreateTestFile('test2.txt')]

    const promise = gateway.save(verification)

    const valid = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    await expect(promise).resolves.toMatchObject(valid)

    // Files exist in new location
    for (const file of valid.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of verification.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }
  })

  it('save() Files with verification number', async () => {
    verification.files = [fakerCreateTestFile('test1.txt'), fakerCreateTestFile('test2.txt')]
    verification.number = faker.datatype.number()

    const promise = gateway.save(verification)

    const valid = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    await expect(promise).resolves.toMatchObject(valid)

    // Files exist in new location
    for (const file of valid.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of verification.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }
  })

  it('save() first without verification, then with', async () => {
    verification.files = [fakerCreateTestFile('test1.txt'), fakerCreateTestFile('test2.txt')]

    let promise = gateway.save(verification)

    const validWithoutNumber = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    await expect(promise).resolves.toMatchObject(validWithoutNumber)

    // Files exist in new location
    for (const file of validWithoutNumber.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of verification.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }

    verification = await promise
    verification.number = faker.datatype.number()

    const validWithNumber = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    promise = gateway.save(verification)
    await expect(promise).resolves.toMatchObject(validWithNumber)

    // Files exist in new location
    for (const file of validWithNumber.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of validWithoutNumber.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }
  })

  it('save() first then change name', async () => {
    verification.files = [fakerCreateTestFile('test1.txt'), fakerCreateTestFile('test2.txt')]

    let promise = gateway.save(verification)

    const validFirst = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    await expect(promise).resolves.toMatchObject(validFirst)

    // Files exist in new location
    for (const file of validFirst.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of verification.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }

    verification = await promise
    verification.name = 'Another name'

    const validChangedName = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    promise = gateway.save(verification)
    await expect(promise).resolves.toMatchObject(validChangedName)

    // Files exist in new location
    for (const file of validChangedName.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of validFirst.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }
  })

  it('save() append files', async () => {
    verification.files = [fakerCreateTestFile('test1.txt'), fakerCreateTestFile('test2.txt')]

    let promise = gateway.save(verification)

    const validFirst = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    await expect(promise).resolves.toMatchObject(validFirst)

    // Files exist in new location
    for (const file of validFirst.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of verification.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }

    verification = await promise
    verification.files?.push(fakerCreateTestFile('test3.txt'))

    const validUpdated = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (3).txt`),
      ],
    }

    promise = gateway.save(verification)
    await expect(promise).resolves.toMatchObject(validUpdated)

    // Files exist in new location
    for (const file of validUpdated.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }
  })

  it('save() remove duplicates', async () => {
    const [file1, fileDup1] = fakerCreateTestFileWithDuplicate('test1.txt')
    const [file2, fileDup2] = fakerCreateTestFileWithDuplicate('test2.txt')
    verification.files = [file1, file2, fileDup1]

    let promise = gateway.save(verification)

    const valid = {
      files: [
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (1).txt`),
        path.join(OUT_DIR, '2020', `${verification.getFullName()} (2).txt`),
      ],
    }

    await expect(promise).resolves.toMatchObject(valid)

    // Files exist in new location
    for (const file of valid.files) {
      await expect(fs.stat(file)).resolves.not.toEqual(undefined)
    }

    // Files removed in original location
    for (const file of verification.files) {
      await expect(fs.stat(file)).rejects.not.toEqual(undefined)
    }

    // Add another duplicate
    verification = await promise
    verification.files?.push(fileDup2)

    promise = gateway.save(verification)

    await expect(promise).resolves.toMatchObject(valid)

    // Duplicated file has been removed
    await expect(fs.stat(fileDup2)).rejects.not.toEqual(undefined)
  })
})

/////////////////////
//			FAKERS
////////////////////
function fakerCreateTestFile(name: string): string {
  const testFile = path.join(IN_DIR, name)
  fs.ensureDirSync(path.dirname(testFile))
  fs.writeFileSync(testFile, faker.lorem.paragraphs(2))

  return testFile
}

function fakerCreateTestFileWithDuplicate(name: string): [string, string] {
  const testFile = fakerCreateTestFile(name)

  const ext = path.extname(testFile)
  const firstPart = testFile.substr(0, testFile.length - ext.length)
  const testFileDuplicate = `${firstPart}-duplicate${ext}`

  fs.copySync(testFile, testFileDuplicate)

  return [testFile, testFileDuplicate]
}

function fakerVerification(): Verification {
  return new Verification({
    userId: 1,
    name: faker.commerce.productName() + ' 12',
    date: '2020-01-01',
    type: Verification.Types.TRANSACTION,
    transactions: [],
  })
}
