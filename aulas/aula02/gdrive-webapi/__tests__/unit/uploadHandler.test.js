import {
  beforeEach,
  describe,
  test,
  expect,
  jest
} from '@jest/globals'
import fs from 'fs'
import { resolve } from 'path'
import { pipeline } from 'stream/promises'
import { logger } from '../../src/logger'
import UploadHandler from '../../src/uploadHandler'
import TestUtils from '../_utils/testUtils'
import ioObj from '../_fixtures/ioObj'

describe('#UploadHandler test suite', () => {

  beforeEach(() => {
    // mocking logger info function so it doesn't log anything on tests console
    jest
      .spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('#registerEvents', () => {

    test('should call onFile and onFinish functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest
        .spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValue()

      const headers = {
        'content-type': 'multipart/form-data; boundary=',
      }

      const onFinishMock = jest.fn()

      const busboyInstance = uploadHandler.registerEvents(headers, onFinishMock)

      const fileStream = TestUtils.generateReadableStream(['chunk', 'of', 'data'])

      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')
      busboyInstance.listeners('finish')[0].call()

      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinishMock).toHaveBeenCalled()
    })

  })

  describe('#onFile', () => {

    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder
      })

      const onWritableMock = jest.fn()
      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(
          () => TestUtils.generateWritableStream(onWritableMock)
        )

      const onTransformMock = jest.fn()
      jest
        .spyOn(uploadHandler, uploadHandler.handleFileBytes.name)
        .mockImplementation(
          () => TestUtils.generateTransformStream(onTransformMock)
        )
      
      const params = {
        fieldname: 'video',
        file: TestUtils.generateReadableStream(chunks),
        filename: 'mockFile.mov'
      }

      await uploadHandler.onFile(...Object.values(params))

      expect(onWritableMock.mock.calls.join()).toEqual(chunks.join())
      expect(onTransformMock.mock.calls.join()).toEqual(chunks.join())

      const expectedFileName = resolve(uploadHandler.downloadsFolder, params.filename)
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName)
    })

  })

  describe('#handleFileBytes', () => {

    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })
      
      jest
        .spyOn(uploadHandler, uploadHandler.canExecute.name)
        // .mockReturnValueOnce(true) // if it's only one message
        .mockReturnValue(true)

      const messages = ['hello', 'crap']
      const source = TestUtils.generateReadableStream(messages)
      const onWriteMock = jest.fn()
      const target = TestUtils.generateWritableStream(onWriteMock)

      await pipeline(
        source,
        uploadHandler.handleFileBytes('filename.txt'),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      // if handleFileBytes is a transform stream, the pipeline will
      // continue processing, passing data forward and calling our fn
      // for each target chunk
      expect(onWriteMock).toBeCalledTimes(messages.length)
      expect(onWriteMock.mock.calls.join()).toEqual(messages.join())
    })

    test('given 2s messageTimeDelay it should emit only two messages during 2s period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)

      const dayTimestampWithoutSeconds = '2021-07-09 10:28'
      // Date.now() of this.lastMessageSent in handleFileBytes method
      const onFirstLastMessageSent = TestUtils.getTimeFromDate(`${dayTimestampWithoutSeconds}:05`)

      // on first message arrival
      const onFirstCanExecute = TestUtils.getTimeFromDate(`${dayTimestampWithoutSeconds}:07`)
      
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      // on second message arrival, but it's outside execution time window
      const onSecondCanExecute = TestUtils.getTimeFromDate(`${dayTimestampWithoutSeconds}:08`)
      
      // on last message arrival
      const onThirdCanExecute = TestUtils.getTimeFromDate(`${dayTimestampWithoutSeconds}:09`)

      TestUtils.mockDateNow(
        [
          onFirstLastMessageSent,
          onFirstCanExecute,
          onSecondUpdateLastMessageSent,
          onSecondCanExecute,
          onThirdCanExecute
        ]
      )

      const messages = ['hello', 'you', 'world']
      const filename = 'filename.avi'
      const messageTimeDelay = 2000

      const source = TestUtils.generateReadableStream(messages)
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        messageTimeDelay
      })

      await pipeline(
        source,
        uploadHandler.handleFileBytes(filename)
      )

      const expectedMessagesSent = 2
      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessagesSent)

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls
      expect(firstCallResult).toEqual([uploadHandler.ON_UPLOAD_EVENT, {
        processedAlready: messages[0].length,
        filename
      }])

      expect(secondCallResult).toEqual([uploadHandler.ON_UPLOAD_EVENT, {
        processedAlready: messages.join('').length,
        filename: 'filename.avi'
      }])
    })

  })

  describe('#canExecute', () => {
    
    test('should return true when time is later than specified delay', () => {
      const timerDelay = 1000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })


      const lastExecutionTimestamp = TestUtils.getTimeFromDate('2021-07-09 10:07:07')      
      TestUtils.mockDateNow([lastExecutionTimestamp])

      const currentExecutionTimestamp = TestUtils.getTimeFromDate('2021-07-09 10:07:04')

      const result = uploadHandler.canExecute(currentExecutionTimestamp)

      expect(result).toBeTruthy()
    })
    
    test('should return false when time is not later than specified delay', () => {
      const timerDelay = 3000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })


      const lastExecutionTimestamp = TestUtils.getTimeFromDate('2021-07-09 10:07:05')      
      TestUtils.mockDateNow([lastExecutionTimestamp])

      const currentExecutionTimestamp = TestUtils.getTimeFromDate('2021-07-09 10:07:04')

      const result = uploadHandler.canExecute(currentExecutionTimestamp)

      expect(result).toBeFalsy()    
    })

  })

})