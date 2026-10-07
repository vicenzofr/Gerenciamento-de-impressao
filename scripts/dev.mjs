import { spawn } from 'node:child_process'

const children = []
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) child.kill()
}
for (const file of ['server/index.mjs', 'node_modules/vite/bin/vite.js']) {
  const child = spawn(process.execPath, [file], { stdio: 'inherit', env: process.env, windowsHide: true })
  children.push(child)
  child.on('error', (error) => { console.error(error); stop(1) })
  child.on('exit', (code) => { if (!stopping) stop(code ?? 1) })
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
