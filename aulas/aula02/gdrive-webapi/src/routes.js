import { parse } from 'url'
import { resolve } from 'path'
import { pipeline } from 'stream/promises'
import FileHelper from './helpers/fileHelper'
import { __dirname } from './helpers/pathHelper'
import UploadHandler from './uploadHandler'
import { logger } from './logger'

const defaultDownloadsFolder = resolve(__dirname, '..', 'downloads')

export default class Routes {
  io

  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder
    this.fileHelper = FileHelper
  }

  setSocketInstance(io) {
    this.io = io
  }

  async defaultRoute(request, response) {
    response.end('Hello world')
  }
  
  async options(request, response) {
    response.writeHead(204)
    response.end()
  }

  async post(request, response) {
    const { headers } = request

    const { query: { socketId } } = parse(request.url, true)
    
    const uploadHandler = new UploadHandler({
      io: this.io,
      socketId,
      downloadsFolder: this.downloadsFolder
    })

    const onFinish = response => () => {
      response.writeHead(200)
      const data = JSON.stringify({ result: 'Files uploaded with success!' })
      response.end(data)
    }

    const busboyInstance = uploadHandler.registerEvents(
      headers,
      onFinish(response)
    )
    
    await pipeline(
      request,
      busboyInstance
    )

    logger.info('Request finished with success!')
  }

  async get(request, response) {
    const files = await this.fileHelper.getFileStatus(this.downloadsFolder)
    
    response.writeHead(200)
    response.end(JSON.stringify(files))
  }

  handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*')
    const chosen = this[request.method.toLowerCase()] || this.defaultRoute

    return chosen.apply(this, [request, response])
  }
}