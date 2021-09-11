import http from 'http'
import https from 'https'
import fs from 'fs'
import { logger } from './logger.js'
import { Server } from 'socket.io'
import Routes from './routes.js'

const PORT = process.env.PORT || 3000

const isProduction = process.env.NODE_ENV === 'production'

process.env.USER = process.env.USER ?? 'system_user'

const localHostSSL = {
  key: fs.readFileSync('./certificates/key.pem'),
  cert: fs.readFileSync('./certificates/cert.pem')
}

const protocol = isProduction ? http : https
const sslConfig = isProduction ? {} : localHostSSL

const routes = new Routes()
const server = protocol.createServer(
  sslConfig,
  routes.handler.bind(routes)
)

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
})

routes.setSocketInstance(io)

io.on('connection', socket => logger.info(`someone connected: ${socket.id}`))

const startServer = () => {
  const { address, port } = server.address()
  const protocolText = isProduction ? 'http' : 'https'
  logger.info(`app running at ${protocolText}://${address}:${port}`)
}

server.listen(PORT, startServer)