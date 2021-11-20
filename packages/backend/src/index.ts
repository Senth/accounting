// Start the backend

import { ApiAppAdapter } from './adapters/api/ApiAppAdapter'
import { ExpressApi } from './framework/api/ExpressApi'
import { BaseAdapter } from './adapters/repository/BaseAdapter'
import { MongoDbGateway } from './framework/db/MongoDbGateway'
import { FileSystemGateway } from './framework/file/FileSystemGateway'
import { FixerIoGateway } from './framework/exchange/FixerIoGateway'

BaseAdapter.init(new MongoDbGateway(), new FileSystemGateway(), new FixerIoGateway())
const apiAdapter = new ApiAppAdapter()
const expressApi = new ExpressApi(apiAdapter)
