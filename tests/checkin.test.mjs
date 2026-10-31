import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCheckIn } from '../lib/checkin.ts'

const emptyDraft = { weight: '', sleep: '', shoulder: '', ankle: '', back: '', notes: '' }

test('rejects an empty check-in so it cannot be locked without data', () => {
  assert.match(validateCheckIn(emptyDraft), /at least one check-in value/)
})

test('accepts a valid partial check-in and decimal commas', () => {
  assert.equal(validateCheckIn({ ...emptyDraft, weight: '70,5', sleep: '7,5' }), null)
})

test('rejects out-of-range sleep and pain values', () => {
  assert.match(validateCheckIn({ ...emptyDraft, sleep: '25' }), /between 0 and 24/)
  assert.match(validateCheckIn({ ...emptyDraft, shoulder: '11' }), /between 0 and 10/)
})

test('rejects invalid weight values', () => {
  assert.match(validateCheckIn({ ...emptyDraft, weight: '0' }), /greater than 0/)
  assert.match(validateCheckIn({ ...emptyDraft, weight: 'abc' }), /valid numbers/)
})
