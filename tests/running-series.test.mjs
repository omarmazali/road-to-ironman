import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateRunningPeriods } from '../lib/running-series.ts'

const periods = [
  { label: 'W1', start: '2026-10-05', end: '2026-10-11' },
  { label: 'W2', start: '2026-10-12', end: '2026-10-18' },
]

test('aggregates weekly running distance and distance-weighted pace together', () => {
  const points = aggregateRunningPeriods(periods, [
    { date: '2026-10-06', distanceKm: 5, durationMin: 30 },
    { date: '2026-10-10', distanceKm: 2, durationMin: 10 },
    { date: '2026-10-15', distanceKm: 4, durationMin: 20 },
  ])

  assert.deepEqual(points, [
    { label: 'W1', distanceKm: 7, paceMinPerKm: 40 / 7 },
    { label: 'W2', distanceKm: 4, paceMinPerKm: 5 },
  ])
})

test('keeps logged distance when duration is absent and leaves pace unavailable', () => {
  const [point] = aggregateRunningPeriods([periods[0]], [{ date: '2026-10-08', distanceKm: 3.2 }])
  assert.deepEqual(point, { label: 'W1', distanceKm: 3.2, paceMinPerKm: null })
})

test('leaves empty periods blank and ignores entries outside the selected periods', () => {
  const points = aggregateRunningPeriods(periods, [{ date: '2026-10-20', distanceKm: 8, durationMin: 42 }])
  assert.deepEqual(points, [
    { label: 'W1', distanceKm: null, paceMinPerKm: null },
    { label: 'W2', distanceKm: null, paceMinPerKm: null },
  ])
})
