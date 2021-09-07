import { describe, test, expect, jest } from '@jest/globals'
import fs from 'fs'
import FileHelper from '../../src/fileHelper'

describe('#FileHelper', () => {

  describe('#getFileStatus', () => {
    test('should return files statuses in correct format', async () => {
      const statMock = {
        dev: 2064,
        mode: 33188,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 1248060,
        size: 1557809,
        blocks: 3048,
        atimeMs: 1630978801100,
        mtimeMs: 1630978801190,
        ctimeMs: 1630978801190,
        birthtimeMs: 1630978801100,
        atime: '2021-09-07T01:40:01.100Z',
        mtime: '2021-09-07T01:40:01.190Z',
        ctime: '2021-09-07T01:40:01.190Z',
        birthtime: '2021-09-07T01:40:01.100Z'
      }

      const mockUser = 'mtsda'
      process.env.USER = mockUser
      const mockFilename = 'file.jpg'

      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([mockFilename])
        
      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock)

      const result = await FileHelper.getFileStatus('/tmp')

      const expectedResult = [
        {
          size: '1.56 MB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: mockFilename
        }
      ]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${mockFilename}`)
      expect(result).toMatchObject(expectedResult)
    })
  })

})