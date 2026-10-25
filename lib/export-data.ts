export const PERSISTED_STATE_KEYS = [
  'schemaVersion', 'goals', 'daily', 'meals', 'mealLogs', 'foods', 'supplements',
  'workoutLogs', 'reinforcementLogs', 'endurance', 'variantChoices', 'goalHistory', 'calendarOverrides',
] as const

export type ExportableState = Record<string, unknown> & { schemaVersion?: number }

export function createExportPayload(data: ExportableState, exportedAt = new Date().toISOString(), startDate = '2026-08-30') {
  const missing = PERSISTED_STATE_KEYS.filter(key => !(key in data))
  if (missing.length) throw new Error(`Cannot export incomplete app data: ${missing.join(', ')}`)
  return {
    ...structuredClone(data),
    exportFormat: 'road-to-ironman',
    exportManifest: {
      formatVersion: 1,
      appDataVersion: data.schemaVersion ?? 4,
      includedSections: [...PERSISTED_STATE_KEYS],
      exportedAt,
    },
    exportedAt,
    program: { name: 'Road to Ironman', startDate, cycleLengthDays: 7 },
  }
}
