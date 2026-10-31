export type CheckInDraft = {
  weight: string | number | null | undefined
  sleep: string | number | null | undefined
  shoulder: string | number | null | undefined
  ankle: string | number | null | undefined
  back: string | number | null | undefined
  notes: string
}

function optionalNumber(value: string | number | null | undefined): number | null | undefined {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Require a meaningful check-in and reject malformed values before the day is locked. */
export function validateCheckIn(draft: CheckInDraft): string | null {
  const values = {
    weight: optionalNumber(draft.weight),
    sleep: optionalNumber(draft.sleep),
    shoulder: optionalNumber(draft.shoulder),
    ankle: optionalNumber(draft.ankle),
    back: optionalNumber(draft.back),
  }

  if (Object.values(values).some(value => value === undefined)) return 'Enter valid numbers for the check-in.'
  if (values.weight !== null && values.weight !== undefined && values.weight <= 0) return 'Weight must be greater than 0.'
  if (values.sleep !== null && values.sleep !== undefined && (values.sleep < 0 || values.sleep > 24)) return 'Sleep must be between 0 and 24 hours.'
  if ([values.shoulder, values.ankle, values.back].some(value => value !== null && value !== undefined && (value < 0 || value > 10))) {
    return 'Pain scores must be between 0 and 10.'
  }
  const hasValue = Object.values(values).some(value => value !== null && value !== undefined) || draft.notes.trim().length > 0
  return hasValue ? null : 'Add at least one check-in value before saving.'
}
