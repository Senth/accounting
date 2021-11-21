let configData: Config
if (process.env.NODE_ENV === 'development') {
  configData = require('./config.development').config
} else if (process.env.NODE_ENV === 'production') {
  configData = require('./config.production').config
} else if (process.env.NODE_ENV === 'test') {
  configData = require('./config.testing').config
} else {
  throw new Error('Could not load config file')
}

class Config implements Config.Option {
  mongoDb: MongoDbFunctions
  apiKeys: ApiKeys
  server: Server
  fileSystem: FileSystem

  constructor(data: Config.Option) {
    this.fileSystem = data.fileSystem
    this.apiKeys = data.apiKeys
    this.server = data.server

    this.mongoDb = {
      ...data.mongoDb,
      url: function () {
        let credentials = ''
        if (this.username && this.password) {
          credentials = `${this.username}:${this.password}@`
        }

        let portString = ''
        if (this.port) {
          portString = `:${this.port}`
        }

        return `mongodb://${credentials}${this.host}${portString}`
      },
    }
  }

  env = {
    isDevelopment(): boolean {
      return process.env.NODE_ENV === 'development'
    },

    isTesting(): boolean {
      return process.env.NODE_ENV === 'test'
    },

    isProduction(): boolean {
      return process.env.NODE_ENV === 'production'
    },
  }
}

export const config = new Config(configData)

export namespace Config {
  export interface Option {
    mongoDb: MongoDb
    apiKeys: ApiKeys
    server: Server
    fileSystem: FileSystem
  }
}

interface MongoDb {
  host: string
  username?: string
  password?: string
  database: string
  port?: number
}

interface MongoDbFunctions extends MongoDb {
  /**
   * Get the url for mongo db
   */
  url(): string
}

interface ApiKeys {
  fixerIo: string
}

interface Server {
  port: number
}

interface FileSystem {
  /**
   * Project directory, the folder that has the backend and frontend dirs.
   */
  projectDir: string
  /**
   * Output for all files, this should be the full path to the output dir
   */
  writeDir: string
}
