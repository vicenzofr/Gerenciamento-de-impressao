import { resolve } from 'node:path'
import { openDatabase } from './database.mjs'
import { createApp } from './app.mjs'

const port = Number(process.env.PORT || 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT deve ser uma porta válida.')
const file = resolve(process.env.DATABASE_PATH || 'data/printing.sqlite')
const db = openDatabase(file)
const server = createApp(db)
server.on('error', (error) => { console.error(error); db.close(); process.exitCode = 1 })
server.listen(port, '127.0.0.1', () => {
  console.log('Servidor: http://localhost:' + port)
  console.log('Banco SQL: ' + file)
})
function stop() { server.close(() => { db.close() }); server.closeIdleConnections() }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
