export type IngredientNutrition = {
  grams?: number | string | null
  kcal100?: number | string | null
  p100?: number | string | null
  c100?: number | string | null
  f100?: number | string | null
}

export type NutritionTotals = { kcal: number; p: number; c: number; f: number }

function numeric(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Calculates meal totals from per-100 g/ml ingredient nutrition values. */
export function calculateIngredientNutrition(ingredients: IngredientNutrition[] = []): NutritionTotals {
  return ingredients.reduce<NutritionTotals>((total, item) => {
    const portion = Math.max(0, numeric(item.grams)) / 100
    total.kcal += portion * numeric(item.kcal100)
    total.p += portion * numeric(item.p100)
    total.c += portion * numeric(item.c100)
    total.f += portion * numeric(item.f100)
    return total
  }, { kcal: 0, p: 0, c: 0, f: 0 })
}
