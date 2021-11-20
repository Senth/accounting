import { ApiAdapter } from '../../adapters/api/ApiAdapter'
import express, { Request, Response } from 'express'
import fileUpload from 'express-fileupload'
import cors from 'cors'
import { config } from '../../config'
import { ExpressSerializer } from './ExpressSerializer'
import { OutputError } from '../../app/core/definitions/OutputError'
import { Id } from '../../app/core/definitions/Id'
import * as path from 'path'
import * as fs from 'fs-extra'
import shortid from 'shortid'

export enum ResponseCodes {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	NOT_FOUND = 404,
	INTERNAL_SERVER_ERROR = 500,
}

type ActionCallback = (adapter: ApiAdapter, request: Request) => Promise<any>
type UserActionCallback = (adapter: ApiAdapter, request: Request, userId: Id, files: string[]) => Promise<any>

export class ExpressApiHelper {
	readonly express = express()
	readonly adapter: ApiAdapter
	readonly tmpDir = path.join(config.fileSystem.writeDir, 'tmp')

	constructor(adapter: ApiAdapter) {
		this.adapter = adapter

		fs.ensureDirSync(this.tmpDir)

		this.express.listen(config.server.port)

		// Enable CORS for testing and development
		if (config.env.isTesting() || config.env.isDevelopment()) {
			this.express.use(cors())
		}

		this.express.use(express.json())
		this.express.use(
			fileUpload({
				parseNested: true,
				preserveExtension: true,
				safeFileNames: true,
			})
		)
	}

	get(path: string, action: ActionCallback, responseCode: ResponseCodes = ResponseCodes.OK) {
		this.express.get(path, (request, response) => {
			this.simple(request, response, action, responseCode)
		})
	}

	post(path: string, action: ActionCallback, responseCode: ResponseCodes = ResponseCodes.OK) {
		this.express.post(path, (request, response) => {
			this.simple(request, response, action, responseCode)
		})
	}

	getAuthorized(path: string, action: UserActionCallback, responseCode: ResponseCodes = ResponseCodes.OK) {
		this.express.get(path, (request, response) => {
			this.authorized(request, response, action, responseCode)
		})
	}

	postAuthorized(path: string, action: UserActionCallback, responseCode: ResponseCodes = ResponseCodes.OK) {
		this.express.post(path, (request, response) => {
			this.authorized(request, response, action, responseCode)
		})
	}

	private simple(request: Request, response: Response, action: ActionCallback, responseCode: ResponseCodes) {
		action(this.adapter, request)
			.then((apiOutput) => {
				response.status(responseCode).send(ExpressSerializer.serialize(apiOutput))
			})
			.catch((reason) => {
				if (reason instanceof OutputError) {
					response.status(ResponseCodes.BAD_REQUEST).send(reason)
				} else {
					response.sendStatus(ResponseCodes.INTERNAL_SERVER_ERROR)
				}
			})
	}

	private authorized(request: Request, response: Response, action: UserActionCallback, responseCode: ResponseCodes) {
		const query = request.query

		let getUserPromise

		if (typeof query.apiKey === 'string') {
			getUserPromise = this.adapter.user.getByKey({ apiKey: query.apiKey })
		} else {
			response.status(ResponseCodes.UNAUTHORIZED).send(OutputError.create(OutputError.Types.apiKeyMissing))
			return
		}

		const [files, filePromise] = this.getFiles(request)

		getUserPromise
			.then((user) => {
				return Promise.all([Promise.resolve(user.userId), filePromise])
			})
			.then(([userId]) => {
				return action(this.adapter, request, userId, files)
			})
			.then((apiOutput) => {
				response.status(responseCode).send(ExpressSerializer.serialize(apiOutput))
			})
			.catch((reason) => {
				if (reason instanceof OutputError) {
					response.status(ResponseCodes.BAD_REQUEST).send(reason)
				} else {
					response.sendStatus(ResponseCodes.INTERNAL_SERVER_ERROR)
				}
			})
	}

	private getFiles(request: Request): [string[], Promise<void[]>] {
		const files = new Array<string>()
		const promises = new Array<Promise<void>>()

		if (request.files) {
			// Uploaded multiple files
			if (request.files.files instanceof Array) {
				for (const file of request.files.files) {
					const uniqueFilename = ExpressApiHelper.generateUniqueFilename(file.name)
					promises.push(file.mv(uniqueFilename))
					files.push(uniqueFilename)
				}
			}
			// Uploaded only one file
			else if (request.files.files) {
				const uniqueFilename = ExpressApiHelper.generateUniqueFilename(request.files.files.name)
				promises.push(request.files.files.mv(uniqueFilename))
				files.push(uniqueFilename)
			}
		}

		return [files, Promise.all(promises)]
	}

	private static generateUniqueFilename(filename: string): string {
		return shortid.generate() + '_' + filename
	}
}
