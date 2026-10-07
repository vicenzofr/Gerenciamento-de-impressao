import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { ApiError, createJob, deleteJob, getDashboard } from './database.mjs'

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}
async function readJson(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'Envie os dados em JSON.')
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > 16384) throw new ApiError(413, 'Requisição muito grande.')
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new ApiError(400, 'JSON inválido.') }
}

export function createApp(db, { staticDir = resolve('dist') } = {}) {
  const base = resolve(staticDir)
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      if (url.pathname === '/api/health' && req.method === 'GET') {
        db.prepare('SELECT 1').get()
        return json(res, 200, { status: 'ok', database: 'sqlite' })
      }
      if (url.pathname === '/api/dashboard' && req.method === 'GET') return json(res, 200, getDashboard(db))
      if (url.pathname === '/api/jobs' && req.method === 'POST') return json(res, 201, createJob(db, await readJson(req)))
      const match = /^\/api\/jobs\/([^/]+)$/.exec(url.pathname)
      if (match && req.method === 'DELETE') return json(res, 200, deleteJob(db, decodeURIComponent(match[1])))
      if (url.pathname.startsWith('/api/')) throw new ApiError(404, 'Rota não encontrada.')
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new ApiError(405, 'Método não permitido.')
      const file = resolve(base, '.' + decodeURIComponent(url.pathname))
      if (file !== base && !file.startsWith(base + sep)) throw new ApiError(404, 'Arquivo não encontrado.')
      const target = url.pathname === '/' ? resolve(base, 'index.html') : file
      let contents
      try { contents = await readFile(target) }
      catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') throw new ApiError(404, 'Interface não encontrada. Execute npm run build ou use npm run dev.')
        throw error
      }
      res.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream' })
      res.end(req.method === 'HEAD' ? undefined : contents)
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500
      if (status === 500) console.error(error)
      if (!res.headersSent) json(res, status, { error: status === 500 ? 'Não foi possível acessar o banco. Tente novamente.' : error.message })
    }
  })
}
