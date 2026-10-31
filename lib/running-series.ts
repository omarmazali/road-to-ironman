export type RunningPeriod = { label: string; start: string; end: string }
export type RunningEntry = { date: string; distanceKm?: number | null; durationMin?: number | null }
export type RunningPoint = { label: string; distanceKm: number | null; paceMinPerKm: number | null }

/** Aggregate running volume and distance-weighted pace for each chart period. */
export function aggregateRunningPeriods(periods: RunningPeriod[], entries: RunningEntry[]): RunningPoint[] {
  return periods.map(period => {
    const runs = entries.filter(entry => entry.date >= period.start && entry.date <= period.end)
    const distanceRuns = runs.filter(run => Number.isFinite(run.distanceKm) && (run.distanceKm ?? 0) > 0)
    const distanceKm = distanceRuns.length
      ? distanceRuns.reduce((total, run) => total + (run.distanceKm ?? 0), 0)
      : null
    const timedRuns = distanceRuns.filter(run => Number.isFinite(run.durationMin) && (run.durationMin ?? 0) > 0)
    const timedDistance = timedRuns.reduce((total, run) => total + (run.distanceKm ?? 0), 0)
    const timedDuration = timedRuns.reduce((total, run) => total + (run.durationMin ?? 0), 0)

    return {
      label: period.label,
      distanceKm,
      paceMinPerKm: timedDistance > 0 ? timedDuration / timedDistance : null,
    }
  })
}
