import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { validateImportPayload } from '../lib/import-data.ts'

const fixture = JSON.parse(await readFile(new URL('./fixtures/e2e-export.json', import.meta.url), 'utf8'))

test('accepts a legacy V59-shaped export with known data sections', () => {
  assert.deepEqual(validateImportPayload(fixture), { valid: true })
})

test('rejects empty or unrelated JSON before it can replace app data', () => {
  assert.equal(validateImportPayload({}).valid, false)
  assert.equal(validateImportPayload({ schemaVersion: 4 }).valid, false)
  assert.equal(validateImportPayload({ preferences: { theme: 'dark' } }).valid, false)
})

test('rejects malformed sections and incomplete current-format backups', () => {
  assert.match(validateImportPayload({ daily: [] }).error, /must be an object/)
  assert.match(validateImportPayload({ workoutLogs: {} }).error, /must be a list/)
  assert.match(validateImportPayload({ exportFormat: 'road-to-ironman', schemaVersion: 4 }).error, /incomplete/)
})

test('rejects backups from an unsupported newer app version', () => {
  assert.match(validateImportPayload({ schemaVersion: 5, goals: {} }).error, /newer app version/)
})

test('rejects training records without a real date instead of assigning them to today', () => {
  assert.match(validateImportPayload({ endurance: [{ type: 'Course', distanceKm: 5 }] }).error, /needs a valid date/)
  assert.match(validateImportPayload({ workoutLogs: [{ date: '2026-02-30' }] }).error, /needs a valid date/)
})
