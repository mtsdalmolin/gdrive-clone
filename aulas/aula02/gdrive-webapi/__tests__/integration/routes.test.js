import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  test,
  expect,
  jest
} from '@jest/globals'
import { tmpdir } from 'os'
import fs from 'fs'
import { join } from 'path'
import FormData from 'form-data'
import TestUtils from '../_utils/testUtils'
import { logger } from '../../src/logger'
import Routes from '../../src/routes'
import routesDefaultParams from '../_fixtures/routesDefaultParams'
import ioObj from '../_fixtures/ioObj'

describe('#Routes integration test suite', () => {
  let defaultDownloadsFolder = ''

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
  })

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(
      join(tmpdir(), 'downloads-')
    )
  })
  
  beforeEach(() => {
    jest
      .spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('#getFileStatus', () => {

    test('should upload file to the folder', async () => {
      const filename = 'plips.jpg'
      const fileStream = fs.createReadStream(`./__tests__/integration/mocks/${filename}`)
      const response = TestUtils.generateWritableStream(() => {})

      const formData = new FormData()
      formData.append('photo', fileStream)

      const defaultParams = {
        request: Object.assign(formData, {
          ...routesDefaultParams.request,
          headers: formData.getHeaders(),
          method: 'POST',
          url: '?socketId=10'
        }),
        response: Object.assign(response, {
          ...routesDefaultParams.response
        }),
        values: () => Object.values(defaultParams)
      }

      const routes = new Routes(defaultDownloadsFolder)
      routes.setSocketInstance(ioObj)

      const dirBeforeSavingFiles = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirBeforeSavingFiles).toEqual([])

      await routes.handler(...defaultParams.values())
      
      const dirAfterSavingFiles = await fs.promises.readdir(defaultDownloadsFolder)
      expect(dirAfterSavingFiles).toEqual([filename])

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)

      const expectedResult = JSON.stringify({ result: 'Files uploaded with success!' })
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)
    })

  })

})