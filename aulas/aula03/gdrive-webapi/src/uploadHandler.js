import Busboy from 'busboy'
import { pipeline } from 'stream/promises'
import fs from 'fs'
import { logger } from './logger.js'

export default class UploadHandler {
  constructor({ io, socketId, downloadsFolder, messageTimeDelay = 200 }) {
    this.io = io
    this.socketId = socketId
    this.downloadsFolder = downloadsFolder
    this.ON_UPLOAD_EVENT = 'file-upload'
    this.messageTimeDelay = messageTimeDelay
  }

  canExecute(lastExecution) {
    // it returns true if difference between last execution time
    // and current execution is greater than the specified delay
    return (Date.now() - lastExecution) >= this.messageTimeDelay
  }

  handleFileBytes(filename) {
    this.lastMessageSent = Date.now()

    async function* handleData(source) {
      let processedAlready = 0

      for await (const chunk of source) {
        yield chunk

        processedAlready += chunk.length
        if (!this.canExecute(this.lastMessageSent)) {
          continue
        }

        this.lastMessageSent = Date.now()
        this.io
          .to(this.socketId)
          .emit(this.ON_UPLOAD_EVENT, { processedAlready, filename })
        logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`)
      }
    }

    return handleData.bind(this)
  }

  async onFile(fieldname, file, filename) {
    const filePath = `${this.downloadsFolder}/${filename}`

    await pipeline(
      file, // readable stream
      this.handleFileBytes.apply(this, [filename]), // filter, convert and transform data
      fs.createWriteStream(filePath) // exit process in a writable stream
    )

    logger.info(`File [${filename}] finished processing`)
  }

  registerEvents(headers, onFinish) {
    const busboy = new Busboy({ headers })

    busboy.on('file', this.onFile.bind(this))
    busboy.on('finish', onFinish)

    return busboy
  }
}