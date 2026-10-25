/**
 * Compatibility exports for code that used the original prototype data module.
 * The canonical program data now lives in `lib/program.ts`.
 */
export { PROGRAM_DEFS, REINFORCEMENT_DEFS, REINFORCEMENT_PLAN, CYCLE, LOADS, START_DATE } from './program'

export type SetEntry = {
  id: string
  weight: number
  reps: number
  rir: number
  painDuring: number
}

export type WorkoutLog = SetEntry & {
  date: string
  session: string
  exerciseKey: string
  displayName: string
  variant?: 'smith' | 'dumbbell' | 'legacy'
}

export type EnduranceLog = {
  id: string
  date: string
  type: 'Course' | 'Natation' | 'Vélo' | 'Cyclisme' | 'Bike' | 'Triathlon' | 'Autre'
  distanceKm: number
  durationMin: number
  rpe: number
  pain: number
}
