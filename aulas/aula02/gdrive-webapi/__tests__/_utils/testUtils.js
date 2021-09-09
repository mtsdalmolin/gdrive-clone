import { jest } from '@jest/globals'
import { Readable, Transform, Writable } from 'stream'

export default class TestUtils {
  static generateReadableStream(data) {
    return new Readable({
      objectMode: true,
      read() {
        for (const item of data) {
          this.push(item)
        }

        // inform the end of a readable stream by pushing null value
        this.push(null)
      }
    })
  }

  static generateWritableStream(onData) {
    return new Writable({
      objectMode: true,
      write(chunk, encoding, cb) {
        onData(chunk)

        cb(null, chunk)
      }
    })
  }

  static generateTransformStream(onData) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, cb) {
        onData(chunk)

        cb(null, chunk)
      }
    })
  }
  
  static getTimeFromDate(dateString) {
    return new Date(dateString).getTime()
  }

  static mockDateNow(mockImplementationPeriods) {
    const now = jest.spyOn(global.Date, global.Date.now.name)

    mockImplementationPeriods.forEach(time => {
      now.mockReturnValueOnce(time)
    })
  }
}