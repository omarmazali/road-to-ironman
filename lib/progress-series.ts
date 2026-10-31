export type ProgressValuePoint = { value: number | null }

/** Keep each contiguous run of measurements separate so charts never bridge missing periods. */
export function splitProgressSegments<T extends ProgressValuePoint>(points: T[]): Array<Array<T & { value: number }>> {
  const segments: Array<Array<T & { value: number }>> = []
  let current: Array<T & { value: number }> = []

  for (const point of points) {
    if (point.value === null || !Number.isFinite(point.value)) {
      if (current.length) segments.push(current)
      current = []
      continue
    }
    current.push(point as T & { value: number })
  }

  if (current.length) segments.push(current)
  return segments
}
