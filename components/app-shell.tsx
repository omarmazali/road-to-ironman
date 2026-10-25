'use client'

import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from 'react'
import {
  Activity, AlertCircle, Beef, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Droplets, Dumbbell,
  FileUp, Flag, Flame, History, LayoutDashboard, Plus, RefreshCw, Salad, Save, Sparkles,
  Target, Trash2, Waves, Weight, Wheat, X, Pencil,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { CYCLE, LOADS, PROGRAM_DEFS, REINFORCEMENT_DEFS, REINFORCEMENT_PLAN, START_DATE } from '@/lib/program'
import { createExportPayload } from '@/lib/export-data'
import { isStrengthSessionComplete as isFullStrengthSessionComplete, summarizePlannedSessions } from '@/lib/training-consistency'

const STORAGE_KEY = 'roadToTriathlonV3'
const tabs = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Salad },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'history', label: 'History', icon: History },
]
const slots = [
  { id: 'breakfast', label: 'Breakfast' }, { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' }, { id: 'snack', label: 'Snacks' },
]
const defaultSupplements = [
  { id: 'creatine', name: 'Créatine', dose: '5', unit: 'g' },
  { id: 'whey', name: 'Whey', dose: '30', unit: 'g' },
  { id: 'omega3', name: 'Oméga-3', dose: '', unit: '' },
  { id: 'collagen', name: 'Collagène', dose: '12', unit: 'g' },
  { id: 'vitC', name: 'Vitamine C', dose: '5', unit: 'g' },
]

// Local starter catalog, with typical values per 100 g. Product labels take priority for packaged foods.
const DEFAULT_FOODS: AnyRow[] = [
  { id: 'food-oats', name: 'Flocons d’avoine', kcal100: 389, p100: 16.9, c100: 66.3, f100: 6.9 },
  { id: 'food-rice-dry', name: 'Riz blanc (cru)', kcal100: 365, p100: 7.1, c100: 80, f100: 0.7 },
  { id: 'food-rice-cooked', name: 'Riz blanc (cuit)', kcal100: 130, p100: 2.7, c100: 28.2, f100: 0.3 },
  { id: 'food-chicken', name: 'Blanc de poulet (cru)', kcal100: 120, p100: 22.5, c100: 0, f100: 2.6 },
  { id: 'food-egg', name: 'Œuf entier', kcal100: 143, p100: 12.6, c100: 0.7, f100: 9.5 },
  { id: 'food-banana', name: 'Banane', kcal100: 89, p100: 1.1, c100: 22.8, f100: 0.3 },
  { id: 'food-greek-yogurt', name: 'Yaourt grec 0 %', kcal100: 59, p100: 10.3, c100: 3.6, f100: 0.4 },
  { id: 'food-milk', name: 'Lait entier', unit: 'ml', kcal100: 61, p100: 3.2, c100: 4.8, f100: 3.3 },
  { id: 'food-olive-oil', name: 'Huile d’olive', kcal100: 884, p100: 0, c100: 0, f100: 100 },
  { id: 'food-pasta', name: 'Pâtes (cuites)', kcal100: 158, p100: 5.8, c100: 30.9, f100: 0.9 },
  { id: 'food-salmon', name: 'Saumon', kcal100: 208, p100: 20.4, c100: 0, f100: 13.4 },
  { id: 'food-bread', name: 'Pain complet', kcal100: 247, p100: 13, c100: 41, f100: 4.2 },
  { id: 'food-potato', name: 'Pomme de terre (bouillie)', kcal100: 87, p100: 1.9, c100: 20.1, f100: 0.1 },
  { id: 'food-peanut-butter', name: 'Beurre de cacahuète', kcal100: 588, p100: 25, c100: 20, f100: 50 },
  { id: 'food-whey', name: 'Whey en poudre (valeur indicative)', kcal100: 400, p100: 80, c100: 8, f100: 6 },
  { id: 'food-almonds', name: 'Amandes', kcal100: 579, p100: 21.2, c100: 21.6, f100: 49.9 },
]

type AnyRow = Record<string, any>
type Mutate = (fn: (draft: AnyRow) => void) => void

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + amount)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function mondayOf(date: string) {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatDate(date: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', options)
}
function n(value: any, fallback: number | null = null): number | null {
  if (value === null || value === undefined || value === '') return fallback
  const num = Number(String(value).replace(',', '.'))
  return Number.isFinite(num) ? num : fallback
}
function fmt(value: any, digits = 1) {
  const num = n(value)
  return num === null ? '—' : num.toFixed(digits).replace('.', ',')
}
function uid() { return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}` }
function safeSlug(value: any) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') }
const legacyExerciseAliases: Record<string, string> = {
  chest_press_developpe_couche: 'bench_press_horizontal',
  tirage_vertical_prise_neutre: 'neutral_grip_lat_pulldown',
  rowing_poitrine_supportee: 'chest_supported_row',
  rowing_poulie: 'cable_row_high_chest',
  elevation_laterale_amplitude_confortable: 'cable_lateral_raise_unilateral',
  presse: 'leg_press', leg_curl: 'legacy_leg_curl', calf_raise: 'standing_calf_raise',
}
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function baseState(): AnyRow {
  return {
    schemaVersion: 4,
    goals: { startWeight: 69, midWeight: 74, targetWeight: 80, calTarget: 3200, proteinTarget: 140 },
    daily: {}, meals: [], mealLogs: {}, foods: [],
    supplements: { items: clone(defaultSupplements), logs: {} },
    workoutLogs: [], reinforcementLogs: [], endurance: [], variantChoices: {}, goalHistory: {}, calendarOverrides: {},
  }
}
function normalizeState(source: AnyRow): AnyRow {
  const fresh = baseState()
  const s: AnyRow = { ...fresh, ...source }
  s.goals = { ...fresh.goals, ...(source.goals || {}) }
  s.daily = source.daily || source.weightHistory || {}
  s.meals = Array.isArray(source.meals) ? source.meals.map((meal: AnyRow) => ({ ...meal, id: meal.id || uid(), name: meal.name || 'Meal', kcal: n(meal.kcal, 0) || 0, p: n(meal.p ?? meal.protein, 0) || 0, c: n(meal.c ?? meal.carbs, 0) || 0, f: n(meal.f ?? meal.fat, 0) || 0, note: meal.note || '', ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.map((item: AnyRow) => ({ ...item, id: item.id || uid(), grams: n(item.grams, 0) || 0, unit: item.unit === 'ml' ? 'ml' : 'g', kcal100: n(item.kcal100, 0) || 0, p100: n(item.p100, 0) || 0, c100: n(item.c100, 0) || 0, f100: n(item.f100, 0) || 0 })) : [] })) : []
  s.foods = Array.isArray(source.foods) ? source.foods.map((food: AnyRow) => ({ ...food, id: food.id || uid(), name: food.name || 'Food', kcal100: n(food.kcal100, 0) || 0, p100: n(food.p100, 0) || 0, c100: n(food.c100, 0) || 0, f100: n(food.f100, 0) || 0 })) : []
  s.mealLogs = source.mealLogs || {}
  s.supplements = { ...fresh.supplements, ...(source.supplements || {}) }
  s.supplements.items = s.supplements.items || clone(defaultSupplements)
  s.supplements.logs = s.supplements.logs || {}
  s.workoutLogs = (source.workoutLogs || []).map((x: AnyRow, i: number) => {
    const rawKey = String(x.exerciseKey || x.key || x.displayName || x.exercise || 'legacy_exercise')
    const slug = safeSlug(rawKey), mapped = legacyExerciseAliases[slug] || slug
    const def = PROGRAM_DEFS[mapped] || Object.values(PROGRAM_DEFS).find((item: AnyRow) => safeSlug(item.name) === slug) as AnyRow | undefined
    return {
      ...x, id: x.id || uid(), date: x.date || todayISO(), set: n(x.set, i + 1),
      exerciseKey: def?.key || mapped || rawKey, displayName: def?.name || x.displayName || x.exercise || 'Exercise',
      variant: x.variant || 'legacy', weight: n(x.weight, 0), reps: n(x.reps, 0), rir: n(x.rir, 0), painDuring: n(x.painDuring ?? x.pain, 0),
    }
  })
  s.reinforcementLogs = (source.reinforcementLogs || source.rehabLogs || []).map((x: AnyRow, i: number) => {
    const rawKey = String(x.exerciseKey || x.key || x.exercise || x.name || '')
    const def = REINFORCEMENT_DEFS[rawKey] || Object.values(REINFORCEMENT_DEFS).find((item: AnyRow) => item.key === rawKey || safeSlug(item.name) === safeSlug(rawKey)) as AnyRow | undefined
    return {
      ...x, id: x.id || uid(), date: x.date || todayISO(), set: n(x.set, i + 1), exerciseKey: def?.key || rawKey,
      exercise: def?.name || x.exercise || x.name || 'Reinforcement', mode: x.mode || def?.mode || 'reps', actualValue: n(x.actualValue ?? x.actual, 0),
      actualRaw: String(x.actualRaw ?? x.actual ?? ''), resistance: n(x.resistance, 0), pain: n(x.pain, 0),
    }
  })
  s.endurance = (source.endurance || []).map((x: AnyRow) => ({
    ...x, id: x.id || uid(), date: x.date || todayISO(), type: x.type || x.session || 'Course', session: x.session || x.type || 'Course',
    distanceKm: n(x.distanceKm ?? x.distance ?? x.km, 0), durationMin: n(x.durationMin ?? x.duration ?? x.minutes, 0), rpe: n(x.rpe, 0), pain: n(x.pain, 0), source: x.source || 'Manuel',
  }))
  s.variantChoices = source.variantChoices || {}
  s.goalHistory = source.goalHistory || {}
  s.calendarOverrides = source.calendarOverrides || {}
  // Normalize the original V59 daily export fields without fabricating measurements.
  for (const [date, entry0] of Object.entries(s.daily) as Array<[string, AnyRow]>) {
    const entry: AnyRow = entry0 && typeof entry0 === 'object' ? entry0 : { weight: entry0 }
    s.daily[date] = {
      ...entry,
      weight: n(entry.weight ?? entry.weightKg ?? entry.weight_kg ?? entry.poids ?? entry.poidsKg),
      sleep: n(entry.sleep ?? entry.sleepHours), shoulder: n(entry.shoulder ?? entry.shoulderPain),
      ankle: n(entry.ankle ?? entry.anklePain), back: n(entry.back ?? entry.backPain),
      notes: entry.notes || '', saved: Boolean(entry.saved) || n(entry.weight ?? entry.weightKg ?? entry.weight_kg ?? entry.poids ?? entry.poidsKg) !== null,
    }
  }
  // V59 exports may keep meal assignments as IDs; freeze nutrition snapshots so old days never change.
  for (const [date, bySlot] of Object.entries(s.mealLogs) as Array<[string, AnyRow]>) {
    const out: AnyRow = {}
    for (const [slot, assignment] of Object.entries(bySlot || {}) as Array<[string, AnyRow]>) {
      if (assignment && typeof assignment === 'object' && assignment.mealId && assignment.snapshot) out[slot] = assignment
      else {
        const mealId = assignment && typeof assignment === 'object' ? assignment.mealId : assignment
        const meal = s.meals.find((m: AnyRow) => m.id === mealId)
        if (meal) out[slot] = { mealId: meal.id, snapshot: snapshotMeal(meal) }
      }
    }
    s.mealLogs[date] = out
  }
  return s
}
function calculateIngredients(ingredients: AnyRow[] = []) {
  return ingredients.reduce((total, item) => {
    const grams = Math.max(0, n(item.grams, 0) || 0) / 100
    total.kcal += grams * (n(item.kcal100, 0) || 0)
    total.p += grams * (n(item.p100, 0) || 0)
    total.c += grams * (n(item.c100, 0) || 0)
    total.f += grams * (n(item.f100, 0) || 0)
    return total
  }, { kcal: 0, p: 0, c: 0, f: 0 })
}
function mealNutrition(meal: AnyRow) {
  if (Array.isArray(meal.ingredients) && meal.ingredients.length) return calculateIngredients(meal.ingredients)
  // Backward-compatible totals for meals imported from V59 before ingredient tracking existed.
  return { kcal: n(meal.kcal, 0) || 0, p: n(meal.p ?? meal.protein, 0) || 0, c: n(meal.c ?? meal.carbs, 0) || 0, f: n(meal.f ?? meal.fat, 0) || 0 }
}
function snapshotMeal(meal: AnyRow) {
  const totals = mealNutrition(meal)
  return { name: meal.name, kcal: totals.kcal, p: totals.p, c: totals.c, f: totals.f, note: meal.note || '', ingredients: clone(meal.ingredients || []) }
}
function currentProgramForDate(date: string) {
  const start = new Date(`${START_DATE}T12:00:00`).getTime()
  const current = new Date(`${date}T12:00:00`).getTime()
  const diff = Math.floor((current - start) / 86400000)
  const idx = ((diff % 7) + 7) % 7
  return { ...CYCLE[idx], cycleDay: idx + 1 }
}
function planForDate(date: string) {
  const p = currentProgramForDate(date)
  return { ...p, reinforcement: p.muscu ? (REINFORCEMENT_PLAN[p.muscu] || []) : [] }
}
function targetFor(def: AnyRow, session: string) { return def.targetBySession?.[session] || def.target || '1×8–12' }
function setCount(target: string) { return Number(String(target).match(/^\s*(\d+)/)?.[1] || 1) }
function rangeFor(target: string) {
  const nums = (String(target).match(/\d+(?:[.,]\d+)?/g) || []).map(x => Number(x.replace(',', '.')))
  return { min: nums.length > 1 ? nums[nums.length - 2] : nums[0] || 0, max: nums.length > 1 ? nums[nums.length - 1] : nums[0] || 0 }
}
function profileFor(def: AnyRow, variant?: string | null) {
  if (def.material === 'variant') return def.profile?.[variant === 'dumbbell' ? 'dumbbell' : 'smith'] || 'machine5'
  return typeof def.profile === 'string' ? def.profile : 'machine5'
}
function availableLoads(profile: string) { return LOADS[profile] || LOADS.machine5 }
function nextLoad(profile: string, current: number, direction: 1 | -1) {
  const values = availableLoads(profile)
  return direction > 0 ? (values.find((x: number) => x > current + 1e-8) ?? current) : ([...values].reverse().find((x: number) => x < current - 1e-8) ?? current)
}
function jumpAwareNextLoad(profile: string, current: number, direction: 1 | -1) {
  const candidate = nextLoad(profile, current, direction)
  if (direction > 0 && current > 0 && candidate > current && (candidate - current) / current > .2) return current
  return candidate
}
function strengthHistory(data: AnyRow, key: string, variant: string) {
  const groups: Record<string, AnyRow[]> = {}
  data.workoutLogs.filter((x: AnyRow) => x.exerciseKey === key && (variant ? x.variant === variant : true)).forEach((x: AnyRow) => (groups[x.date] ||= []).push(x))
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => ({ date, rows: rows.sort((a, b) => a.set - b.set) }))
}
function strengthRecommendation(data: AnyRow, def: AnyRow, variant: string, target: string) {
  const need = setCount(target), range = rangeFor(target)
  const last = strengthHistory(data, def.key, variant).filter(s => s.rows.length >= need).at(-1)
  if (!last) return null
  const rows = last.rows, maxWeight = Math.max(...rows.map(x => n(x.weight, 0) || 0))
  const avgRir = rows.reduce((a, x) => a + (n(x.rir, 0) || 0), 0) / rows.length
  const pain = Math.max(...rows.map(x => n(x.painDuring ?? x.pain, 0) || 0))
  const allTop = rows.every(x => (n(x.reps, 0) || 0) >= range.max)
  const allMin = rows.every(x => (n(x.reps, 0) || 0) >= range.min)
  const profile = profileFor(def, variant)
  if (pain >= 3) return { weight: nextLoad(profile, maxWeight, -1), min: range.min, max: range.max, symbol: '↓', direction: 'down', label: `Pain ${pain}/10 : reduce the load` }
  if (allTop && avgRir >= 2) {
    const candidate = nextLoad(profile, maxWeight, 1), jump = maxWeight === 0 ? Infinity : (candidate - maxWeight) / maxWeight
    if (candidate > maxWeight && jump <= .2) return { weight: candidate, min: range.min, max: range.max, symbol: '↑', direction: 'up', label: 'Top of range + RIR ≥ 2' }
    return { weight: maxWeight, min: range.min, max: range.max + 2, symbol: '↑', direction: 'up', label: 'Load jump too large — add reps first' }
  }
  if (!allMin) return { weight: nextLoad(profile, maxWeight, -1), min: range.min, max: range.max, symbol: '↓', direction: 'down', label: 'Below the rep minimum — reduce load' }
  return { weight: maxWeight, min: range.min, max: range.max, symbol: '—', direction: 'keep', label: 'Keep load and build reps' }
}
function reinforcementRecommendation(data: AnyRow, def: AnyRow) {
  const groups: Record<string, AnyRow[]> = {}
  data.reinforcementLogs.filter((x: AnyRow) => x.exerciseKey === def.key).forEach((x: AnyRow) => (groups[x.date] ||= []).push(x))
  const required = setCount(def.target)
  const last = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([date, rows]) => ({ date, rows: rows.sort((a, b) => a.set - b.set) })).filter(x => x.rows.length >= required).at(-1)
  if (!last) return null
  if (def.mode === 'test') return { symbol: '—', label: 'Specific follow-up test', mode: 'test', value: 0 }
  const rows = last.rows, range = reinforcementRange(def)
  const values = rows.map(x => n(x.actualValue, 0) || 0), avgValue = values.reduce((a, b) => a + b, 0) / values.length
  const maxResistance = Math.max(...rows.map(x => n(x.resistance, 0) || 0)), pain = Math.max(...rows.map(x => n(x.pain, 0) || 0))
  if (pain >= 3) {
    const lowered = def.resistanceAllowed ? nextLoad(def.profile || 'machine5', maxResistance, -1) : maxResistance
    if (def.resistanceAllowed && lowered < maxResistance) return { symbol: '↓', label: `Pain ${pain}/10: reduce resistance`, mode: 'load', value: lowered }
    const target = def.mode === 'time' ? Math.max(range.min, Math.floor(avgValue * .9 / 5) * 5) : Math.max(range.min, Math.floor(avgValue * .9))
    return { symbol: '↓', label: `Pain ${pain}/10: reduce the target`, mode: 'target', value: target }
  }
  const allTop = values.every(v => v >= range.max)
  if (allTop && def.resistanceAllowed) {
    const next = nextLoad(def.profile || 'machine5', maxResistance, 1), jump = maxResistance === 0 ? Infinity : (next - maxResistance) / maxResistance
    if (next > maxResistance && jump <= .2) return { symbol: '↑', label: 'Top of range — increase resistance', mode: 'load', value: next }
  }
  if (def.mode === 'time') return { symbol: '—', label: 'Maintain and progress duration', mode: 'target', value: Math.min(range.max, Math.max(range.min, Math.ceil(avgValue * 1.1 / 5) * 5)) }
  return { symbol: '—', label: 'Maintain and progress repetitions', mode: 'target', value: Math.min(range.max, Math.max(range.min, Math.ceil(avgValue * 1.1))) }
}

function totalNutrition(data: AnyRow, date: string) {
  const logs = data.mealLogs[date] || {}
  const entries = Object.values(logs) as AnyRow[]
  return entries.reduce((total, entry) => {
    const meal = entry?.snapshot || {}
    total.kcal += n(meal.kcal, 0) || 0; total.p += n(meal.p, 0) || 0; total.c += n(meal.c, 0) || 0; total.f += n(meal.f, 0) || 0
    return total
  }, { kcal: 0, p: 0, c: 0, f: 0 })
}
function recordedWeights(data: AnyRow) {
  return Object.entries(data.daily).filter(([, row]: [string, any]) => n(row.weight) !== null).map(([date, row]: [string, any]) => ({ date, weight: n(row.weight) as number })).sort((a, b) => a.date.localeCompare(b.date))
}
function weeklyAverages(data: AnyRow) {
  const groups: Record<string, number[]> = {}
  for (const row of recordedWeights(data)) (groups[mondayOf(row.date)] ||= []).push(row.weight)
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([week, vals]) => ({ week, average: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }))
}
function cardClass(extra = '') { return `glass rounded-[24px] p-5 sm:p-6 ${extra}` }
function cn(...items: Array<string | false | null | undefined>) { return items.filter(Boolean).join(' ') }

export default function AppShell() {
  const [tab, setTab] = useState('dashboard')
  const [selectedDate, setSelectedDate] = useState(START_DATE)
  const [currentDay, setCurrentDay] = useState(START_DATE)
  const [data, setData] = useState<AnyRow>(() => baseState())
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState('')
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const localToday = todayISO()
    setCurrentDay(localToday)
    setSelectedDate(localToday)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setData(normalizeState(JSON.parse(raw)))
    } catch (error) { console.error('Could not load saved training data', error) }
    setHydrated(true)
  }, [])
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [data, hydrated])
  useEffect(() => {
    const node = navRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)
    node?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [tab])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(id)
  }, [toast])
  useEffect(() => {
    let start: { x: number; y: number } | null = null
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || (e.target as HTMLElement).closest('input,select,textarea,button,[role="dialog"]')) { start = null; return }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onEnd = (e: TouchEvent) => {
      if (!start || e.changedTouches.length !== 1) return
      const dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y
      start = null
      if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      const index = tabs.findIndex(t => t.id === tab), next = index + (dx < 0 ? 1 : -1)
      if (next >= 0 && next < tabs.length) setTab(tabs[next].id)
    }
    window.addEventListener('touchstart', onStart, { passive: true }); window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [tab])

  const mutate: Mutate = (fn) => setData(prev => { const draft = clone(prev); fn(draft); return draft })
  const notify = (message: string) => setToast(message)
  const exportData = () => {
    const payload = createExportPayload(data, new Date().toISOString(), START_DATE)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href = url; a.download = `road-to-ironman-data-${todayISO()}.json`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 700)
    notify('Export JSON prepared')
  }
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return
    try {
      const incoming = JSON.parse(await file.text())
      if (!incoming || typeof incoming !== 'object') throw new Error('Invalid JSON')
      if (!window.confirm('Import replaces the current app data. Export a backup first if you need to keep it. Continue?')) { event.target.value = ''; return }
      const normalized = normalizeState(incoming)
      // Original V59 normalizes daily measurements using sleepHours / shoulderPain etc.
      setData(normalized)
      notify('Data imported successfully')
    } catch (error) { console.error(error); notify('Invalid or unsupported JSON file') }
    event.target.value = ''
  }
  const resetData = () => {
    if (!window.confirm('Delete all saved Road to Ironman data? This cannot be undone. Export first if needed.')) return
    setData(baseState()); setSelectedDate(todayISO()); setCurrentDay(todayISO()); notify('All local data reset')
  }
  const resetDemo = () => {
    if (!window.confirm('Reset to a clean starter state? Your current progress will be lost unless exported.')) return
    setData(baseState()); notify('Starter state restored')
  }
  
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><Brand /><div className="mt-1 pl-1 text-[11px] text-zinc-600">{formatDate(currentDay, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button onClick={exportData} className="glass inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/15"><Download size={15}/> Export</button>
            <label className="glass inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/15"><FileUp size={15}/> Import<input type="file" accept=".json,application/json" className="hidden" onChange={importData}/></label>
            <button onClick={resetDemo} className="glass inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-zinc-300 transition hover:border-white/15"><RefreshCw size={15}/> Reset</button>
          </div>
        </header>
        <nav ref={navRef} className="no-scrollbar sticky top-0 z-40 mt-5 flex justify-start gap-2 overflow-x-auto bg-[linear-gradient(var(--background)_76%,transparent)] py-3 backdrop-blur-xl sm:justify-center" aria-label="Main navigation">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} data-tab={id} onClick={() => setTab(id)} className={cn('flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition', tab === id ? 'border-[var(--accent)]/40 bg-[var(--accent)] text-black shadow-[0_0_35px_rgba(202,255,74,.12)]' : 'border-white/8 bg-white/[.03] text-zinc-400 hover:bg-white/[.06] hover:text-white')}><Icon size={16}/>{label}</button>)}
        </nav>
        <main className="mt-4 space-y-5">
          {!hydrated ? <div className={cardClass('py-16 text-center text-sm text-zinc-500')}>Loading your local training data…</div> : <>
            {tab === 'dashboard' && <DashboardView data={data} mutate={mutate} setTab={setTab} setDate={setSelectedDate} notify={notify} />}
            {tab === 'training' && <TrainingView data={data} mutate={mutate} date={selectedDate} setDate={setSelectedDate} notify={notify} />}
            {tab === 'nutrition' && <NutritionView data={data} mutate={mutate} date={selectedDate} setDate={setSelectedDate} notify={notify} />}
            {tab === 'goals' && <><GoalsView data={data} mutate={mutate} notify={notify} /><TrainingProgressView data={data}/></>}
            {tab === 'history' && <HistoryView data={data} mutate={mutate} notify={notify} resetData={resetData} exportData={exportData} />}
          </>}
        </main>
        <footer className="mt-10 text-center text-[10px] font-medium tracking-wide text-zinc-700">ROAD TO IRONMAN · LOCAL-FIRST DATA · JSON IMPORT / EXPORT · V59 FEATURE SET</footer>
      </div>
      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-white/10 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-900 shadow-2xl">{toast}</div>}
    </div>
  )
}

function SectionHead({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-black tracking-[-.02em]">{title}</h2>{meta && <div className="mt-1 text-[11px] font-bold uppercase tracking-[.15em] text-zinc-600">{meta}</div>}</div>{action}</div>
}
function StatCard({ label, value, meta, icon: Icon, accent = 'bg-[var(--accent)]/15 text-[var(--accent)]' }: { label: string; value: string; meta: string; icon: any; accent?: string }) {
  return <div className="glass rounded-2xl p-4"><div className="flex items-center justify-between gap-2"><div className="text-[10px] font-semibold uppercase tracking-[.17em] text-zinc-500">{label}</div><div className={cn('grid h-9 w-9 place-items-center rounded-xl', accent)}><Icon size={16}/></div></div><div className="mt-4 text-2xl font-black tracking-[-.03em]">{value}</div><div className="mt-1 text-xs text-zinc-500">{meta}</div></div>
}
function Field({ label, value, onChange, type = 'number', placeholder, step, min, max, disabled, wide = false, labelClassName }: { label: string; value: any; onChange: (value: string) => void; type?: string; placeholder?: string; step?: string | number; min?: number; max?: number; disabled?: boolean; wide?: boolean; labelClassName?: string }) {
  return <label className={cn('block min-w-0', wide && 'sm:col-span-2')}><span className={cn('mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600', labelClassName)}>{label}</span><input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} step={step} min={min} max={max} disabled={disabled} className="h-11 w-full min-w-0 rounded-xl border border-white/8 bg-black/20 px-3 text-sm text-white placeholder:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"/></label>
}
function PrimaryButton({ children, onClick, disabled, secondary = false, danger = false, type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean; type?: 'button' | 'submit' }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40', danger ? 'border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15' : secondary ? 'border border-white/8 bg-white/[.04] text-zinc-300 hover:bg-white/[.08]' : 'bg-[var(--accent)] text-black hover:brightness-105')}>{children}</button>
}
function IntakeToggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className={cn('inline-flex min-h-9 min-w-[82px] shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50', checked ? 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-white/8 bg-white/[.025] text-zinc-500 hover:border-white/15 hover:text-zinc-300')}>
    {checked ? <Check size={13} strokeWidth={2.5}/> : <span aria-hidden="true" className="h-2 w-2 rounded-full border border-current"/>}
    {checked ? 'Taken' : 'Take'}
  </button>
}
function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'good' | 'lime' | 'warn' }) {
  const styles = { muted: 'border-white/8 bg-white/[.03] text-zinc-500', good: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', lime: 'border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]', warn: 'border-amber-400/20 bg-amber-400/10 text-amber-200' }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles[tone]}`}>{children}</span>
}

function DashboardView({ data, mutate, setTab, setDate, notify }: { data: AnyRow; mutate: Mutate; setTab: (tab: string) => void; setDate: (date: string) => void; notify: (message: string) => void }) {
  const today = todayISO(), daily = data.daily[today] || {}, weights = recordedWeights(data), weekEntries = weights.filter(x => x.date >= mondayOf(today) && x.date <= addDays(mondayOf(today), 6)), weeklyRows = weeklyAverages(data)
  const lastWeight = weights.at(-1)?.weight, weekAverage = weekEntries.length ? weekEntries.reduce((a, b) => a + b.weight, 0) / weekEntries.length : weeklyRows.at(-1)?.average ?? null
  const totals = totalNutrition(data, today), plan = planForDate(today)
  const [form, setForm] = useState({ weight: '', sleep: '', shoulder: '', ankle: '', back: '', notes: '' })
  useEffect(() => setForm({ weight: daily.weight ?? '', sleep: daily.sleep ?? '', shoulder: daily.shoulder ?? '', ankle: daily.ankle ?? '', back: daily.back ?? '', notes: daily.notes || '' }), [today, daily.weight, daily.sleep, daily.shoulder, daily.ankle, daily.back, daily.notes])
  const progress = Math.max(0, Math.min(100, (((weekAverage ?? data.goals.startWeight) - data.goals.startWeight) / Math.max(1, data.goals.targetWeight - data.goals.startWeight)) * 100))
  const saveCheckin = () => {
    if (daily.saved) { notify('Today’s check-in is already locked'); return }
    mutate(d => { d.daily[today] = { ...(d.daily[today] || {}), weight: n(form.weight), sleep: n(form.sleep), shoulder: n(form.shoulder), ankle: n(form.ankle), back: n(form.back), notes: form.notes.trim(), saved: true } })
    notify('Daily check-in saved')
  }
  const toggleSupplement = (id: string, checked: boolean) => mutate(d => { d.supplements.logs[today] = { ...(d.supplements.logs[today] || {}), [id]: checked } })
  return <div className="space-y-5">
    <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <div className="glass ring-accent relative overflow-hidden rounded-[28px] p-6 sm:p-8"><div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(202,255,74,.16),transparent_66%)]"/><div className="relative max-w-2xl"><h1 className="text-4xl font-black tracking-[-.055em] sm:text-6xl">Build the engine.<br/>Then chase the distance.</h1><div className="mt-7 flex flex-wrap gap-2"><Badge>{lastWeight == null ? 'No weigh-in yet' : `${fmt(lastWeight)} kg latest`}</Badge><Badge>{Math.round(progress)}% toward weight target</Badge><Badge tone="lime">Today · {plan.muscu || 'Recovery day'}</Badge></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-zinc-600"><span>Start {fmt(data.goals.startWeight)} kg</span><span>Target {fmt(data.goals.targetWeight)} kg</span></div></div></div>
      <div className={cardClass()}><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[.2em] text-zinc-500">Next up</div><div className="mt-1 text-2xl font-black">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'short' })}</div></div><CalendarDays className="text-[var(--accent)]" size={22}/></div><div className="mt-5 space-y-2"><MiniLine icon={Dumbbell} label={plan.muscu || 'Recovery'} value={plan.muscu ? `${Object.values(PROGRAM_DEFS).filter((x: AnyRow) => x.sessions.includes(plan.muscu)).length} exercises` : 'No strength session'}/><MiniLine icon={Waves} label="Endurance" value={plan.endurance || 'Not scheduled'}/><MiniLine icon={Activity} label="Reinforcement" value={plan.reinforcement.length ? `${plan.reinforcement.length} drills` : '—'}/></div><div className="mt-5 flex justify-center"><PrimaryButton onClick={() => setTab('training')}><Dumbbell size={15}/> Open training</PrimaryButton></div></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Last known weight" value={lastWeight == null ? '—' : `${fmt(lastWeight)} kg`} meta={lastWeight == null ? 'Record a check-in' : `${fmt((lastWeight - data.goals.startWeight), 1)} kg from start`} icon={Weight}/><StatCard label="Weekly average" value={weekAverage == null ? '—' : `${fmt(weekAverage)} kg`} meta={`${weekEntries.length} weigh-in(s) this week`} icon={Activity} accent="bg-sky-400/15 text-sky-300"/><StatCard label="Calories today" value={`${Math.round(totals.kcal)} kcal`} meta={`Target ${data.goals.calTarget} kcal`} icon={Flame} accent="bg-amber-300/15 text-amber-200"/><StatCard label="Protein today" value={`${Math.round(totals.p)} g`} meta={`Target ${data.goals.proteinTarget} g`} icon={Beef} accent="bg-rose-400/15 text-rose-300"/></section>
    <section className={cardClass()}><SectionHead title="7-day plan" meta="Select a date to inspect or log it"/><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((day, i) => { const p = planForDate(day), done = data.workoutLogs.some((x: AnyRow) => x.date === day) || data.endurance.some((x: AnyRow) => x.date === day), isToday = day === today; return <button key={day} aria-label={`${formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${p.muscu || 'Recovery'}${p.endurance ? `, ${p.endurance}` : ''}`} onClick={() => { setDate(day); setTab('training') }} className={cn('rounded-2xl border p-3 text-left transition', isToday ? 'border-[var(--accent)]/40 bg-[var(--accent)]/[.07]' : 'border-white/7 bg-white/[.02] hover:bg-white/[.05]')}><div className="text-[10px] font-bold uppercase tracking-[.15em] text-zinc-500">{formatDate(day, { weekday: 'short' })}</div><div className="mt-1 text-lg font-black">{formatDate(day, { day: '2-digit' })}</div><div className="mt-2 min-h-8 text-[11px] font-bold leading-4">{p.muscu || 'Recovery'}</div><div className="mt-2 text-[10px] text-zinc-600">{p.endurance || '—'}</div><div className="mt-3"><Badge tone={done ? 'good' : isToday ? 'lime' : 'muted'}>{done ? 'Logged' : isToday ? 'Today' : `Day ${p.cycleDay}`}</Badge></div></button> })}</div></section>
    <section className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
      <div className={cardClass()}><SectionHead title="Daily check-in" meta={daily.saved ? 'Saved and locked for today' : 'Weight · sleep · pain · notes'}/>{daily.saved && <div className="mt-4 flex gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] p-3 text-xs text-emerald-200"><Check size={15}/> Today's check-in is saved.</div>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Weight (kg)" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} step="0.1" disabled={daily.saved}/><Field label="Sleep (hours)" value={form.sleep} onChange={v => setForm(f => ({ ...f, sleep: v }))} step="0.1" disabled={daily.saved}/><Field label="Shoulder pain /10" value={form.shoulder} onChange={v => setForm(f => ({ ...f, shoulder: v }))} min={0} max={10} disabled={daily.saved}/><Field label="Ankle pain /10" value={form.ankle} onChange={v => setForm(f => ({ ...f, ankle: v }))} min={0} max={10} disabled={daily.saved}/><Field label="Back pain /10" value={form.back} onChange={v => setForm(f => ({ ...f, back: v }))} min={0} max={10} disabled={daily.saved}/><Field label="Notes" type="text" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Energy, recovery, confidence…" disabled={daily.saved}/></div><div className="mt-4 flex justify-end"><PrimaryButton onClick={saveCheckin} disabled={daily.saved}><Save size={15}/> Save check-in</PrimaryButton></div></div>
      <div className={cardClass()}><SectionHead title="Supplements" meta="Today's intake"/><div className="mt-4 space-y-1">{data.supplements.items.length ? data.supplements.items.map((item: AnyRow) => { const checked = Boolean(data.supplements.logs[today]?.[item.id]); return <div key={item.id} className="flex min-h-12 items-center gap-3 border-b border-white/6 py-2 last:border-0"><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{item.name}</div><div className="text-[11px] text-zinc-500">{item.dose ? `${item.dose} ${item.unit}` : 'Dose not set'}</div></div><IntakeToggle checked={checked} onChange={() => toggleSupplement(item.id, !checked)} label={checked ? `Unmark ${item.name} as taken` : `Mark ${item.name} as taken`}/></div>}) : <Empty text="No supplements added yet."/>}</div><div className="mt-4 flex justify-center"><PrimaryButton secondary onClick={() => setTab('nutrition')}><Salad size={14}/> Manage nutrition</PrimaryButton></div></div>
    </section>
  </div>
}
function MiniLine({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/7 bg-white/[.025] px-4 py-3"><div className="flex items-center gap-3"><Icon size={16} className="text-zinc-500"/><span className="text-sm font-semibold">{label}</span></div><span className="text-right text-xs font-semibold text-zinc-500">{value}</span></div>
}
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-zinc-600">{text}</div> }
function DateNavigation({ date, setDate, label }: { date: string; setDate: (date: string) => void; label: string }) {
  return <div className="w-full min-w-0 sm:w-[280px]"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600">Log date</span><div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2"><button type="button" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))} className="grid h-11 w-10 place-items-center rounded-xl border border-white/8 bg-white/[.04] text-zinc-400 transition hover:bg-white/[.08] hover:text-white"><ChevronLeft size={17}/></button><input aria-label={label} type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-white/8 bg-black/20 px-2 text-sm text-white"/><button type="button" aria-label="Next day" onClick={() => setDate(addDays(date, 1))} className="grid h-11 w-10 place-items-center rounded-xl border border-white/8 bg-white/[.04] text-zinc-400 transition hover:bg-white/[.08] hover:text-white"><ChevronRight size={17}/></button></div></div>
}

function TrainingView({ data, mutate, date, setDate, notify }: { data: AnyRow; mutate: Mutate; date: string; setDate: (date: string) => void; notify: (message: string) => void }) {
  const today = todayISO(), canEdit = date === today, plan = planForDate(date)
  const ensureEditable = () => { if (canEdit) return true; notify('Training entries can only be logged for today'); return false }
  const saveStrength = (entry: AnyRow) => { if (!ensureEditable()) return; mutate(d => { d.workoutLogs.push(entry); if (entry.variant) d.variantChoices[`${entry.date}|${entry.session}|${entry.exerciseKey}`] = entry.variant }); notify('Set recorded') }
  const deleteStrength = (id: string) => { if (!ensureEditable() || !window.confirm('Delete this set?')) return; mutate(d => { d.workoutLogs = d.workoutLogs.filter((x: AnyRow) => x.id !== id) }); notify('Set deleted') }
  const editStrength = (entry: AnyRow) => {
    if (!ensureEditable()) return
    const weight = window.prompt('Load (kg)', String(entry.weight)); if (weight === null) return
    const reps = window.prompt('Reps', String(entry.reps)); if (reps === null) return
    const rir = window.prompt('RIR', String(entry.rir)); if (rir === null) return
    const pain = window.prompt('Pain /10', String(entry.painDuring ?? 0)); if (pain === null) return
    mutate(d => { const row = d.workoutLogs.find((x: AnyRow) => x.id === entry.id); if (row) { row.weight = n(weight, 0); row.reps = n(reps, 0); row.rir = n(rir, 0); row.painDuring = n(pain, 0) } }); notify('Set updated')
  }
  const saveReinforcement = (entry: AnyRow) => { if (!ensureEditable()) return; mutate(d => d.reinforcementLogs.push(entry)); notify('Reinforcement set recorded') }
  const deleteReinforcement = (id: string) => { if (!ensureEditable() || !window.confirm('Delete this reinforcement entry?')) return; mutate(d => { d.reinforcementLogs = d.reinforcementLogs.filter((x: AnyRow) => x.id !== id) }); notify('Entry deleted') }
  const editReinforcement = (entry: AnyRow) => {
    if (!ensureEditable()) return
    const actual = window.prompt('Actual reps / duration', String(entry.actualValue)); if (actual === null) return
    const resistance = window.prompt('Resistance (kg)', String(entry.resistance)); if (resistance === null) return
    const pain = window.prompt('Pain /10', String(entry.pain)); if (pain === null) return
    mutate(d => { const row = d.reinforcementLogs.find((x: AnyRow) => x.id === entry.id); if (row) { row.actualValue = n(actual, 0); row.actualRaw = actual; row.resistance = n(resistance, 0); row.pain = n(pain, 0) } }); notify('Reinforcement entry updated')
  }
  const saveEndurance = (entry: AnyRow) => { if (!ensureEditable()) return; mutate(d => d.endurance.push(entry)); notify('Endurance activity saved') }
  const deleteEndurance = (id: string) => { if (!ensureEditable() || !window.confirm('Delete this activity?')) return; mutate(d => { d.endurance = d.endurance.filter((x: AnyRow) => x.id !== id) }); notify('Activity deleted') }
  const exercises = plan.muscu ? Object.values(PROGRAM_DEFS).filter((ex: AnyRow) => ex.sessions.includes(plan.muscu)) : []
  const strengthDone = exercises.reduce((total: number, def: AnyRow) => total + Math.min(setCount(targetFor(def, plan.muscu || '')), data.workoutLogs.filter((x: AnyRow) => x.date === date && x.session === plan.muscu && x.exerciseKey === def.key && (def.material !== 'variant' || x.variant === (data.variantChoices[`${date}|${plan.muscu}|${def.key}`] || x.variant))).length), 0)
  const strengthTotal = exercises.reduce((total: number, def: AnyRow) => total + setCount(targetFor(def, plan.muscu || '')), 0)
  const reinforcementDefs = plan.reinforcement.map((key: string) => REINFORCEMENT_DEFS[key]).filter(Boolean)
  const reinforcementDone = reinforcementDefs.reduce((total: number, def: AnyRow) => total + Math.min(setCount(def.target), data.reinforcementLogs.filter((x: AnyRow) => x.date === date && x.exerciseKey === def.key).length), 0)
  const reinforcementTotal = reinforcementDefs.reduce((total: number, def: AnyRow) => total + setCount(def.target), 0)
  return <div className="space-y-5">
    <section className={cardClass()}><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="mt-1 text-3xl font-black tracking-[-.04em]">{plan.muscu || 'Recovery day'}</h1><p className="mt-2 text-sm text-zinc-500">{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Day {plan.cycleDay} of the 7-day cycle</p></div><DateNavigation date={date} setDate={setDate} label="Training date"/></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/7 bg-white/[.025] p-4"><div className="text-xs text-zinc-500">Strength sets</div><div className="mt-1 text-2xl font-black">{strengthDone}<span className="text-sm text-zinc-600"> / {strengthTotal}</span></div><Progress value={strengthTotal ? strengthDone / strengthTotal * 100 : 0}/></div><div className="rounded-2xl border border-white/7 bg-white/[.025] p-4"><div className="text-xs text-zinc-500">Reinforcement sets</div><div className="mt-1 text-2xl font-black">{reinforcementDone}<span className="text-sm text-zinc-600"> / {reinforcementTotal}</span></div><Progress value={reinforcementTotal ? reinforcementDone / reinforcementTotal * 100 : 0}/></div><div className="rounded-2xl border border-white/7 bg-white/[.025] p-4"><div className="text-xs text-zinc-500">Endurance planned</div><div className="mt-1 text-2xl font-black">{plan.endurance || '—'}</div></div></div></section>
    {!canEdit && <div role="status" className={cn('flex items-start gap-3 rounded-xl border px-3 py-3 text-xs', date < today ? 'border-zinc-400/15 bg-zinc-400/[.035] text-zinc-300' : 'border-sky-300/15 bg-sky-300/[.035] text-sky-100/80')}><span className={cn('mt-0.5 shrink-0 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide', date < today ? 'bg-white/[.06] text-zinc-400' : 'bg-sky-300/[.08] text-sky-200')}>{date < today ? 'Closed' : 'Upcoming'}</span><div><div className="font-semibold">{date < today ? 'This training day has passed' : 'This training session is scheduled'}</div><p className="mt-1 leading-5 text-zinc-500">{date < today ? `The log for ${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} is read-only.` : `Logging opens on ${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}.`}</p></div></div>}
    <section className={cardClass()}><SectionHead title="Strength" meta={plan.muscu ? `${exercises.length} exercises · double progression` : 'No strength session prescribed'}/>{plan.muscu ? <div className="mt-4 space-y-3">{exercises.map((def: AnyRow, index: number) => <StrengthCard key={`${date}-${def.key}`} data={data} date={date} session={plan.muscu!} def={def} index={index} disabled={!canEdit} onSave={saveStrength} onEdit={editStrength} onDelete={deleteStrength}/>)}</div> : <Empty text="Recovery day — no strength session in the current cycle."/>}</section>
    <section className={cardClass()}><SectionHead title="Reinforcement & rehab" meta="Back · shoulder · ankle"/>{reinforcementDefs.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{reinforcementDefs.map((def: AnyRow) => <ReinforcementCard key={`${date}-${def.key}`} data={data} date={date} session={plan.muscu || ''} def={def} disabled={!canEdit} onSave={saveReinforcement} onEdit={editReinforcement} onDelete={deleteReinforcement}/>)}</div> : <Empty text="No reinforcement block prescribed for this day."/>}<p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-zinc-600"><AlertCircle size={14} className="mt-0.5 shrink-0"/>Pain scores are a tracking aid, not medical advice. Stop an exercise if symptoms worsen and follow your clinician or physiotherapist's instructions.</p></section>
    <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0"><EnduranceCard data={data} date={date} planned={plan.endurance} onSave={saveEndurance} onDelete={deleteEndurance}/></fieldset>
  </div>
}
function Progress({ value }: { value: number }) { return <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div> }

function StrengthCard({ data, date, session, def, index, disabled, onSave, onEdit, onDelete }: { data: AnyRow; date: string; session: string; def: AnyRow; index: number; disabled: boolean; onSave: (entry: AnyRow) => void; onEdit: (entry: AnyRow) => void; onDelete: (id: string) => void }) {
  const variantKey = `${date}|${session}|${def.key}`
  const savedVariant = data.variantChoices[variantKey] || data.workoutLogs.filter((x: AnyRow) => x.date === date && x.session === session && x.exerciseKey === def.key && x.variant !== 'legacy').at(-1)?.variant
  const [variant, setVariant] = useState(savedVariant || 'smith')
  const [weight, setWeight] = useState(''), [reps, setReps] = useState(''), [rir, setRir] = useState('2'), [pain, setPain] = useState('0')
  const target = targetFor(def, session), need = setCount(target), range = rangeFor(target), profile = profileFor(def, variant)
  const rows = data.workoutLogs.filter((x: AnyRow) => x.date === date && x.session === session && x.exerciseKey === def.key && (def.material !== 'variant' || x.variant === variant)).sort((a: AnyRow, b: AnyRow) => a.set - b.set)
  const completed = rows.length >= need
  const historyVariant = def.material === 'variant' ? variant : ''
  const historical = strengthRecommendation(data, def, historyVariant, target)
  const live = rows.length ? (() => { const last = rows.at(-1), lastPain = n(last.painDuring, 0) || 0, lastWeight = n(last.weight, 0) || 0, lastReps = n(last.reps, 0) || 0, lastRir = n(last.rir, 0) || 0; if (lastPain >= 3 || lastReps < range.min) return { weight: nextLoad(profile, lastWeight, -1), label: lastPain >= 3 ? 'Pain reported: reduce the load' : 'Below rep range: reduce load', symbol: '↓' }; if (lastReps >= range.max && lastRir >= 2) { const next = nextLoad(profile, lastWeight, 1); return next > lastWeight && (lastWeight === 0 || (next - lastWeight) / lastWeight <= .2) ? { weight: next, label: 'Top of range with reserve', symbol: '↑' } : { weight: lastWeight, label: 'Load jump too large: keep load and add reps', symbol: '—' } } return { weight: lastWeight, label: 'Keep load and build reps', symbol: '—' } })() : historical
  const suggestedWeight = live?.weight
  const saveSet = () => {
    if (completed) return
    const w = n(weight !== '' ? weight : suggestedWeight, null), r = n(reps), rr = n(rir), p = n(pain, 0)
    if (w === null || r === null || rr === null || r <= 0 || rr < 0 || p === null || p < 0 || p > 10) return
    onSave({ id: uid(), date, session, set: rows.length + 1, exerciseKey: def.key, displayName: def.name, variant: def.material === 'variant' ? variant : undefined, weight: w, reps: r, rir: rr, painDuring: p, material: def.material })
    setWeight(''); setReps('')
  }
  return <article className={cn('rounded-2xl border p-4 transition', completed ? 'border-emerald-400/15 bg-emerald-400/[.025]' : 'border-white/7 bg-white/[.02]')}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.04] text-[10px] font-black text-zinc-600">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0"><h3 className="font-extrabold tracking-[-.015em]">{def.name}</h3><p className="mt-1 text-xs text-zinc-500">{(def.muscles || []).join(' · ') || target}</p><div className="mt-2 flex flex-wrap items-center gap-2"><Badge tone={completed ? 'good' : 'muted'}>{rows.length}/{need} sets</Badge><Badge>{target}</Badge><span className="text-[10px] text-zinc-600">{def.material === 'variant' ? 'Variant exercise' : def.material || 'exercise'}</span></div></div></div>{completed && <Check className="text-emerald-300" size={18}/>}</div>
    {def.material === 'variant' && <div className="mt-3 flex flex-wrap gap-2">{(['smith', 'dumbbell'] as const).map(v => <button key={v} disabled={disabled || rows.length > 0} onClick={() => setVariant(v)} className={cn('rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-40', variant === v ? 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-white/8 bg-white/[.03] text-zinc-500')}>{v === 'smith' ? 'Smith machine' : 'Dumbbells'}</button>)}{rows.length > 0 && <span className="self-center text-[10px] text-zinc-600">Variant locked for this session</span>}</div>}
    {!completed && <><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Field label="Load (kg)" value={weight === '' && suggestedWeight !== undefined ? suggestedWeight : weight} onChange={setWeight} step="0.5" min={0} placeholder="kg" disabled={disabled}/><Field label={`Reps (${range.min}–${range.max})`} value={reps} onChange={setReps} min={0} placeholder="Reps" disabled={disabled}/><Field label="RIR" value={rir} onChange={setRir} min={0} max={10} disabled={disabled}/><Field label="Pain /10" value={pain} onChange={setPain} min={0} max={10} step="0.5" disabled={disabled}/></div><div className="mt-3"><div className="text-xs leading-5 text-zinc-500">{live ? <><span className={cn(live.symbol === '↑' ? 'text-emerald-300' : live.symbol === '↓' ? 'text-red-300' : 'text-zinc-400')}>{live.symbol} </span>{live.label}{suggestedWeight !== undefined ? ` · suggested ${fmt(suggestedWeight)} kg` : ''}</> : 'Log your first working set to start personalized load recommendations.'}</div><div className="mt-4 flex justify-center"><PrimaryButton onClick={saveSet} disabled={disabled}><Check size={14}/> Save set {rows.length + 1}</PrimaryButton></div></div></>}
    {rows.length > 0 && <div className="mt-4 space-y-2 border-t border-white/7 pt-3">{rows.map((row: AnyRow) => <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-black/15 px-3 py-2 text-xs"><span className="font-black text-zinc-300">Set {row.set}</span><span>{fmt(row.weight)} kg × {row.reps}</span><span className="text-zinc-500">RIR {row.rir} · pain {row.painDuring ?? row.pain ?? 0}/10</span><div className="ml-auto flex gap-1"><button disabled={disabled} onClick={() => onEdit(row)} aria-label="Edit set" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/[.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Pencil size={13}/></button><button disabled={disabled} onClick={() => onDelete(row.id)} aria-label="Delete set" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={13}/></button></div></div>)}</div>}
    {historical && completed && <div className="mt-3 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[.04] px-3 py-2 text-xs text-zinc-400">Next session: <b className="text-[var(--accent)]">{historical.symbol} {fmt(historical.weight)} kg · {historical.min}–{historical.max} reps</b> <span className="block pt-1 text-[10px] text-zinc-600">{historical.label}</span></div>}
  </article>
}

function reinforcementRange(def: AnyRow) {
  const nums = (String(def.target || '').match(/\d+(?:[.,]\d+)?/g) || []).map((x: string) => Number(x.replace(',', '.')))
  return { min: nums.length > 1 ? nums[nums.length - 2] : nums[0] || 0, max: nums.length > 1 ? nums[nums.length - 1] : nums[0] || 0 }
}
function ReinforcementCard({ data, date, session, def, disabled, onSave, onEdit, onDelete }: { data: AnyRow; date: string; session: string; def: AnyRow; disabled: boolean; onSave: (entry: AnyRow) => void; onEdit: (entry: AnyRow) => void; onDelete: (id: string) => void }) {
  const [actual, setActual] = useState(''), [resistance, setResistance] = useState('0'), [pain, setPain] = useState('0')
  const rows = data.reinforcementLogs.filter((x: AnyRow) => x.date === date && x.exerciseKey === def.key).sort((a: AnyRow, b: AnyRow) => a.set - b.set)
  const need = setCount(def.target), complete = rows.length >= need, range = reinforcementRange(def), profile = def.profile || 'bodyweight'
  const previous = rows.at(-1), historical = reinforcementRecommendation(data, def), suggestion = previous && def.mode !== 'test' ? ((n(previous.pain, 0) || 0) >= 3 && (n(previous.resistance, 0) || 0) > 0 ? nextLoad(profile, n(previous.resistance, 0) || 0, -1) : (n(previous.actualValue, 0) || 0) < range.min && (n(previous.resistance, 0) || 0) > 0 ? nextLoad(profile, n(previous.resistance, 0) || 0, -1) : (n(previous.actualValue, 0) || 0) >= range.max && def.resistanceAllowed ? jumpAwareNextLoad(profile, n(previous.resistance, 0) || 0, 1) : (n(previous.resistance, 0) || 0)) : historical?.mode === 'load' ? historical.value : 0
  const save = () => {
    const val = def.mode === 'test' ? 0 : n(actual)
    const res = n(resistance, 0), p = n(pain, 0)
    if ((val === null && def.mode !== 'test') || res === null || p === null || p < 0 || p > 10) return
    onSave({ id: uid(), date, session, set: rows.length + 1, exerciseKey: def.key, exercise: def.name, mode: def.mode, actualValue: val ?? 0, actualRaw: actual, resistance: res, pain: p, quality: null })
    setActual(''); setPain('0')
  }
  return <article className="rounded-2xl border border-white/7 bg-white/[.02] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold">{def.name}</h3><p className="mt-1 text-xs text-zinc-500">{def.zone} · {def.target}</p></div><Badge tone={complete ? 'good' : 'muted'}>{rows.length}/{need}</Badge></div>{historical && <div className="mt-3 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[.04] px-3 py-2 text-[11px] text-zinc-400"><span className="font-bold text-[var(--accent)]">Next: {historical.symbol} {historical.mode === 'load' ? `${fmt(historical.value)} kg resistance` : historical.mode === 'test' ? 'Repeat specific test' : `${historical.value} ${def.mode === 'time' ? 'sec' : 'reps'} target`}</span><span className="mt-1 block text-zinc-600">{historical.label}</span></div>}{!complete && <><div className="mt-3 grid grid-cols-2 gap-3">{def.mode !== 'test' ? <Field label={def.mode === 'time' ? 'Duration (sec)' : def.mode === 'perSide' ? 'Reps per side' : 'Actual reps'} value={actual === '' && previous ? suggestion === 0 ? '' : previous.actualValue : actual} onChange={setActual} min={0} step="1" labelClassName="min-h-[32px] leading-4" disabled={disabled}/> : <div aria-hidden="true" className="min-h-[62px]"/>}{def.resistanceAllowed ? <Field label="Resistance (kg)" value={resistance === '0' && suggestion ? suggestion : resistance} onChange={setResistance} min={0} step="0.5" labelClassName="min-h-[32px] leading-4" disabled={disabled}/> : <div aria-hidden="true" className="min-h-[62px]"/>}<Field label="Pain /10" value={pain} onChange={setPain} min={0} max={10} step="0.5" disabled={disabled}/></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] text-zinc-600">{previous ? `Previous: ${previous.actualValue} ${def.mode === 'time' ? 'sec' : 'reps'} · resistance ${fmt(previous.resistance)} kg` : 'First logged set'}</div><PrimaryButton onClick={save} disabled={disabled}><Check size={14}/> Save</PrimaryButton></div></>}
    {rows.length > 0 && <div className="mt-3 space-y-1 border-t border-white/7 pt-2">{rows.map((row: AnyRow) => <div key={row.id} className="flex items-center gap-2 py-1 text-[11px] text-zinc-400"><span className="font-bold text-zinc-300">Set {row.set}</span><span>{row.mode === 'test' ? 'Position test' : `${row.actualValue} ${row.mode === 'time' ? 'sec' : 'reps'}`}</span><span>· resistance {fmt(row.resistance)} kg · pain {row.pain}/10</span><div className="ml-auto flex items-center gap-1"><button disabled={disabled} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" onClick={() => onEdit(row)} aria-label="Edit reinforcement set"><Pencil size={12}/></button><button disabled={disabled} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => onDelete(row.id)} aria-label="Delete reinforcement set"><Trash2 size={13}/></button></div></div>)}</div>}</article>
}
function EnduranceCard({ data, date, planned, onSave, onDelete }: { data: AnyRow; date: string; planned: string | null; onSave: (entry: AnyRow) => void; onDelete: (id: string) => void }) {
  const [type, setType] = useState(planned || 'Course'), [distance, setDistance] = useState(''), [duration, setDuration] = useState(''), [rpe, setRpe] = useState('5'), [pain, setPain] = useState('0')
  const rows = data.endurance.filter((x: AnyRow) => x.date === date).sort((a: AnyRow, b: AnyRow) => a.id.localeCompare(b.id))
  const save = () => { const d = n(distance), mins = n(duration), rp = n(rpe, 0), pn = n(pain, 0); if (d === null || mins === null || d <= 0 || mins <= 0 || rp === null || rp < 0 || rp > 10 || pn === null || pn < 0 || pn > 10) return; onSave({ id: uid(), date, type, session: type, distanceKm: d, durationMin: mins, rpe: rp, pain: pn, source: 'Manual' }); setDistance(''); setDuration('') }
  return <section className={cardClass()}><SectionHead title={planned ? 'Endurance log' : 'Extra endurance session'} meta={planned || 'Nothing planned today'}/>{!planned && <p className="mt-3 rounded-xl border border-white/7 bg-white/[.025] px-3 py-2 text-xs leading-5 text-zinc-500">No endurance session is scheduled for this date. Use this form only if you completed an extra session.</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600">Activity</span><select value={type} onChange={e => setType(e.target.value)} className="h-11 w-full rounded-xl border border-white/8 bg-black/20 px-3 text-sm"><option>Course</option><option>Natation</option><option>Vélo</option><option>Triathlon</option><option>Autre</option></select></label><Field label="Distance (km)" value={distance} onChange={setDistance} min={0} step="0.01"/><Field label="Duration (min)" value={duration} onChange={setDuration} min={0} step="1"/><Field label="RPE /10" value={rpe} onChange={setRpe} min={0} max={10}/><Field label="Pain /10" value={pain} onChange={setPain} min={0} max={10}/></div><div className="mt-3 flex justify-end"><PrimaryButton onClick={save}><Plus size={14}/>{planned ? 'Add activity' : 'Log extra session'}</PrimaryButton></div>{rows.length > 0 && <div className="mt-4 space-y-2 border-t border-white/7 pt-3">{rows.map((row: AnyRow) => <div key={row.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-black/15 px-3 py-2 text-xs"><span className="font-bold text-zinc-200">{row.type}</span><span>{fmt(row.distanceKm, 2)} km</span><span className="text-zinc-500">{row.durationMin} min · RPE {row.rpe} · pain {row.pain}/10</span><button onClick={() => onDelete(row.id)} className="ml-auto text-zinc-600 hover:text-red-300" aria-label="Delete activity"><Trash2 size={13}/></button></div>)}</div>}</section>
}

function NutritionView({ data, mutate, date, setDate, notify }: { data: AnyRow; mutate: Mutate; date: string; setDate: (date: string) => void; notify: (message: string) => void }) {
  const emptyIngredient = () => ({ id: uid(), foodId: '', name: '', grams: '100', unit: 'g', kcal100: 0, p100: 0, c100: 0, f100: 0, source: '', sourceUrl: '', code: '' })
  const emptyMeal = () => ({ id: '', name: '', note: '', mode: 'quick' as 'ingredients' | 'quick', ingredients: [emptyIngredient()], kcal: '', p: '', c: '', f: '' })
  const [mealForm, setMealForm] = useState<ReturnType<typeof emptyMeal>>(emptyMeal)
  const [foodForm, setFoodForm] = useState({ name: '', kcal100: '', p100: '', c100: '', f100: '' })
  const [foodSearchTerm, setFoodSearchTerm] = useState('')
  const [foodSearchResults, setFoodSearchResults] = useState<AnyRow[]>([])
  const [foodSearchLoading, setFoodSearchLoading] = useState(false)
  const [foodSearchError, setFoodSearchError] = useState('')
  const lastFoodSearchAt = useRef(0)
  const [suppForm, setSuppForm] = useState({ name: '', dose: '', unit: 'g' })
  const totals = totalNutrition(data, date), bySlot = data.mealLogs[date] || {}
  const foodOptions = [...DEFAULT_FOODS, ...(data.foods || []), ...foodSearchResults]
  const formTotals = mealForm.mode === 'ingredients'
    ? calculateIngredients(mealForm.ingredients.map(item => ({ ...item, grams: n(item.grams, 0) || 0 })))
    : { kcal: n(mealForm.kcal, 0) || 0, p: n(mealForm.p, 0) || 0, c: n(mealForm.c, 0) || 0, f: n(mealForm.f, 0) || 0 }
  const clearForm = () => setMealForm(emptyMeal())
  const addIngredient = () => setMealForm(f => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }))
  const searchFoodDatabase = async () => {
    const query = foodSearchTerm.trim()
    if (query.length < 2) { setFoodSearchError('Enter at least two characters.'); return }
    const waitMs = 6500 - (Date.now() - lastFoodSearchAt.current)
    if (waitMs > 0) { setFoodSearchError(`Please wait ${Math.ceil(waitMs / 1000)} seconds before searching again.`); return }
    lastFoodSearchAt.current = Date.now()
    setFoodSearchLoading(true); setFoodSearchError(''); setFoodSearchResults([])
    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Food search failed.')
      setFoodSearchResults(Array.isArray(result.products) ? result.products : [])
      if (!result.products?.length) setFoodSearchError('No complete nutrition data found. Try another food.')
    } catch (error) { setFoodSearchError(error instanceof Error ? error.message : 'Food search failed.') }
    finally { setFoodSearchLoading(false) }
  }
  const addFoodIngredient = (food: AnyRow) => {
    setMealForm(f => {
    const item = { ...emptyIngredient(), foodId: food.id, name: food.name, grams: '100', unit: food.unit || 'g', kcal100: food.kcal100, p100: food.p100, c100: food.c100, f100: food.f100, source: food.source || 'Local food catalog', sourceUrl: food.sourceUrl || '', code: food.code || '' }
    const ingredients = f.ingredients.length === 1 && !f.ingredients[0].name ? [item] : [...f.ingredients, item]
    return { ...f, mode: 'ingredients', ingredients }
    })
    setFoodSearchResults([])
    setFoodSearchTerm('')
    notify(`${food.name} added to meal`)
  }
  const updateIngredient = (id: string, field: string, value: string) => setMealForm(f => ({ ...f, ingredients: f.ingredients.map(item => {
    if (item.id !== id) return item
    if (field === 'foodId') {
      const food = foodOptions.find((x: AnyRow) => x.id === value)
      return food ? { ...item, foodId: food.id, name: food.name, unit: food.unit || 'g', kcal100: n(food.kcal100, 0) || 0, p100: n(food.p100, 0) || 0, c100: n(food.c100, 0) || 0, f100: n(food.f100, 0) || 0, source: food.source || '', sourceUrl: food.sourceUrl || '', code: food.code || '' } : { ...item, foodId: '', name: '', unit: 'g', kcal100: 0, p100: 0, c100: 0, f100: 0 }
    }
    return { ...item, [field]: value }
  }) }))
  const saveMeal = (e: FormEvent) => {
    e.preventDefault()
    if (!mealForm.name.trim()) { notify('Enter a meal name'); return }
    let ingredients: AnyRow[] = []
    let nutrition = formTotals
    if (mealForm.mode === 'ingredients') {
      ingredients = mealForm.ingredients.filter(item => item.name.trim() && n(item.grams, 0) !== null && (n(item.grams, 0) || 0) > 0).map(item => ({ ...item, grams: n(item.grams, 0) || 0 }))
      if (!ingredients.length) { notify('Add at least one food and its quantity'); return }
      nutrition = calculateIngredients(ingredients)
    }
    const meal = { id: mealForm.id || uid(), name: mealForm.name.trim(), kcal: nutrition.kcal, p: nutrition.p, c: nutrition.c, f: nutrition.f, note: mealForm.note.trim(), ingredients }
    mutate(d => { const index = d.meals.findIndex((m: AnyRow) => m.id === meal.id); if (index >= 0) d.meals[index] = meal; else d.meals.push(meal) })
    clearForm(); notify(mealForm.id ? 'Meal updated in library' : 'Meal added to library')
  }
  const assignMeal = (slot: string, mealId: string) => mutate(d => {
    d.mealLogs[date] = { ...(d.mealLogs[date] || {}) }
    if (!mealId) { delete d.mealLogs[date][slot]; return }
    const meal = d.meals.find((m: AnyRow) => m.id === mealId)
    if (meal) d.mealLogs[date][slot] = { mealId: meal.id, snapshot: snapshotMeal(meal) }
  })
  const deleteMeal = (id: string) => { if (!window.confirm('Delete this meal from the reusable library? Past logged snapshots stay intact.')) return; mutate(d => { d.meals = d.meals.filter((m: AnyRow) => m.id !== id) }); notify('Meal removed from library') }
  const editMeal = (meal: AnyRow) => {
    const ingredients: ReturnType<typeof emptyIngredient>[] = Array.isArray(meal.ingredients) && meal.ingredients.length ? meal.ingredients.map((item: AnyRow) => ({ ...emptyIngredient(), ...item, id: item.id || uid(), grams: String(item.grams ?? 100) })) : [emptyIngredient()]
    const hasIngredients = Array.isArray(meal.ingredients) && meal.ingredients.length > 0
    setMealForm({ id: meal.id, name: meal.name, note: meal.note || '', mode: hasIngredients ? 'ingredients' : 'quick', ingredients, kcal: String(meal.kcal ?? ''), p: String(meal.p ?? meal.protein ?? ''), c: String(meal.c ?? meal.carbs ?? ''), f: String(meal.f ?? meal.fat ?? '') })
  }
  const saveFood = (e: FormEvent) => {
    e.preventDefault()
    const kcal100 = n(foodForm.kcal100), p100 = n(foodForm.p100), c100 = n(foodForm.c100), f100 = n(foodForm.f100)
    if (!foodForm.name.trim() || [kcal100, p100, c100, f100].some(v => v === null || v < 0)) { notify('Enter the food name and valid nutrition values per 100 g'); return }
    const food = { id: uid(), name: foodForm.name.trim(), kcal100: kcal100!, p100: p100!, c100: c100!, f100: f100! }
    mutate(d => { d.foods.push(food) })
    setFoodForm({ name: '', kcal100: '', p100: '', c100: '', f100: '' })
    notify('Food saved to My foods & labels')
  }
  const deleteFood = (id: string) => { if (!window.confirm('Remove this food from My foods & labels? Saved meal ingredients keep their nutrition values.')) return; mutate(d => { d.foods = d.foods.filter((food: AnyRow) => food.id !== id) }); notify('Food removed') }
  const addSupplement = (e: FormEvent) => { e.preventDefault(); if (!suppForm.name.trim()) return; mutate(d => d.supplements.items.push({ id: uid(), name: suppForm.name.trim(), dose: suppForm.dose.trim(), unit: suppForm.unit.trim() })); setSuppForm({ name: '', dose: '', unit: 'g' }); notify('Supplement added') }
  const toggleSupp = (id: string, checked: boolean) => mutate(d => { d.supplements.logs[date] = { ...(d.supplements.logs[date] || {}), [id]: checked } })
  const removeSupplement = (id: string) => { if (!window.confirm('Remove this supplement?')) return; mutate(d => { d.supplements.items = d.supplements.items.filter((x: AnyRow) => x.id !== id) }); notify('Supplement removed') }
  return <div className="space-y-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-black tracking-[-.04em]">Nutrition</h1><p className="mt-2 text-sm text-zinc-500">{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div><DateNavigation date={date} setDate={setDate} label="Nutrition date"/></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Calories" value={`${Math.round(totals.kcal)} kcal`} meta={`Target ${data.goals.calTarget} kcal`} icon={Flame} accent="bg-amber-300/15 text-amber-200"/><StatCard label="Protein" value={`${Math.round(totals.p)} g`} meta={`Target ${data.goals.proteinTarget} g`} icon={Beef} accent="bg-rose-400/15 text-rose-300"/><StatCard label="Carbohydrates" value={`${Math.round(totals.c)} g`} meta="Logged from meals" icon={Wheat} accent="bg-sky-400/15 text-sky-300"/><StatCard label="Fat" value={`${Math.round(totals.f)} g`} meta="Logged from meals" icon={Droplets} accent="bg-fuchsia-400/15 text-fuchsia-300"/></section>
    <section className={cardClass()}><SectionHead title="Meals for the day" meta={formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}/><div className="mt-4 grid gap-3 sm:grid-cols-2">{slots.map(slot => { const assignment = bySlot[slot.id], snap = assignment?.snapshot; return <div key={slot.id} className="rounded-2xl border border-white/7 bg-white/[.02] p-4"><div className="flex items-center justify-between gap-2"><div className="font-bold">{slot.label}</div>{snap && <button aria-label={`Clear ${slot.label}`} onClick={() => assignMeal(slot.id, '')} className="text-zinc-600 hover:text-red-300"><X size={15}/></button>}</div>{snap ? <><div className="mt-3 text-sm font-semibold">{snap.name}</div><div className="mt-1 text-xs text-zinc-500">{Math.round(snap.kcal || 0)} kcal · {fmt(snap.p, 0)} g P · {fmt(snap.c, 0)} g C · {fmt(snap.f, 0)} g F</div>{snap.ingredients?.length > 0 && <div className="mt-2 text-[11px] leading-5 text-zinc-600">{snap.ingredients.map((item: AnyRow) => `${item.name} ${fmt(item.grams, 0)} ${item.unit || 'g'}`).join(' · ')}</div>}{snap.note && <div className="mt-2 text-[11px] text-zinc-600">{snap.note}</div>}</> : <div className="mt-3 text-xs text-zinc-600">No meal assigned.</div>}<select aria-label={`Choose meal for ${slot.label}`} value={assignment?.mealId || ''} onChange={e => assignMeal(slot.id, e.target.value)} className="mt-3 h-11 w-full min-w-0 rounded-xl border border-white/8 bg-black/20 px-3 text-sm"><option value="">Choose from library…</option>{data.meals.map((meal: AnyRow) => <option key={meal.id} value={meal.id}>{meal.name} · {Math.round(mealNutrition(meal).kcal)} kcal</option>)}</select></div> })}</div></section>
    <section className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
      <form onSubmit={saveMeal} className={cardClass()}><SectionHead title={mealForm.id ? 'Edit meal' : 'Create a meal'}/>{mealForm.id && <div className="mt-3 flex justify-end"><button type="button" onClick={clearForm} className="text-xs text-zinc-500 hover:text-white">Cancel edit</button></div>}<div className="mt-4"><Field label="Meal name" type="text" value={mealForm.name} onChange={v => setMealForm(f => ({ ...f, name: v }))} placeholder="Meal name" wide/></div>
        <div className="mt-4 rounded-2xl border border-white/7 bg-white/[.02] p-3"><label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600">Search foods</span><input value={foodSearchTerm} onChange={e => { setFoodSearchTerm(e.target.value); setFoodSearchError(''); setFoodSearchResults([]) }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchFoodDatabase() } }} placeholder="skyr, pâtes, fromage blanc…" className="h-11 w-full rounded-xl border border-white/8 bg-black/20 px-3 text-sm"/></label><div className="mt-2 flex justify-end"><button type="button" disabled={foodSearchLoading || foodSearchTerm.trim().length < 2} onClick={() => void searchFoodDatabase()} className="inline-flex min-h-11 min-w-28 items-center justify-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)]/15 disabled:opacity-50">{foodSearchLoading ? 'Searching…' : 'Search'}</button></div>{foodSearchError && <p role="status" className="mt-3 text-xs text-zinc-400">{foodSearchError}</p>}{foodSearchTerm.trim().length >= 2 && foodSearchResults.length > 0 && <div className="relative z-20"><div className="absolute left-0 right-0 top-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-[#101214] p-2 shadow-2xl">{foodSearchResults.map((food: AnyRow) => <button key={food.id} type="button" onClick={() => addFoodIngredient(food)} className="flex w-full items-start gap-2 rounded-xl border border-white/8 bg-black/15 p-3 text-left hover:border-[var(--accent)]/30"><span className="min-w-0 flex-1"><span className="block whitespace-normal break-words text-xs font-semibold leading-4">{food.name}</span><span className="mt-1 block whitespace-normal break-words text-[10px] leading-4 text-zinc-500">{[food.brand, food.quantity, `barcode ${food.code}`].filter(Boolean).join(' · ')}</span></span><span className="shrink-0 text-right text-[10px] text-zinc-400">{food.kcal100} kcal / 100 {food.unit || 'g'}</span><Plus size={14} className="shrink-0 text-[var(--accent)]"/></button>)}</div><div className="px-2 pb-1 pt-2 text-[10px] text-zinc-600">Data: <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">Open Food Facts · ODbL</a></div></div>}</div>
        <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setMealForm(f => ({ ...f, mode: 'quick' }))} className={cn('flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-center text-xs font-bold transition', mealForm.mode === 'quick' ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-white/8 bg-white/[.03] text-zinc-500 hover:bg-white/[.06]')}>Manual totals</button><button type="button" onClick={() => setMealForm(f => ({ ...f, mode: 'ingredients' }))} className={cn('flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-center text-xs font-bold transition', mealForm.mode === 'ingredients' ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-white/8 bg-white/[.03] text-zinc-500 hover:bg-white/[.06]')}>Build from ingredients</button></div>
        {mealForm.mode === 'ingredients' ? <div className="mt-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-bold">Ingredients</div><button type="button" onClick={addIngredient} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[.04] px-3 text-xs font-bold text-zinc-300"><Plus size={14}/> Add food</button></div>{mealForm.ingredients.map((item, index) => { const selectedFood = foodOptions.find((food: AnyRow) => food.id === item.foodId); return <div key={item.id} className="rounded-2xl border border-white/7 bg-white/[.025] p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600">Ingredient {index + 1}</span><button type="button" aria-label="Remove ingredient" onClick={() => setMealForm(f => ({ ...f, ingredients: f.ingredients.filter(row => row.id !== item.id) }))} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 hover:bg-red-400/10 hover:text-red-300"><Trash2 size={13}/></button></div><div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_110px]"><label className="block min-w-0"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600">Food</span><select value={item.foodId} onChange={e => updateIngredient(item.id, 'foodId', e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-white/8 bg-black/20 px-3 text-sm"><option value="">Choose a food…</option>{foodOptions.map((food: AnyRow) => <option key={food.id} value={food.id}>{food.name}</option>)}{!selectedFood && item.foodId && <option value={item.foodId}>{item.name || 'Saved food'}</option>}</select></label><Field label={`Amount (${item.unit || 'g'})`} value={item.grams} onChange={v => updateIngredient(item.id, 'grams', v)} min={0} step="1"/></div>{selectedFood && <div className="mt-2 text-[10px] leading-5 text-zinc-600">Per 100 {item.unit || 'g'}: {selectedFood.kcal100} kcal · {fmt(selectedFood.p100, 1)} P · {fmt(selectedFood.c100, 1)} C · {fmt(selectedFood.f100, 1)} F</div>}{item.source && <div className="mt-1 text-[10px] text-zinc-600">{item.source}{item.code ? ` · barcode ${item.code}` : ''}{item.sourceUrl ? <> · <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="underline">view source</a></> : ''}</div>}{item.name && <div className="mt-1 text-xs text-zinc-400">This portion: {Math.round((n(item.grams, 0) || 0) * (n(item.kcal100, 0) || 0) / 100)} kcal · {fmt((n(item.grams, 0) || 0) * (n(item.p100, 0) || 0) / 100)} g protein</div>}</div>})}</div> : <div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Calories (kcal)" value={mealForm.kcal} onChange={v => setMealForm(f => ({ ...f, kcal: v }))} min={0}/><Field label="Protein (g)" value={mealForm.p} onChange={v => setMealForm(f => ({ ...f, p: v }))} min={0} step="0.1"/><Field label="Carbs (g)" value={mealForm.c} onChange={v => setMealForm(f => ({ ...f, c: v }))} min={0} step="0.1"/><Field label="Fat (g)" value={mealForm.f} onChange={v => setMealForm(f => ({ ...f, f: v }))} min={0} step="0.1"/></div>}
        <div className="mt-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[.055] p-4"><div className="text-[10px] font-bold uppercase tracking-[.15em] text-zinc-500">Calculated meal total</div><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><div className="text-xl font-black">{Math.round(formTotals.kcal)}</div><div className="text-[10px] text-zinc-500">kcal</div></div><div><div className="text-xl font-black">{fmt(formTotals.p, 1)} g</div><div className="text-[10px] text-zinc-500">Protein</div></div><div><div className="text-xl font-black">{fmt(formTotals.c, 1)} g</div><div className="text-[10px] text-zinc-500">Carbs</div></div><div><div className="text-xl font-black">{fmt(formTotals.f, 1)} g</div><div className="text-[10px] text-zinc-500">Fat</div></div></div></div>
        <div className="mt-4"><Field label="Notes / portion" type="text" value={mealForm.note} onChange={v => setMealForm(f => ({ ...f, note: v }))} placeholder="Optional: meal timing, preparation…" wide/></div><div className="mt-5 flex justify-center"><PrimaryButton type="submit"><Plus size={14}/>{mealForm.id ? 'Save changes' : 'Add meal to library'}</PrimaryButton></div>
      </form>
      <div className="space-y-5"><div className={cardClass()}><SectionHead title="Meal library" meta={`${data.meals.length} reusable items`}/><div className="mt-4 space-y-2">{data.meals.length ? data.meals.map((meal: AnyRow) => { const macros = mealNutrition(meal); return <div key={meal.id} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[.02] p-3"><div className="min-w-0 flex-1"><div className="break-words text-sm font-bold">{meal.name}</div><div className="mt-1 text-[11px] text-zinc-500">{Math.round(macros.kcal)} kcal · {fmt(macros.p, 0)} P · {fmt(macros.c, 0)} C · {fmt(macros.f, 0)} F</div>{meal.ingredients?.length > 0 && <div className="mt-1 text-[10px] leading-4 text-zinc-600">{meal.ingredients.map((item: AnyRow) => `${item.name} ${fmt(item.grams, 0)} ${item.unit || 'g'}`).join(' · ')}</div>}{meal.note && <div className="mt-1 break-words text-[10px] text-zinc-600">{meal.note}</div>}</div><button aria-label="Edit meal" onClick={() => editMeal(meal)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 text-zinc-500 hover:text-white"><Pencil size={14}/></button><button aria-label="Delete meal" onClick={() => deleteMeal(meal.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 text-zinc-500 hover:text-red-300"><Trash2 size={14}/></button></div>}) : <Empty text="Your reusable meal library is empty. Add the first meal from its ingredients."/>}</div></div>
      <div className={cardClass()}><SectionHead title="My foods & labels" meta={`${(data.foods || []).length} saved`}/><form onSubmit={saveFood} className="mt-4 space-y-3"><Field label="Food name" type="text" value={foodForm.name} onChange={v => setFoodForm(f => ({ ...f, name: v }))} placeholder="Food name" wide/><div className="grid grid-cols-2 gap-3"><Field label="kcal / 100 g" value={foodForm.kcal100} onChange={v => setFoodForm(f => ({ ...f, kcal100: v }))} min={0} step="0.1"/><Field label="Protein / 100 g" value={foodForm.p100} onChange={v => setFoodForm(f => ({ ...f, p100: v }))} min={0} step="0.1"/><Field label="Carbs / 100 g" value={foodForm.c100} onChange={v => setFoodForm(f => ({ ...f, c100: v }))} min={0} step="0.1"/><Field label="Fat / 100 g" value={foodForm.f100} onChange={v => setFoodForm(f => ({ ...f, f100: v }))} min={0} step="0.1"/></div><div className="mt-4 flex justify-center"><PrimaryButton type="submit"><Plus size={14}/> Save food</PrimaryButton></div></form>{(data.foods || []).length > 0 && <div className="mt-4 space-y-1 border-t border-white/7 pt-3">{data.foods.map((food: AnyRow) => <div key={food.id} className="flex items-center gap-2 py-2"><div className="min-w-0 flex-1"><div className="break-words text-xs font-semibold">{food.name}</div><div className="text-[10px] text-zinc-600">{food.kcal100} kcal · {fmt(food.p100)} P · {fmt(food.c100)} C · {fmt(food.f100)} F / 100 g</div></div><button type="button" aria-label={`Remove ${food.name}`} onClick={() => deleteFood(food.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-600 hover:text-red-300"><Trash2 size={13}/></button></div>)}</div>}</div></div>
    </section>
    <section className={cardClass()}><SectionHead title="Supplements" meta="Dose and daily intake"/><form onSubmit={addSupplement} className="mt-4 grid gap-3 sm:grid-cols-[1.3fr_.8fr_.6fr_auto]"><Field label="Name" type="text" value={suppForm.name} onChange={v => setSuppForm(f => ({ ...f, name: v }))} placeholder="Creatine"/><Field label="Dose" type="text" value={suppForm.dose} onChange={v => setSuppForm(f => ({ ...f, dose: v }))} placeholder="5"/><Field label="Unit" type="text" value={suppForm.unit} onChange={v => setSuppForm(f => ({ ...f, unit: v }))} placeholder="g"/><div className="flex items-end justify-end"><PrimaryButton type="submit"><Plus size={14}/> Add</PrimaryButton></div></form><div className="mt-4 space-y-1">{data.supplements.items.map((item: AnyRow) => { const checked = Boolean(data.supplements.logs[date]?.[item.id]); return <div key={item.id} className="flex items-center gap-3 border-b border-white/6 py-3 last:border-0"><div className="min-w-0 flex-1"><div className="text-sm font-bold">{item.name}</div><div className="text-[11px] text-zinc-500">{item.dose ? `${item.dose} ${item.unit}` : 'Dose not specified'}</div></div><IntakeToggle checked={checked} onChange={() => toggleSupp(item.id, !checked)} label={checked ? `Unmark ${item.name} as taken` : `Mark ${item.name} as taken`}/><button aria-label={`Remove ${item.name}`} onClick={() => removeSupplement(item.id)} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-600 hover:bg-red-400/10 hover:text-red-300"><Trash2 size={14}/></button></div> })}</div></section>
  </div>
}

function GoalsView({ data, mutate, notify }: { data: AnyRow; mutate: Mutate; notify: (message: string) => void }) {
  const [goals, setGoals] = useState<AnyRow>({ ...data.goals })
  const [chartMetric, setChartMetric] = useState<'weight' | 'run' | 'pace' | 'swim' | 'nutrition'>('run')
  const [showSamplePreview, setShowSamplePreview] = useState(true)
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('week')
  useEffect(() => setGoals({ ...data.goals }), [data.goals.startWeight, data.goals.midWeight, data.goals.targetWeight, data.goals.calTarget, data.goals.proteinTarget])
  const weights = recordedWeights(data), weeks = weeklyAverages(data), lastWeek = weeks.at(-1)
  const saveGoals = () => { if (goals.targetWeight <= goals.startWeight || goals.calTarget <= 0 || goals.proteinTarget <= 0) { notify('Check your goal values'); return }; mutate(d => { d.goals = { ...d.goals, ...goals } }); notify('Goals updated') }
  const runRows = data.endurance.filter((row: AnyRow) => row.type === 'Course').sort((a: AnyRow, b: AnyRow) => a.date.localeCompare(b.date))
  const swimRows = data.endurance.filter((row: AnyRow) => row.type === 'Natation').sort((a: AnyRow, b: AnyRow) => a.date.localeCompare(b.date))
  const maxRun = Math.max(0, ...runRows.map((row: AnyRow) => n(row.distanceKm, 0) || 0))
  const maxSwim = Math.max(0, ...swimRows.map((row: AnyRow) => n(row.distanceKm, 0) || 0))
  const dateMap: Record<string, AnyRow[]> = {}
  data.endurance.forEach((row: AnyRow) => (dateMap[row.date] ||= []).push(row))
  const sameDayTriathlon = (swimKm: number, bikeKm: number, runKm: number) => Object.values(dateMap).some(rows =>
    rows.some(row => row.type === 'Natation' && (n(row.distanceKm, 0) || 0) >= swimKm) &&
    rows.some(row => ['Vélo', 'Cyclisme', 'Bike'].includes(row.type) && (n(row.distanceKm, 0) || 0) >= bikeKm) &&
    rows.some(row => row.type === 'Course' && (n(row.distanceKm, 0) || 0) >= runKm))
  const strengthSessionKeys: string[] = [...new Set<string>(data.workoutLogs.filter((row: AnyRow) => row.session).map((row: AnyRow) => `${row.date}|${row.session}`))]
  const strengthSessions = strengthSessionKeys.filter(key => {
    const [day, session = ''] = key.split('|')
    return isFullStrengthSessionComplete(data.workoutLogs, Object.values(PROGRAM_DEFS), day, session, (def, currentSession) => setCount(targetFor(def, currentSession)))
  }).length
  const milestones = [
    { key: 'roadmap_base_force', title: 'Strength Base', detail: `${Math.min(8, strengthSessions)}/8 complete strength sessions`, pct: Math.min(100, strengthSessions / 8 * 100), achieved: strengthSessions >= 8 },
    { key: 'roadmap_swim500', title: '500 m Swim', detail: `Single-session best: ${fmt(maxSwim, 2)} km`, pct: Math.min(100, maxSwim / .5 * 100), achieved: maxSwim >= .5 },
    { key: 'roadmap_swim1', title: '1 km Swim', detail: `Single-session best: ${fmt(maxSwim, 2)} km`, pct: Math.min(100, maxSwim / 1 * 100), achieved: maxSwim >= 1 },
    { key: 'roadmap_run5', title: '5 km Run', detail: `Single-session best: ${fmt(maxRun, 1)} km`, pct: Math.min(100, maxRun / 5 * 100), achieved: maxRun >= 5 },
    { key: 'roadmap_run10', title: '10 km Run', detail: `Single-session best: ${fmt(maxRun, 1)} km`, pct: Math.min(100, maxRun / 10 * 100), achieved: maxRun >= 10 },
    { key: 'roadmap_half', title: 'Half Marathon', detail: `Single-session best: ${fmt(maxRun, 1)} km`, pct: Math.min(100, maxRun / 21.1 * 100), achieved: maxRun >= 21.1 },
    { key: 'roadmap_sprint', title: 'Sprint Triathlon', detail: '750 m swim · 20 km bike · 5 km run on the same date', pct: sameDayTriathlon(.75, 20, 5) ? 100 : 0, achieved: sameDayTriathlon(.75, 20, 5) },
    { key: 'roadmap_olympic', title: 'Olympic Triathlon', detail: '1.5 km swim · 40 km bike · 10 km run on the same date', pct: sameDayTriathlon(1.5, 40, 10) ? 100 : 0, achieved: sameDayTriathlon(1.5, 40, 10) },
    { key: 'roadmap_703', title: '70.3', detail: '1.9 km swim · 90 km bike · 21.1 km run on the same date', pct: sameDayTriathlon(1.9, 90, 21.1) ? 100 : 0, achieved: sameDayTriathlon(1.9, 90, 21.1) },
    { key: 'roadmap_ironman', title: 'Ironman', detail: '3.8 km swim · 180 km bike · 42.2 km run on the same date', pct: sameDayTriathlon(3.8, 180, 42.2) ? 100 : 0, achieved: sameDayTriathlon(3.8, 180, 42.2) },
  ]
  const weightTargets = [
    { key: 'mid_weekly_average', label: `Milestone ${data.goals.midWeight} kg`, target: data.goals.midWeight },
    { key: 'final_weekly_average', label: `Target ${data.goals.targetWeight} kg`, target: data.goals.targetWeight },
  ].map(goal => {
    const hit = data.goalHistory[goal.key]?.achieved ? data.goalHistory[goal.key] : weeks.find(week => week.average >= goal.target)
    return { ...goal, hit: Boolean(hit), hitWeek: hit?.week, average: hit?.average ?? hit?.avg }
  })
  useEffect(() => {
    const achievedTargets = weightTargets.filter(goal => goal.hit && !data.goalHistory[goal.key]?.achieved)
    if (achievedTargets.length) mutate(draft => achievedTargets.forEach(goal => { draft.goalHistory[goal.key] = { achieved: true, week: goal.hitWeek, average: goal.average } }))
  // Keep a weight target achieved after first attainment.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.daily, data.goalHistory, data.goals.midWeight, data.goals.targetWeight])
  useEffect(() => {
    const unlocked = milestones.filter(goal => goal.achieved && !data.goalHistory[goal.key]?.achieved)
    if (unlocked.length) mutate(draft => { unlocked.forEach(goal => { draft.goalHistory[goal.key] = { achieved: true, date: todayISO() } }) })
  // Milestone history is sticky: once a threshold is hit, it remains achieved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.endurance, data.workoutLogs, data.goalHistory])

  const today = todayISO(), weekStart = mondayOf(today), weekEnd = addDays(weekStart, 6), previousWeekStart = addDays(weekStart, -7), previousWeekEnd = addDays(weekStart, -1)
  const currentWeekLogs = data.endurance.filter((row: AnyRow) => row.date >= weekStart && row.date <= weekEnd)
  const previousWeekLogs = data.endurance.filter((row: AnyRow) => row.date >= previousWeekStart && row.date <= previousWeekEnd)
  const plannedSessions: Array<{ date: string; kind: 'strength' | 'endurance'; session?: string; activity?: string }> = []
  for (let index = 0; index < 7; index++) {
    const date = addDays(weekStart, index), plan = planForDate(date)
    if (date > today) continue
    if (plan.muscu) plannedSessions.push({ date, kind: 'strength', session: plan.muscu })
    if (plan.endurance) plannedSessions.push({ date, kind: 'endurance', activity: plan.endurance })
  }
  const isStrengthSessionComplete = (date: string, session: string) => isFullStrengthSessionComplete(data.workoutLogs, Object.values(PROGRAM_DEFS), date, session, (def, currentSession) => setCount(targetFor(def, currentSession)))
  const { completed: completedSessions, inProgress: inProgressSessions } = summarizePlannedSessions(plannedSessions, data.workoutLogs, data.endurance, isStrengthSessionComplete)
  const consistency = plannedSessions.length ? Math.round(completedSessions / plannedSessions.length * 100) : 0
  const weeklySportDistance = (rows: AnyRow[], start: string, end: string) => rows.filter(row => row.date >= start && row.date <= end).reduce((sum, row) => sum + (n(row.distanceKm, 0) || 0), 0)
  const currentRunLogs = currentWeekLogs.filter((row: AnyRow) => row.type === 'Course')
  const previousRunLogs = previousWeekLogs.filter((row: AnyRow) => row.type === 'Course')
  const currentSwimLogs = currentWeekLogs.filter((row: AnyRow) => row.type === 'Natation')
  const previousSwimLogs = previousWeekLogs.filter((row: AnyRow) => row.type === 'Natation')
  const lastRun = runRows.at(-1), previousRun = runRows.at(-2)
  const pace = (row?: AnyRow) => row && (n(row.distanceKm, 0) || 0) > 0 ? (n(row.durationMin, 0) || 0) / (n(row.distanceKm, 0) || 1) : null
  const lastRunPace = pace(lastRun), previousRunPace = pace(previousRun)
  const paceValueText = (value: number | null) => { if (value === null) return '—'; const seconds = Math.round(value * 60); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
  const paceText = (value: number | null) => value === null ? '—' : `${paceValueText(value)} / km`
  const currentRunDistance = weeklySportDistance(currentRunLogs, weekStart, weekEnd)
  const previousRunDistance = weeklySportDistance(previousRunLogs, previousWeekStart, previousWeekEnd)
  const currentSwimDistance = weeklySportDistance(currentSwimLogs, weekStart, weekEnd)
  const previousSwimDistance = weeklySportDistance(previousSwimLogs, previousWeekStart, previousWeekEnd)
  const monthStart = (offset: number) => {
    const date = new Date(`${today.slice(0, 7)}-01T12:00:00`)
    date.setMonth(date.getMonth() + offset)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
  }
  const periods = chartPeriod === 'day' ? Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6)
    return { start: date, end: date, label: formatDate(date, { weekday: 'short' }) }
  }) : chartPeriod === 'week' ? Array.from({ length: 6 }, (_, index) => {
    const start = addDays(weekStart, (index - 5) * 7)
    return { start, end: addDays(start, 6), label: index === 5 ? 'NOW' : `W${index + 1}` }
  }) : Array.from({ length: 6 }, (_, index) => {
    const start = monthStart(index - 5), end = addDays(monthStart(index - 4), -1)
    return { start, end, label: formatDate(start, { month: 'short' }) }
  })
  const makeActualSeries = (metric: 'weight' | 'run' | 'pace' | 'swim') => periods.map(period => {
    if (metric === 'weight') {
      const matching = weights.filter(row => row.date >= period.start && row.date <= period.end)
      const value = matching.length ? matching.reduce((sum, row) => sum + row.weight, 0) / matching.length : null
      return { label: period.label, value }
    }
    const type = metric === 'swim' ? 'Natation' : 'Course'
    const matching = data.endurance.filter((row: AnyRow) => row.type === type && row.date >= period.start && row.date <= period.end)
    const timed = matching.filter((row: AnyRow) => (n(row.distanceKm, 0) || 0) > 0 && (n(row.durationMin, 0) || 0) > 0)
    const value = metric === 'pace'
      ? timed.length ? timed.reduce((sum: number, row: AnyRow) => sum + (n(row.durationMin, 0) || 0), 0) / timed.reduce((sum: number, row: AnyRow) => sum + (n(row.distanceKm, 0) || 0), 0) : null
      : matching.length ? matching.reduce((sum: number, row: AnyRow) => sum + (n(row.distanceKm, 0) || 0), 0) : null
    return { label: period.label, value }
  })
  const makeNutritionSeries = () => periods.map(period => {
    const dates = Object.keys(data.mealLogs).filter(date => date >= period.start && date <= period.end && Object.keys(data.mealLogs[date] || {}).length > 0)
    if (!dates.length) return { label: period.label, kcal: null, protein: null }
    const totals = dates.reduce((sum, date) => { const intake = totalNutrition(data, date); sum.kcal += intake.kcal; sum.protein += intake.p; return sum }, { kcal: 0, protein: 0 })
    return { label: period.label, kcal: totals.kcal / dates.length, protein: totals.protein / dates.length }
  })
  const actualChartPoints = chartMetric === 'nutrition' ? [] : makeActualSeries(chartMetric)
  const sampleValues: Record<'weight' | 'run' | 'pace' | 'swim', Record<'day' | 'week' | 'month', Array<number | null>>> = {
    weight: { day: [70, 70.1, 70, 70.2, 70.3, 70.2, 70.4], week: [70, 70.3, 70.2, 70.5, 70.8, 71], month: [68.8, 69.2, 69.5, 70, 70.5, 71] },
    run: { day: [2.4, null, 3.1, null, 4.2, null, 5.1], week: [4, 5.5, 5, 6.5, 7.2, 8.1], month: [12, 15, 17, 20, 23, 27] },
    pace: { day: [6.2, null, 6.0, null, 5.8, null, 5.6], week: [6.4, 6.2, 6.1, 6.0, 5.8, 5.7], month: [6.8, 6.6, 6.4, 6.2, 5.9, 5.7] },
    swim: { day: [.3, null, .4, null, .5, null, .7], week: [.4, .5, .4, .65, .75, .9], month: [1.2, 1.5, 1.8, 2.1, 2.6, 3] },
  }
  const nutritionSampleValues: Record<'day' | 'week' | 'month', Array<{ kcal: number; protein: number }>> = {
    day: [{ kcal: 2150, protein: 112 }, { kcal: 2280, protein: 126 }, { kcal: 2050, protein: 108 }, { kcal: 2410, protein: 139 }, { kcal: 2230, protein: 131 }, { kcal: 2520, protein: 146 }, { kcal: 2380, protein: 142 }],
    week: [{ kcal: 1980, protein: 105 }, { kcal: 2100, protein: 112 }, { kcal: 2220, protein: 118 }, { kcal: 2160, protein: 126 }, { kcal: 2320, protein: 134 }, { kcal: 2450, protein: 146 }],
    month: [{ kcal: 1850, protein: 96 }, { kcal: 1980, protein: 105 }, { kcal: 2100, protein: 112 }, { kcal: 2240, protein: 121 }, { kcal: 2370, protein: 138 }, { kcal: 2450, protein: 146 }],
  }
  const nutritionPoints = chartMetric === 'nutrition' ? showSamplePreview ? periods.map((period, index) => ({ label: period.label, ...nutritionSampleValues[chartPeriod][index] })) : makeNutritionSeries() : undefined
  const chartPoints = chartMetric === 'nutrition' ? [] : showSamplePreview ? periods.map((period, index) => ({ label: period.label, value: sampleValues[chartMetric][chartPeriod][index] ?? null })) : actualChartPoints
  const chartUnit = chartMetric === 'weight' ? 'kg' : chartMetric === 'pace' ? 'min/km' : 'km'
  const metricLabel = chartMetric === 'nutrition' ? 'Calories & protein' : chartMetric === 'weight' ? 'Weight' : chartMetric === 'run' ? 'Running distance' : chartMetric === 'pace' ? 'Running pace' : 'Swimming distance'
  const periodLabel = chartMetric === 'nutrition' ? chartPeriod === 'day' ? 'Daily intake · last 7 days' : chartPeriod === 'week' ? 'Daily average · last 6 weeks' : 'Daily average · last 6 months' : chartPeriod === 'day' ? 'Daily · last 7 days' : chartPeriod === 'week' ? 'Weekly · last 6 weeks' : 'Monthly · last 6 months'
  const chartEmptyMessage = chartMetric === 'nutrition' ? 'No nutrition logs in this period' : chartMetric === 'weight' ? 'No weigh-ins in this period' : chartMetric === 'run' ? 'No runs in this period' : chartMetric === 'pace' ? 'No timed runs in this period' : 'No swims in this period'
  const currentPoint = chartPoints.at(-1)?.value ?? null
  const previousPoint = chartPoints.at(-2)?.value ?? null
  const currentNutritionPoint = nutritionPoints?.at(-1)
  const previousNutritionPoint = nutritionPoints?.at(-2)
  const trendDelta = currentPoint !== null && previousPoint !== null ? currentPoint - previousPoint : null
  const nutritionScore = (point?: { kcal: number | null; protein: number | null }) => point?.kcal !== null && point?.kcal !== undefined && point.protein !== null ? Math.hypot((point.kcal - data.goals.calTarget) / Math.max(1, data.goals.calTarget), (point.protein - data.goals.proteinTarget) / Math.max(1, data.goals.proteinTarget)) : null
  const currentNutritionScore = nutritionScore(currentNutritionPoint), previousNutritionScore = nutritionScore(previousNutritionPoint)
  const trendDirection = chartMetric === 'nutrition' ? currentNutritionScore === null || previousNutritionScore === null ? 'unknown' : Math.abs(currentNutritionScore - previousNutritionScore) < .03 ? 'neutral' : currentNutritionScore < previousNutritionScore ? 'improved' : 'regressed' : trendDelta === null ? 'unknown' : Math.abs(trendDelta) < (chartMetric === 'weight' ? .1 : chartMetric === 'pace' ? .05 : .05) ? 'neutral' : chartMetric === 'weight' ? Math.abs(previousPoint! - data.goals.targetWeight) > Math.abs(currentPoint - data.goals.targetWeight) ? 'improved' : 'regressed' : chartMetric === 'pace' ? trendDelta < 0 ? 'improved' : 'regressed' : trendDelta > 0 ? 'improved' : 'regressed'
  const trendTone = trendDirection === 'improved' ? 'text-[var(--accent)] border-[var(--accent)]/20 bg-[var(--accent)]/[.06]' : trendDirection === 'regressed' ? 'text-amber-200 border-amber-300/20 bg-amber-300/[.06]' : 'text-zinc-400 border-white/8 bg-white/[.025]'
  const trendLabel = trendDirection === 'improved' ? 'Improved' : trendDirection === 'regressed' ? 'Regressed' : trendDirection === 'neutral' ? 'No change' : 'Not enough data'
  const nutritionDeltaKcal = currentNutritionPoint?.kcal !== null && currentNutritionPoint?.kcal !== undefined && previousNutritionPoint?.kcal !== null && previousNutritionPoint?.kcal !== undefined ? currentNutritionPoint.kcal - previousNutritionPoint.kcal : null
  const nutritionDeltaProtein = currentNutritionPoint?.protein !== null && currentNutritionPoint?.protein !== undefined && previousNutritionPoint?.protein !== null && previousNutritionPoint?.protein !== undefined ? currentNutritionPoint.protein - previousNutritionPoint.protein : null
  const deltaLabel = chartMetric === 'nutrition' ? nutritionDeltaKcal === null || nutritionDeltaProtein === null ? 'Log two comparable periods to see a trend' : `${nutritionDeltaKcal > 0 ? '+' : ''}${fmt(nutritionDeltaKcal, 0)} kcal · ${nutritionDeltaProtein > 0 ? '+' : ''}${fmt(nutritionDeltaProtein, 0)} g protein vs previous ${chartPeriod}` : trendDelta === null ? 'Log two comparable periods to see a trend' : `${trendDelta > 0 ? '+' : ''}${fmt(trendDelta, chartMetric === 'weight' ? 1 : 2)} ${chartUnit} vs previous ${chartPeriod}`
  const lastTwoWeightWeeks = weeks.slice(-2)
  const weightDelta = lastTwoWeightWeeks.length === 2 ? lastTwoWeightWeeks[1].average - lastTwoWeightWeeks[0].average : null
  const milestoneStates = milestones.map(goal => ({ ...goal, done: Boolean(goal.achieved || data.goalHistory[goal.key]?.achieved) }))
  const activeMilestones = milestoneStates.filter(goal => !goal.done && goal.pct > 0)
  const nextMilestone = milestoneStates.find(goal => !goal.done && goal.pct === 0)

  return <div className="space-y-5 sm:space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.24em] text-[var(--accent)]">Road to Ironman</div><h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">Progress</h1><p className="mt-2 text-sm text-zinc-400">Your training, made visible.</p></div><Badge tone="lime">Week of {formatDate(weekStart, { day: 'numeric', month: 'short' })}</Badge></section>
    <section className="overflow-hidden rounded-[26px] border border-[var(--accent)]/20 bg-gradient-to-br from-emerald-400/[.09] via-emerald-300/[.035] to-white/[.015] p-5 sm:p-7">
      <div className="flex items-center justify-between gap-5"><div><div className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent)]/80">Week to date</div><h2 className="mt-2 text-2xl font-black tracking-tight">Training consistency</h2><p className="mt-1 text-sm text-zinc-400">Completed planned sessions · {formatDate(weekStart)} – {formatDate(today)}</p></div><div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${consistency}%, rgba(255,255,255,.08) 0)` }}><div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-[#111512] text-xl font-black">{consistency}%</div></div></div>
      <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-xs text-zinc-400">Sessions completed</div><div className="mt-2 text-3xl font-black">{completedSessions}<span className="text-lg text-zinc-500">/{plannedSessions.length}</span></div><div className="mt-1 text-xs text-zinc-500">Planned sessions this week</div></div><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-xs text-zinc-400">Sessions in progress</div><div className="mt-2 text-3xl font-black">{inProgressSessions}</div><div className="mt-1 text-xs text-zinc-500">Partially logged strength sessions</div></div></div>
    </section>
    <section className={cn(cardClass('!p-5 sm:!p-6'), 'overflow-hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Progress trend</h2><p className="mt-1 text-xs text-zinc-500">{metricLabel} · {periodLabel}</p></div><div className="flex items-center gap-1.5"><label className="sr-only" htmlFor="progress-chart-metric">Choose graph</label><div className="relative"><select id="progress-chart-metric" value={chartMetric} onChange={event => setChartMetric(event.target.value as 'weight' | 'run' | 'pace' | 'swim' | 'nutrition')} className="h-6 min-w-[68px] appearance-none rounded-full border border-white/8 bg-white/[.04] px-2 pr-6 text-[6px] font-bold uppercase tracking-[.06em] text-zinc-300 outline-none focus:border-[var(--accent)]/40" style={{ fontSize: 10, backgroundImage: 'none' }}><option value="weight">Weight</option><option value="run">Running distance</option><option value="pace">Running pace</option><option value="swim">Swimming</option><option value="nutrition">Nutrition</option></select><ChevronDown size={9} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"/></div><button type="button" aria-pressed={showSamplePreview} onClick={() => setShowSamplePreview(value => !value)} className={cn('h-6 rounded-full border px-1.5 text-[6px] font-bold uppercase tracking-[.06em] transition', showSamplePreview ? 'border-[var(--accent)]/25 bg-[var(--accent)]/[.07] text-[var(--accent)]' : 'border-white/8 bg-white/[.025] text-zinc-500 hover:text-zinc-200')} style={{ fontSize: 9 }}>{showSamplePreview ? 'Demo' : 'Preview'}</button></div></div>
      <div className="mt-3"><div className="inline-flex rounded-lg border border-white/7 bg-black/20 p-0.5" role="group" aria-label="Choose chart period">{(['day', 'week', 'month'] as const).map(period => <button key={period} type="button" aria-pressed={chartPeriod === period} onClick={() => setChartPeriod(period)} className={cn('rounded-md px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[.06em] transition', chartPeriod === period ? 'bg-white/[.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-300')} style={{ fontSize: 9 }}>{period}</button>)}</div></div>
      <div className="mt-2"><GoalsProgressChart points={chartPoints} unit={chartUnit} emptyMessage={chartEmptyMessage} target={chartMetric === 'weight' ? data.goals.targetWeight : undefined} nutritionPoints={nutritionPoints}/></div>
      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-white/[.06] pt-3"><span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide', trendTone)}>{chartMetric === 'nutrition' && trendDirection === 'improved' ? 'Closer to targets' : chartMetric === 'nutrition' && trendDirection === 'regressed' ? 'Further from targets' : trendLabel}</span><p className="text-xs text-zinc-500">{showSamplePreview && (chartMetric === 'nutrition' ? nutritionDeltaKcal !== null : trendDelta !== null) ? `Example · ${deltaLabel}` : deltaLabel}</p></div>
      {!showSamplePreview && chartMetric === 'weight' && <details className="group mt-4 rounded-xl border border-white/7 bg-white/[.02]"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-zinc-400">Edit weight targets <span className="float-right text-zinc-600 group-open:rotate-180">⌄</span></summary><div className="grid gap-3 border-t border-white/7 p-3 sm:grid-cols-3"><Field label="Starting weight (kg)" value={goals.startWeight} onChange={value => setGoals(current => ({ ...current, startWeight: Number(value) }))} step="0.1"/><Field label="Milestone weight (kg)" value={goals.midWeight} onChange={value => setGoals(current => ({ ...current, midWeight: Number(value) }))} step="0.1"/><Field label="Target weight (kg)" value={goals.targetWeight} onChange={value => setGoals(current => ({ ...current, targetWeight: Number(value) }))} step="0.1"/><div className="sm:col-span-3"><PrimaryButton onClick={saveGoals}><Save size={14}/> Save weight targets</PrimaryButton></div></div></details>}
    </section>
    <section className={cardClass('!p-5 sm:!p-6')}><SectionHead title="Milestones in progress" meta={`${activeMilestones.length} active`}/>{activeMilestones.length ? <div className="mt-4 space-y-3">{activeMilestones.map(goal => <div key={goal.key} className="rounded-xl border border-white/7 bg-white/[.02] p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-bold">{goal.title}</div><div className="mt-1 text-xs text-zinc-500">{goal.detail}</div></div><div className="shrink-0 text-sm font-black text-[var(--accent)]">{Math.round(goal.pct)}%</div></div><Progress value={goal.pct}/></div>)}</div> : <Empty text="No milestones in progress yet. Log training to start building progress."/>}{nextMilestone && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-3"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-zinc-600">Next to start</span><span className="text-sm font-bold text-zinc-300">{nextMilestone.title}</span></div>}</section>
    <details className={cn(cardClass('!p-0'), 'group')}><summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[.05] text-zinc-400"><Flag size={17}/></div><div className="min-w-0 flex-1"><div className="font-bold">Training roadmap</div><div className="mt-1 text-xs text-zinc-500">Strength, swim, run and triathlon milestones</div></div><span className="px-2 text-lg text-zinc-500 transition group-open:rotate-180">⌄</span></summary><div className="grid gap-3 border-t border-white/7 p-4 md:grid-cols-2 sm:p-5">{milestones.map((goal, index) => { const done = Boolean(data.goalHistory[goal.key]?.achieved || goal.achieved), pct = done ? 100 : goal.pct; return <div key={goal.key} className={cn('rounded-2xl border p-4', done ? 'border-emerald-400/20 bg-emerald-400/[.035]' : 'border-white/7 bg-white/[.02]')}><div className="flex items-start gap-3"><div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', done ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[.04] text-zinc-500')}>{done ? <Check size={18}/> : <Flag size={17}/>}</div><div className="min-w-0 flex-1"><div className="font-bold">{index + 1}. {goal.title}</div><div className="mt-1 text-xs leading-5 text-zinc-500">{goal.detail}</div></div><Badge tone={done ? 'good' : pct > 0 ? 'lime' : 'muted'}>{done ? 'DONE' : `${Math.round(pct)}%`}</Badge></div><Progress value={pct}/></div> })}</div></details>
  </div>
}
function TrainingProgressView({ data }: { data: AnyRow }) {
  const strengthGroups: Record<string, AnyRow[]> = {}
  data.workoutLogs.forEach((row: AnyRow) => { const key = `${row.exerciseKey}|${row.variant || 'legacy'}`; (strengthGroups[key] ||= []).push(row) })
  const reinforcementGroups: Record<string, AnyRow[]> = {}
  data.reinforcementLogs.forEach((row: AnyRow) => (reinforcementGroups[row.exerciseKey] ||= []).push(row))
  return <div className="space-y-4">
    <section><h2 className="text-xl font-black">Training progress</h2><p className="mt-1 text-xs text-zinc-500">Strength &amp; reinforcement history</p></section>
    <section className={cardClass()}><SectionHead title="Strength progression" meta="History by exercise"/>{Object.keys(strengthGroups).length ? <div className="mt-4 space-y-2">{Object.entries(strengthGroups).map(([key, unsorted]) => { const rows = [...unsorted].sort((a, b) => a.date.localeCompare(b.date) || a.set - b.set), last = rows.at(-1)!, first = rows[0], def = PROGRAM_DEFS[last.exerciseKey], maxWeight = Math.max(...rows.map(row => n(row.weight, 0) || 0)), target = def ? targetFor(def, last.session || def.sessions?.[0] || '') : '1×8–12', recommendation = def ? strengthRecommendation(data, def, def.material === 'variant' ? (last.variant || 'smith') : '', target) : null; const history = strengthHistory(data, last.exerciseKey, last.variant || ''); return <details key={key} className="rounded-xl border border-white/7 bg-white/[.02] p-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{def?.name || last.displayName}</div><div className="mt-1 text-[11px] text-zinc-500">{last.variant && last.variant !== 'legacy' ? last.variant : 'standard'} · {rows.length} sets · since {formatDate(first.date)}</div></div><div className="shrink-0 text-right"><div className="font-black">{fmt(maxWeight)} kg</div><div className="text-[10px] text-zinc-600">best load</div></div></summary><div className="mt-3 border-t border-white/7 pt-3">{recommendation && <div className="mb-2 text-xs text-zinc-400">Next: <b className="text-[var(--accent)]">{recommendation.symbol} {fmt(recommendation.weight)} kg · {recommendation.min}–{recommendation.max} reps</b></div>}<div className="space-y-1">{rows.slice(-8).reverse().map(row => <div key={row.id} className="flex gap-2 text-[11px] text-zinc-500"><span>{formatDate(row.date)}</span><span>Set {row.set} · {fmt(row.weight)} kg × {row.reps} · RIR {row.rir}</span></div>)}</div>{history.length > 0 && <div className="mt-2 text-[10px] text-zinc-600">{history.length} logged sessions</div>}</div></details>})}</div> : <Empty text="No strength data yet. Record working sets in Training to build your history."/>}</section>
    <section className={cardClass()}><SectionHead title="Reinforcement progression" meta="History by exercise"/>{Object.keys(reinforcementGroups).length ? <div className="mt-3 space-y-2">{Object.entries(reinforcementGroups).map(([key, unsorted]) => { const rows = [...unsorted].sort((a, b) => a.date.localeCompare(b.date) || a.set - b.set), last = rows.at(-1)!, def = Object.values(REINFORCEMENT_DEFS).find((item: AnyRow) => item.key === key) as AnyRow | undefined, recommendation = def ? reinforcementRecommendation(data, def) : null; return <div key={key} className="rounded-xl border border-white/7 bg-white/[.02] p-3"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-bold">{def?.name || last.exercise}</div><div className="mt-1 text-[11px] text-zinc-500">{def?.zone || 'Reinforcement'} · {rows.length} sets</div></div><Badge>{formatDate(last.date)}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><div className="text-[10px] text-zinc-600">Latest</div><b>{last.actualValue} {last.mode === 'time' ? 'sec' : last.mode === 'test' ? 'test' : 'reps'}</b></div><div><div className="text-[10px] text-zinc-600">Resistance</div><b>{fmt(last.resistance)} kg</b></div><div><div className="text-[10px] text-zinc-600">Pain</div><b>{fmt(last.pain)}/10</b></div></div>{recommendation && <div className="mt-2 text-[11px] text-zinc-400">Next: <b className="text-[var(--accent)]">{recommendation.symbol} {recommendation.mode === 'load' ? `${fmt(recommendation.value)} kg` : recommendation.mode === 'test' ? 'repeat test' : `${recommendation.value} ${last.mode === 'time' ? 'sec' : 'reps'}`}</b></div>}<div className="mt-2 flex flex-wrap gap-1">{rows.slice(-6).map(row => <span key={row.id} className="rounded-lg bg-white/[.04] px-2 py-1 text-[10px] text-zinc-500">{formatDate(row.date)} · {row.actualValue}{row.mode === 'time' ? 's' : ''}</span>)}</div></div>})}</div> : <Empty text="No reinforcement data yet. Log sessions in Training to build your history."/>}</section>
  </div>
}
function GoalsProgressChart({ points, unit, emptyMessage, target, nutritionPoints }: { points: Array<{ label: string; value: number | null }>; unit: 'kg' | 'km' | 'min/km'; emptyMessage: string; target?: number; nutritionPoints?: Array<{ label: string; kcal: number | null; protein: number | null }> }) {
  if (nutritionPoints) return <NutritionProgressChart points={nutritionPoints} emptyMessage={emptyMessage}/>
  const values = points.map(point => point.value).filter((value): value is number => value !== null && Number.isFinite(value))
  const hasData = values.length > 0
  let low = 0, high = unit === 'kg' ? 100 : unit === 'min/km' ? 10 : 5
  if (hasData && unit === 'kg') {
    const minValue = Math.min(...values, ...(target ? [target] : [])), maxValue = Math.max(...values, ...(target ? [target] : []))
    low = Math.max(0, Math.floor((minValue - 2) / 5) * 5)
    high = Math.ceil((maxValue + 2) / 5) * 5
    if (high - low < 10) high = low + 10
  } else if (hasData && unit === 'min/km') {
    const minValue = Math.min(...values), maxValue = Math.max(...values)
    low = Math.max(0, Math.floor((minValue - .2) * 5) / 5)
    high = Math.ceil((maxValue + .2) * 5) / 5
    if (high - low < .6) { low = Math.max(0, low - .2); high += .2 }
  } else if (hasData) high = Math.max(1, Math.ceil(Math.max(...values) * 1.25 * 2) / 2)
  const width = 600, height = 280, left = 44, right = 18, top = 20, bottom = 38
  const x = (index: number) => left + index * (width - left - right) / Math.max(1, points.length - 1)
  const y = (value: number) => unit === 'min/km'
    ? top + (value - low) * (height - top - bottom) / (high - low || 1)
    : top + (high - value) * (height - top - bottom) / (high - low || 1)
  const valid = points.map((point, index) => point.value === null ? null : { x: x(index), y: y(point.value), value: point.value }).filter((point): point is { x: number; y: number; value: number } => point !== null)
  const linePath = valid.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = valid[index - 1], controlX = (previous.x + point.x) / 2
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, '')
  const areaPath = valid.length ? `${linePath} L ${valid[valid.length - 1].x} ${height - bottom} L ${valid[0].x} ${height - bottom} Z` : ''
  return <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label={`${unit === 'kg' ? 'Weight' : unit === 'min/km' ? 'Running pace in minutes per kilometer' : 'Distance'} progression over the selected periods`}>
    <defs><linearGradient id="progress-line" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#caff4a"/><stop offset="100%" stopColor="#66d9d0"/></linearGradient><linearGradient id="progress-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#caff4a" stopOpacity=".17"/><stop offset="100%" stopColor="#66d9d0" stopOpacity="0"/></linearGradient></defs>
    {[0, .5, 1].map(fraction => { const value = low + (high - low) * fraction, yy = y(value); return <g key={fraction}><line x1={left} x2={width - right} y1={yy} y2={yy} stroke="rgba(255,255,255,.075)"/><text x={left - 8} y={yy + 3} textAnchor="end" fontSize="11" fill="#717a84">{fmt(value, unit === 'kg' ? 0 : unit === 'min/km' ? 2 : 1)}</text></g> })}
    {target !== undefined && target >= low && target <= high && <><line x1={left} x2={width - right} y1={y(target)} y2={y(target)} stroke="rgba(202,255,74,.4)" strokeDasharray="5 5"/><text x={width - right} y={y(target) - 6} textAnchor="end" fontSize="11" fill="#caff4a">Target {fmt(target)} kg</text></>}
    {hasData && <><path d={areaPath} fill="url(#progress-area)"/><path d={linePath} fill="none" stroke="url(#progress-line)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></>}
    {points.map((point, index) => <g key={point.label}>{point.value !== null && <><circle cx={x(index)} cy={y(point.value)} r={index === points.length - 1 ? 10 : 7} fill="#caff4a" opacity={index === points.length - 1 ? '.16' : '.1'}/><circle cx={x(index)} cy={y(point.value)} r={index === points.length - 1 ? 4.5 : 3.5} fill={index === points.length - 1 ? '#f2ffb5' : '#caff4a'}/><title>{`${point.label}: ${fmt(point.value, unit === 'min/km' ? 2 : 1)} ${unit}`}</title></>}<text x={x(index)} y={height - 7} textAnchor="middle" fontSize="11" fill={index === points.length - 1 ? '#caff4a' : '#717a84'}>{point.label}</text></g>)}
    {!hasData && <text x={width / 2} y={height / 2 - 4} textAnchor="middle" fontSize="12" fill="#717a84">{emptyMessage}</text>}
  </svg>
}
function NutritionProgressChart({ points, emptyMessage }: { points: Array<{ label: string; kcal: number | null; protein: number | null }>; emptyMessage: string }) {
  const width = 600, height = 280, left = 48, right = 48, top = 20, bottom = 38
  const x = (index: number) => left + index * (width - left - right) / Math.max(1, points.length - 1)
  const calorieValues = points.map(point => point.kcal).filter((value): value is number => value !== null && Number.isFinite(value))
  const proteinValues = points.map(point => point.protein).filter((value): value is number => value !== null && Number.isFinite(value))
  const hasData = calorieValues.length > 0 || proteinValues.length > 0
  const calorieMax = Math.max(500, Math.ceil(Math.max(...calorieValues, 0) * 1.2 / 500) * 500)
  const proteinMax = Math.max(25, Math.ceil(Math.max(...proteinValues, 0) * 1.2 / 25) * 25)
  const plotHeight = height - top - bottom
  const yCalories = (value: number) => top + (calorieMax - value) * plotHeight / calorieMax
  const yProtein = (value: number) => top + (proteinMax - value) * plotHeight / proteinMax
  const linePath = (key: 'kcal' | 'protein', y: (value: number) => number) => {
    let path = '', previous: { x: number; y: number } | null = null
    points.forEach((point, index) => {
      const value = point[key]
      if (value === null || !Number.isFinite(value)) { previous = null; return }
      const current = { x: x(index), y: y(value) }
      if (!previous) path += `M ${current.x} ${current.y}`
      else { const controlX = (previous.x + current.x) / 2; path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}` }
      previous = current
    })
    return path
  }
  const caloriePath = linePath('kcal', yCalories), proteinPath = linePath('protein', yProtein)
  const ticks = [0, .5, 1]
  return <div>
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-zinc-400"><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-amber-300"/>Calories · kcal/day</span><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-rose-300"/>Protein · g/day</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label="Calories and protein intake progression, each with its own scale">
      {ticks.map(fraction => { const y = top + plotHeight * (1 - fraction), kcal = calorieMax * fraction, protein = proteinMax * fraction; return <g key={fraction}><line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(255,255,255,.075)"/><text x={left - 8} y={y + 3} textAnchor="end" fontSize="11" fill="#fbbf24">{fmt(kcal, 0)}</text><text x={width - right + 8} y={y + 3} fontSize="11" fill="#fb7185">{fmt(protein, 0)}</text></g> })}
      {hasData && <><path d={caloriePath} fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d={proteinPath} fill="none" stroke="#fb7185" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></>}
      {points.map((point, index) => <g key={point.label}>{point.kcal !== null && <><circle cx={x(index)} cy={yCalories(point.kcal)} r="3.5" fill="#fbbf24"/><title>{`${point.label}: ${fmt(point.kcal, 0)} kcal/day`}</title></>}{point.protein !== null && <><circle cx={x(index)} cy={yProtein(point.protein)} r="3.5" fill="#fb7185"/><title>{`${point.label}: ${fmt(point.protein, 0)} g protein/day`}</title></>}<text x={x(index)} y={height - 7} textAnchor="middle" fontSize="11" fill={index === points.length - 1 ? '#caff4a' : '#717a84'}>{point.label}</text></g>)}
      {!hasData && <text x={width / 2} y={height / 2 - 4} textAnchor="middle" fontSize="12" fill="#717a84">{emptyMessage}</text>}
      {!hasData && <text x={width / 2} y={height / 2 - 4} textAnchor="middle" fontSize="12" fill="#717a84">{emptyMessage}</text>}
    </svg>
  </div>
}
function NutritionWeekVisual({ days, calorieTarget, proteinTarget }: { days: Array<{ date: string; label: string; logged: boolean; future: boolean; kcal: number; protein: number }>; calorieTarget: number; proteinTarget: number }) {
  const track = (value: number, target: number) => target > 0 ? Math.min(100, value / target * 100) : 0
  return <div className="space-y-3"><div className="grid grid-cols-[38px_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-1 text-[10px] font-bold uppercase tracking-[.12em] text-zinc-600"><span>Day</span><span>Calories</span><span>Protein</span></div>{days.map(day => <div key={day.date} className="grid grid-cols-[38px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 rounded-xl border border-white/[.045] bg-white/[.015] px-2 py-2.5"><div className="text-xs font-bold text-zinc-400">{day.label}</div>{day.logged ? <><div className="min-w-0"><div className="truncate text-[11px] font-semibold text-zinc-300">{fmt(day.kcal, 0)} <span className="font-normal text-zinc-600">/ {fmt(calorieTarget, 0)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-amber-300" style={{ width: `${track(day.kcal, calorieTarget)}%` }}/></div></div><div className="min-w-0"><div className="truncate text-[11px] font-semibold text-zinc-300">{fmt(day.protein, 0)} g <span className="font-normal text-zinc-600">/ {fmt(proteinTarget, 0)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-rose-300" style={{ width: `${track(day.protein, proteinTarget)}%` }}/></div></div></> : <><div className="text-[11px] text-zinc-700">{day.future ? 'Upcoming' : 'No log'}</div><div className="text-[11px] text-zinc-700">{day.future ? 'Upcoming' : 'No log'}</div></>}</div>)}</div>
}
function HistoryView({ data, mutate, notify, resetData, exportData }: { data: AnyRow; mutate: Mutate; notify: (message: string) => void; resetData: () => void; exportData: () => void }) {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all')
  const grouped: Record<string, Array<{ id: string; type: string; text: string; category: string; remove: () => void }>> = {}
  const add = (date: string, item: { id: string; type: string; text: string; category: string; remove: () => void }) => { (grouped[date] ||= []).push(item) }
  Object.entries(data.daily as Record<string, AnyRow>).forEach(([date, row]: [string, AnyRow]) => { const details = [row.weight != null && `weight ${fmt(row.weight)} kg`, row.sleep != null && `sleep ${fmt(row.sleep)} h`, row.shoulder != null && `shoulder ${row.shoulder}/10`, row.ankle != null && `ankle ${row.ankle}/10`, row.back != null && `back ${row.back}/10`, row.notes && `notes: ${row.notes}`].filter(Boolean).join(' · '); if (details) add(date, { id: `daily-${date}`, type: 'Check-in', text: details, category: 'checkin', remove: () => { if (!window.confirm('Delete this daily check-in?')) return; mutate(d => { delete d.daily[date] }); notify('Check-in deleted') } }) })
  data.workoutLogs.forEach((row: AnyRow) => add(row.date, { id: row.id, type: row.displayName || row.exerciseKey, text: `Set ${row.set} · ${fmt(row.weight)} kg × ${row.reps} · RIR ${row.rir} · pain ${row.painDuring ?? row.pain ?? 0}/10${row.variant && row.variant !== 'legacy' ? ` · ${row.variant}` : ''}`, category: 'strength', remove: () => { mutate(d => { d.workoutLogs = d.workoutLogs.filter((x: AnyRow) => x.id !== row.id) }); notify('Workout entry deleted') } }))
  data.reinforcementLogs.forEach((row: AnyRow) => add(row.date, { id: row.id, type: row.exercise || row.exerciseKey, text: `Set ${row.set} · ${row.actualValue} ${row.mode === 'time' ? 'sec' : row.mode === 'test' ? 'test' : 'reps'} · resistance ${fmt(row.resistance)} kg · pain ${fmt(row.pain)}/10`, category: 'reinforcement', remove: () => { mutate(d => { d.reinforcementLogs = d.reinforcementLogs.filter((x: AnyRow) => x.id !== row.id) }); notify('Reinforcement entry deleted') } }))
  data.endurance.forEach((row: AnyRow) => add(row.date, { id: row.id, type: row.type, text: `${fmt(row.distanceKm, 2)} km · ${row.durationMin} min · RPE ${row.rpe} · pain ${row.pain}/10`, category: 'endurance', remove: () => { mutate(d => { d.endurance = d.endurance.filter((x: AnyRow) => x.id !== row.id) }); notify('Endurance entry deleted') } }))
  Object.entries(data.mealLogs as Record<string, AnyRow>).forEach(([date, mealSlots]: [string, AnyRow]) => Object.entries(mealSlots as Record<string, AnyRow> || {}).forEach(([slot, entry]: [string, AnyRow]) => { const snap = entry?.snapshot; if (snap) add(date, { id: `${date}-${slot}`, type: `${slots.find(x => x.id === slot)?.label || slot}: ${snap.name}`, text: `${Math.round(snap.kcal || 0)} kcal · ${fmt(snap.p, 0)} g protein · ${fmt(snap.c, 0)} g carbs · ${fmt(snap.f, 0)} g fat`, category: 'nutrition', remove: () => { if (!window.confirm('Remove this meal from this day?')) return; mutate(d => { delete d.mealLogs[date][slot] }); notify('Meal removed from day') } }) }))
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const totalEntries = Object.values(grouped).reduce((sum, rows) => sum + rows.length, 0)
  return <div className="space-y-5"><section><h1 className="text-3xl font-black tracking-[-.04em]">History</h1></section>
    <section className={cardClass()}><div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]"><Field label="Search history" type="text" value={query} onChange={setQuery} placeholder="Search exercises, notes, meals…"/><label className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.15em] text-zinc-600">Type</span><select value={filter} onChange={e => setFilter(e.target.value)} className="h-11 w-full rounded-xl border border-white/8 bg-black/20 px-3 text-sm"><option value="all">All entries</option><option value="checkin">Check-ins</option><option value="strength">Strength</option><option value="reinforcement">Reinforcement</option><option value="endurance">Endurance</option><option value="nutrition">Nutrition</option></select></label><div className="flex items-end"><Badge>{totalEntries} entries</Badge></div></div><div className="mt-5 space-y-4">{dates.map(date => { const filtered = grouped[date].filter(row => (filter === 'all' || row.category === filter) && `${row.type} ${row.text}`.toLowerCase().includes(query.toLowerCase())); if (!filtered.length) return null; return <div key={date}><div className="mb-2 flex items-center gap-3 bg-transparent py-2"><span className="text-xs font-black uppercase tracking-[.15em] text-zinc-500">{formatDate(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span><div className="h-px flex-1 bg-white/7"/></div><div className="space-y-2">{filtered.map(row => <div key={row.id} className="flex items-start gap-3 rounded-xl border border-white/7 bg-white/[.02] p-3"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[.04] text-zinc-500">{row.category === 'strength' ? <Dumbbell size={14}/> : row.category === 'endurance' ? <Activity size={14}/> : row.category === 'nutrition' ? <Salad size={14}/> : row.category === 'checkin' ? <Weight size={14}/> : <Sparkles size={14}/>}</div><div className="min-w-0 flex-1"><div className="break-words text-sm font-bold">{row.type}</div><div className="mt-1 break-words text-xs leading-5 text-zinc-500">{row.text}</div></div><button aria-label="Delete history record" onClick={row.remove} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-red-400/10 hover:text-red-300"><Trash2 size={14}/></button></div>)}</div></div> })}{!dates.some(date => grouped[date].some(row => (filter === 'all' || row.category === filter) && `${row.type} ${row.text}`.toLowerCase().includes(query.toLowerCase()))) && <Empty text="No history entries match your filter."/>}</div></section>
    <section className="grid gap-4 sm:grid-cols-2"><div className={cardClass()}><SectionHead title="Backup your data"/><div className="mt-5 flex justify-center"><PrimaryButton onClick={exportData}><Download size={14}/> Export all data</PrimaryButton></div></div><div className={cardClass()}><SectionHead title="Danger zone" meta="Irreversible"/><p className="mt-3 text-xs leading-5 text-zinc-500">Reset permanently clears data stored in this browser for the app. Export a JSON backup first.</p><div className="mt-5 flex justify-center"><PrimaryButton danger onClick={resetData}><Trash2 size={14}/> Delete all data</PrimaryButton></div></div></section>
  </div>
}
