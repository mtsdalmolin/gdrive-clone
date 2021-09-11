export default class ConnectionManager {
  constructor({ apiURL }) {
    this.apiURL = apiURL
    this.ioClient = io.connect(apiURL, { withCredentials: false })
    this.socketId = ''
  }

  configureEvents({ onProgress }) {
    this.ioClient.on('connect', this.onConnect.bind(this))
    this.ioClient.on('file-upload', onProgress)
  }

  onConnect(message) {
    this.socketId = this.ioClient.id
    console.log('connected', this.socketId)
  }

  async uploadFile(file) {
    const formData = new FormData()
    formData.append('files', file)

    const response = await fetch(
      `${this.apiURL}?socketId=${this.socketId}`,
      {
        method: 'POST',
        body: formData
      }
    )

    return response.json()
  }

  async currentFiles() {
    const files = await (await fetch(this.apiURL)).json()
    return files
  }
}