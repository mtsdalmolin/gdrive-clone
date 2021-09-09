import { jest } from '@jest/globals'

const defaultParams = {
  request: {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    method: '',
    body: {}
  },
  response: {
    setHeader: jest.fn(),
    writeHead: jest.fn(),
    end: jest.fn()
  },
  values: () => Object.values(defaultParams)
}

export default defaultParams