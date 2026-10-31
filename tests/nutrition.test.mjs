import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateIngredientNutrition } from '../lib/nutrition.ts'

test('calculates macros proportionally for an ingredient portion', () => {
  const totals = calculateIngredientNutrition([{ grams: 50, kcal100: 200, p100: 10, c100: 20, f100: 4 }])
  assert.deepEqual(totals, { kcal: 100, p: 5, c: 10, f: 2 })
})

test('adds nutrition from multiple ingredients and parses decimal commas', () => {
  const totals = calculateIngredientNutrition([
    { grams: '60', kcal100: '370', p100: '13,2', c100: '62', f100: '7' },
    { grams: '200', kcal100: '59', p100: '10,3', c100: '3,6', f100: '0,4' },
  ])
  assert.deepEqual(totals, { kcal: 340, p: 28.52, c: 44.4, f: 5 })
})

test('returns zero totals for empty ingredients and ignores negative portions', () => {
  assert.deepEqual(calculateIngredientNutrition(), { kcal: 0, p: 0, c: 0, f: 0 })
  assert.deepEqual(calculateIngredientNutrition([{ grams: -25, kcal100: 400, p100: 80 }]), { kcal: 0, p: 0, c: 0, f: 0 })
})

test('treats missing or invalid nutrition values as zero without producing NaN', () => {
  assert.deepEqual(calculateIngredientNutrition([{ grams: '100', kcal100: 'unknown', p100: undefined, c100: null, f100: 5 }]), { kcal: 0, p: 0, c: 0, f: 5 })
})
