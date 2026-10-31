import assert from 'node:assert/strict'
import test from 'node:test'
import { isStrengthSessionComplete, summarizePlannedSessions } from '../lib/training-consistency.ts'

const definitions = [
  { key: 'bench_press_horizontal', sessions: ['Upper A'], material: 'variant' },
  { key: 'chest_supported_row', sessions: ['Upper A'], material: 'machine' },
]
const requiredSets = definition => definition.key === 'bench_press_horizontal' ? 3 : 2
const planned = [{ date: '2026-10-25', kind: 'strength', session: 'Upper A' }]

test('a partial strength log remains incomplete but is counted as in progress', () => {
  const logs = [{ date: '2026-10-25', session: 'Upper A', exerciseKey: 'bench_press_horizontal', variant: 'smith', set: 1 }]
  const complete = isStrengthSessionComplete(logs, definitions, '2026-10-25', 'Upper A', requiredSets)
  const counts = summarizePlannedSessions(planned, logs, [], () => complete)

  assert.equal(complete, false)
  assert.deepEqual(counts, { completed: 0, inProgress: 1 })
})

test('a full strength session counts as completed and leaves no in-progress session', () => {
  const logs = [
    ...[1, 2, 3].map(set => ({ date: '2026-10-25', session: 'Upper A', exerciseKey: 'bench_press_horizontal', variant: 'smith', set })),
    ...[1, 2].map(set => ({ date: '2026-10-25', session: 'Upper A', exerciseKey: 'chest_supported_row', set })),
  ]
  const complete = isStrengthSessionComplete(logs, definitions, '2026-10-25', 'Upper A', requiredSets)
  const counts = summarizePlannedSessions(planned, logs, [], () => complete)

  assert.equal(complete, true)
  assert.deepEqual(counts, { completed: 1, inProgress: 0 })
})

test('an endurance session completes only when its type and date match the plan', () => {
  const endurancePlan = [
    { date: '2026-10-25', kind: 'endurance', activity: 'Natation' },
    { date: '2026-10-26', kind: 'endurance', activity: 'Course' },
  ]
  const logs = [
    { date: '2026-10-25', type: 'Course' },
    { date: '2026-10-26', type: 'Natation' },
    { date: '2026-10-26', type: 'Course' },
  ]

  assert.deepEqual(summarizePlannedSessions(endurancePlan, [], logs, () => false), { completed: 1, inProgress: 0 })
})

test('unplanned logs and duplicate entries do not inflate planned session totals', () => {
  const onePlannedRun = [{ date: '2026-10-25', kind: 'endurance', activity: 'Course' }]
  const logs = [
    { date: '2026-10-24', type: 'Course' },
    { date: '2026-10-25', type: 'Course' },
    { date: '2026-10-25', type: 'Course' },
  ]

  assert.deepEqual(summarizePlannedSessions(onePlannedRun, [], logs, () => false), { completed: 1, inProgress: 0 })
})
