type StrengthDefinition = { key: string; sessions?: string[]; material?: string }
type WorkoutLog = { date: string; session?: string; exerciseKey: string; variant?: string }
type PlannedSession = { date: string; kind: 'strength' | 'endurance'; session?: string; activity?: string }
type EnduranceLog = { date: string; type: string }

export function isStrengthSessionComplete(
  logs: WorkoutLog[],
  definitions: StrengthDefinition[],
  date: string,
  session: string,
  requiredSets: (definition: StrengthDefinition, session: string) => number,
) {
  const sessionDefinitions = definitions.filter(definition => definition.sessions?.includes(session))
  return sessionDefinitions.length > 0 && sessionDefinitions.every(definition => {
    const rows = logs.filter(log => log.date === date && log.session === session && log.exerciseKey === definition.key)
    if (definition.material === 'variant') {
      const variants = [...new Set(rows.map(row => row.variant).filter((variant): variant is string => Boolean(variant && variant !== 'legacy')))]
      return variants.some(variant => rows.filter(row => row.variant === variant).length >= requiredSets(definition, session))
    }
    return rows.length >= requiredSets(definition, session)
  })
}

export function summarizePlannedSessions(
  planned: PlannedSession[],
  workoutLogs: WorkoutLog[],
  enduranceLogs: EnduranceLog[],
  isStrengthComplete: (date: string, session: string) => boolean,
) {
  const isComplete = (item: PlannedSession) => item.kind === 'strength'
    ? isStrengthComplete(item.date, item.session || '')
    : enduranceLogs.some(log => log.date === item.date && log.type === item.activity)
  const completed = planned.filter(isComplete).length
  const inProgress = planned.filter(item => item.kind === 'strength'
    && !isComplete(item)
    && workoutLogs.some(log => log.date === item.date && log.session === item.session)).length
  return { completed, inProgress }
}
