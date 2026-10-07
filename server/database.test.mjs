import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, unlink, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase, getDashboard, createJob, deleteJob } from './database.mjs'
import { createApp } from './app.mjs'

const input = { fileName: 'suporte_camera.gcode', printer: 'Ender 3 Pro', hours: 1, minutes: 30 }
function memory(t) {
  const db = openDatabase(':memory:')
  t.after(() => db.close())
  return db
}

test('a carga SQL inicial fornece todas as colunas, impressoras e reservas', (t) => {
  const db = memory(t)
  const state = getDashboard(db)
  assert.equal(state.queuedJobs.length, 3)
  assert.equal(state.producingJobs.length, 2)
  assert.equal(state.verifyJobs.length, 2)
  assert.equal(state.printersOnline, 3)
  assert.equal(state.printerTimelines.flatMap((p) => p.blocks).length, 5)
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0)
})

test('o cadastro e a exclusão continuam gravados após reabrir o banco, sem repetir exemplos', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'printing-sql-test-'))
  const file = join(dir, 'test.sqlite')
  let db
  try {
    db = openDatabase(file)
    const { id } = createJob(db, input)
    const original = getDashboard(db)
    db.close(); db = openDatabase(file)
    assert.deepEqual(getDashboard(db), original)
    deleteJob(db, id)
    deleteJob(db, 'q1')
    db.close(); db = openDatabase(file)
    const after = getDashboard(db)
    assert.equal(after.queuedJobs.length, 2)
    assert.ok(!after.printerTimelines.flatMap((p) => p.blocks).some((b) => b.id === id || b.id === 'q1'))
  } finally {
    db?.close()
    for (const suffix of ['', '-wal', '-shm']) await unlink(file + suffix).catch((error) => { if (error.code !== 'ENOENT') throw error })
    await rmdir(dir)
  }
})

test('validação rejeita entradas inválidas sem modificar o banco', (t) => {
  const db = memory(t)
  const before = getDashboard(db)
  for (const invalid of [null, [], { ...input, hours: -1 }, { ...input, hours: 1.5 }, { ...input, hours: '1' }, { ...input, minutes: 60 }, { ...input, hours: 0, minutes: 0 }, { ...input, fileName: '   ' }, { ...input, fileName: 'a'.repeat(256) }, { ...input, printer: 'Inexistente' }]) {
    assert.throws(() => createJob(db, invalid), { status: 400 })
    assert.deepEqual(getDashboard(db), before)
  }
  assert.throws(() => deleteJob(db, 'inexistente'), { status: 404 })
  assert.deepEqual(getDashboard(db), before)
})

test('consultas parametrizadas armazenam texto com SQL como dado', (t) => {
  const db = memory(t)
  const name = "teste'); DROP TABLE printers; --.gcode"
  const { id, dashboard } = createJob(db, { ...input, fileName: name })
  assert.equal(dashboard.queuedJobs.find((j) => j.id === id).fileName, name)
  assert.equal(db.prepare('SELECT count(*) AS n FROM printers').get().n, 3)
})

test('reservas são recalculadas no servidor, sem sobreposição, e filas longas ficam sem horário', (t) => {
  const db = memory(t)
  const staleInput = { ...input, suggestedSlot: { startHour: 8, endHour: 9.5 } }
  const first = createJob(db, staleInput)
  const second = createJob(db, staleInput)
  const blocks = second.dashboard.printerTimelines[0].blocks
  const a = blocks.find((b) => b.id === first.id)
  const b = blocks.find((block) => block.id === second.id)
  assert.ok(a && b)
  assert.ok(a.endHour <= b.startHour || b.endHour <= a.startHour)
  assert.throws(() => db.prepare('INSERT INTO timeline_blocks (id, printer_id, label, start_minute, end_minute, color) VALUES (?, ?, ?, ?, ?, ?)').run('conflict', 't1', 'teste', 480, 500, 'rust'), /Horário já ocupado/)
  const long = createJob(db, { ...input, hours: 25, minutes: 0 })
  assert.equal(long.dashboard.queuedJobs.find((j) => j.id === long.id).scheduledSlot, undefined)
  assert.ok(!long.dashboard.printerTimelines.flatMap((p) => p.blocks).some((b) => b.id === long.id))
})

test('remover trabalhos das três etapas também remove suas reservas vinculadas', (t) => {
  const db = memory(t)
  for (const id of ['q2', 'p1', 'v1']) {
    const after = deleteJob(db, id)
    assert.ok(![...after.queuedJobs, ...after.producingJobs, ...after.verifyJobs].some((j) => j.id === id))
    assert.equal(db.prepare('SELECT count(*) AS n FROM timeline_blocks WHERE job_id = ?').get(id).n, 0)
  }
  assert.equal(db.prepare('SELECT count(*) AS n FROM timeline_blocks WHERE id = ?').get('b4').n, 1)
})

test('API HTTP integra leitura, cadastro, exclusão e respostas de erro', async (t) => {
  const db = memory(t)
  const app = createApp(db, { staticDir: join(tmpdir(), 'printing-missing-dist-' + Date.now()) })
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => { app.close(resolve); app.closeAllConnections() }))
  const url = 'http://127.0.0.1:' + app.address().port
  const post = (body) => fetch(url + '/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  assert.deepEqual(await fetch(url + '/api/health').then((r) => r.json()), { status: 'ok', database: 'sqlite' })
  assert.equal((await fetch(url + '/api/dashboard').then((r) => r.json())).queuedJobs.length, 3)
  const response = await post(JSON.stringify(input))
  assert.equal(response.status, 201)
  const created = await response.json()
  assert.equal(created.dashboard.queuedJobs.length, 4)
  const deleted = await fetch(url + '/api/jobs/' + created.id, { method: 'DELETE' })
  assert.equal(deleted.status, 200)
  assert.equal((await deleted.json()).queuedJobs.length, 3)
  assert.equal((await fetch(url + '/api/jobs/' + created.id, { method: 'DELETE' })).status, 404)
  assert.equal((await post('{broken')).status, 400)
  assert.equal((await post(JSON.stringify({ ...input, minutes: -2 }))).status, 400)
  assert.equal((await fetch(url + '/api/jobs', { method: 'POST', body: 'plain' })).status, 415)
  assert.equal((await post(JSON.stringify({ fileName: 'a'.repeat(17000) }))).status, 413)
  assert.equal((await fetch(url + '/api/missing')).status, 404)
  assert.equal((await fetch(url + '/')).status, 404)
})
