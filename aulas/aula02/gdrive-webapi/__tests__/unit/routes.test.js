import {
  beforeEach,
  describe,
  test,
  expect,
  jest
} from '@jest/globals'
import routesDefaultParams from '../_fixtures/routesDefaultParams'
import { logger } from '../../src/logger'
import Routes from '../../src/routes'
import UploadHandler from '../../src/uploadHandler'
import TestUtils from '../_utils/testUtils'

describe('#Routes test suite', () => {
  const request = TestUtils.generateReadableStream(['some', 'filler', 'test', 'text'])
  const response = TestUtils.generateWritableStream(() => {})

  const defaultParams = {
    request: Object.assign(request, {
      ...routesDefaultParams.request
    }),
    response: Object.assign(response, {
      ...routesDefaultParams.response
    }),
    values: () => Object.values(defaultParams)
  }
  
  beforeEach(() => {
    jest
      .spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('#setSocketInstance', () => {
    test('should store io instance', () => {
      const routes = new Routes()
      const ioObj = {
        to: id => ioObj,
        emit: (event, message) => {}
      }

      routes.setSocketInstance(ioObj)

      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('#handler', () => {
    test('given an inexistent route it should choose default route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      params.request.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.response.end).toHaveBeenCalledWith('Hello world')
    })
    
    test('should set any request with CORS enabled', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      params.request.method = 'inexistent'
      await routes.handler(...params.values())
      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })
    
    test('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      params.request.method = 'OPTIONS'
      await routes.handler(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(204)
      expect(params.response.end).toHaveBeenCalled()
    })
    
    test('given method POST it should choose post route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      params.request.method = 'POST'

      jest.spyOn(routes, routes.post.name).mockResolvedValue()

      await routes.handler(...params.values())
      expect(routes.post).toHaveBeenCalled()
    })
    
    test('given method GET it should choose get route', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      params.request.method = 'GET'

      jest.spyOn(routes, routes.get.name).mockResolvedValue()

      await routes.handler(...params.values())
      expect(routes.get).toHaveBeenCalled()
    })
  })

  describe('#get', () => {
    test('given GET method it should list all files downloaded', async () => {
      const routes = new Routes()
      const params = {
        ...defaultParams
      }

      const fileStatusesMock = [
        {
          size: '1.56 MB',
          lastModified: '2021-09-07T01:40:01.100Z',
          owner: 'mtsda',
          file: 'file.jpg'
        }
      ]

      jest
        .spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
        .mockResolvedValue(fileStatusesMock)

      params.request.method = 'GET'
      await routes.handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(200)
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock))
    })
  })
  
  describe('#post', () => {
    test('should validate post route workflow', async () => {
      const routes = new Routes('/tmp')

      const params = {
        ...defaultParams
      }

      params.request.method = 'POST'
      params.request.url = '?socketId=10'

      jest
        .spyOn(
          UploadHandler.prototype,
          UploadHandler.prototype.registerEvents.name
        )
        .mockImplementation((headers, onFinish) => {
          const writable = TestUtils.generateWritableStream(() => {})

          writable.on('finish', onFinish)

          return writable
        })

      await routes.handler(...params.values())

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
      expect(params.response.writeHead).toHaveBeenCalledWith(200)
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify({ result: 'Files uploaded with success!' }))
    })
  })

})