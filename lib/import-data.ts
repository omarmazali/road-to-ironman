import { PERSISTED_STATE_KEYS } from './export-data.ts'

const CURRENT_SCHEMA_VERSION = 4
const LEGACY_KEYS = new Set([
  ...PERSISTED_STATE_KEYS,
  'weightHistory',
  'rehabLogs',
])
const ARRAY_KEYS = ['meals', 'foods', 'workoutLogs', 'reinforcementLogs', 'rehabLogs', 'endurance']
const OBJECT_KEYS = [
  'goals', 'daily', 'weightHistory', 'mealLogs', 'supplements', 'variantChoices',
  'goalHistory', 'calendarOverrides',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validate an imported JSON payload before it can replace the current local data. */
export function validateImportPayload(value: unknown): { valid: boolean; error?: string } {
  if (!isRecord(value)) return { valid: false, error: 'The file must contain a JSON object.' }

  if (value.exportFormat !== undefined && value.exportFormat !== 'road-to-ironman') {
    return { valid: false, error: 'This file was not exported by Road to Ironman.' }
  }

  if (typeof value.schemaVersion === 'number' && value.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { valid: false, error: 'This backup was created by a newer app version.' }
  }

  const isAppExport = value.exportFormat === 'road-to-ironman'
  const hasRecognizedData = Object.keys(value).some(key => key !== 'schemaVersion' && LEGACY_KEYS.has(key))
  if (!isAppExport && !hasRecognizedData) {
    return { valid: false, error: 'No Road to Ironman data was found in this file.' }
  }

  if (isAppExport) {
    const missing = PERSISTED_STATE_KEYS.filter(key => !(key in value))
    if (missing.length) return { valid: false, error: `The backup is incomplete (${missing.join(', ')}).` }
  }

  for (const key of ARRAY_KEYS) {
    if (key in value && !Array.isArray(value[key])) {
      return { valid: false, error: `The “${key}” section must be a list.` }
    }
  }
  for (const key of OBJECT_KEYS) {
    if (key in value && !isRecord(value[key])) {
      return { valid: false, error: `The “${key}” section must be an object.` }
    }
  }

  for (const key of ['workoutLogs', 'reinforcementLogs', 'rehabLogs', 'endurance']) {
    const rows = value[key]
    if (!Array.isArray(rows)) continue
    for (const [index, row] of rows.entries()) {
      if (!isRecord(row) || typeof row.date !== 'string' || !isValidDate(row.date)) {
        return { valid: false, error: `The “${key}” entry ${index + 1} needs a valid date. No data was imported.` }
      }
    }
  }

  return { valid: true }
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
