import assert from 'node:assert/strict'
import test from 'node:test'
import { splitProgressSegments } from '../lib/progress-series.ts'

test('splits the curve at periods without measurements', () => {
  const segments = splitProgressSegments([
    { label: 'W1', value: 70 },
    { label: 'W2', value: 69.8 },
    { label: 'W3', value: null },
    { label: 'W4', value: 69.5 },
  ])

  assert.deepEqual(segments.map(segment => segment.map(point => point.label)), [['W1', 'W2'], ['W4']])
})

test('keeps an empty series empty and ignores non-finite measurements', () => {
  assert.deepEqual(splitProgressSegments([]), [])
  assert.deepEqual(splitProgressSegments([{ label: 'W1', value: Number.NaN }]), [])
})
