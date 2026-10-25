import assert from 'node:assert/strict'
import test from 'node:test'
import { createExportPayload, PERSISTED_STATE_KEYS } from '../lib/export-data.ts'

const stateFixture = {
  schemaVersion: 4,
  goals: { startWeight: 69, midWeight: 74, targetWeight: 80, calTarget: 3200, proteinTarget: 140 },
  daily: { '2026-10-25': { weight: 70, sleep: 7.5, shoulder: 1, ankle: 0, back: 0, notes: 'fixture', saved: true } },
  meals: [{ id: 'meal-1', name: 'Breakfast', ingredients: [{ foodId: 'oats', grams: 60, unit: 'g', kcal100: 370, p100: 13 }] }],
  mealLogs: { '2026-10-25': { breakfast: { mealId: 'meal-1', snapshot: { name: 'Breakfast', kcal: 222, p: 7.8 } } } },
  foods: [{ id: 'food-1', name: 'Oats', kcal100: 370, p100: 13, c100: 62, f100: 7 }],
  supplements: { items: [{ id: 'supp-1', name: 'Creatine', dose: '5', unit: 'g' }], logs: { '2026-10-25': { 'supp-1': true } } },
  workoutLogs: [{ id: 'set-1', date: '2026-10-25', exerciseKey: 'bench_press_horizontal', weight: 25, reps: 10, rir: 2 }],
  reinforcementLogs: [{ id: 'rehab-1', date: '2026-10-25', exerciseKey: 'external_rotation', actualValue: 12, resistance: 2.5 }],
  endurance: [{ id: 'run-1', date: '2026-10-25', type: 'Course', distanceKm: 5, durationMin: 29.5 }],
  variantChoices: { '2026-10-25|Upper A|bench_press_horizontal': 'smith' },
  goalHistory: { roadmap_run5: { achieved: true, date: '2026-10-25' } },
  calendarOverrides: { '2026-10-26': { endurance: 'Course' } },
  futureExtension: { retained: true },
}

test('JSON export contains every persisted section and round-trips all nested records', () => {
  const exportedAt = '2026-10-25T12:00:00.000Z'
  const payload = createExportPayload(stateFixture, exportedAt, '2026-08-30')
  const restored = JSON.parse(JSON.stringify(payload))

  assert.deepEqual(payload.exportManifest.includedSections, PERSISTED_STATE_KEYS)
  assert.equal(payload.exportManifest.formatVersion, 1)
  assert.equal(payload.exportManifest.appDataVersion, stateFixture.schemaVersion)
  assert.equal(payload.exportedAt, exportedAt)
  assert.equal(payload.program.startDate, '2026-08-30')
  for (const key of PERSISTED_STATE_KEYS) assert.deepEqual(restored[key], stateFixture[key], `${key} must survive JSON export/import`)
  assert.deepEqual(restored.futureExtension, stateFixture.futureExtension, 'future data fields must also be retained')
})

test('export refuses to silently omit a persisted section', () => {
  const incomplete = { ...stateFixture }
  delete incomplete.reinforcementLogs
  assert.throws(() => createExportPayload(incomplete), /reinforcementLogs/)
})
