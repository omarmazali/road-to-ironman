import { NextRequest, NextResponse } from 'next/server'

type Product = {
  code?: string
  product_name?: string
  product_name_fr?: string
  brands?: string | string[]
  quantity?: string
  nutriments?: Record<string, number | string | undefined>
}

function nutrient(values: Product['nutriments'], key: string) {
  const raw = values?.[key]
  if (raw === undefined || raw === null || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || ''
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: 'Enter between 2 and 100 characters.' }, { status: 400 })
  }

  try {
    const response = await fetch('https://search.openfoodfacts.org/search', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'RoadToIronman/0.1 (nutrition food search)',
      },
      body: JSON.stringify({
        q: query,
        langs: ['fr', 'en'],
        page: 1,
        page_size: 20,
        fields: ['code', 'product_name', 'product_name_fr', 'brands', 'quantity', 'nutriments'],
      }),
      next: { revalidate: 300 },
    })
    if (!response.ok) return NextResponse.json({ error: 'Open Food Facts is temporarily unavailable.' }, { status: 502 })

    const payload = await response.json() as { hits?: Product[] }
    const products = (payload.hits || []).flatMap(product => {
      const name = product.product_name_fr?.trim() || product.product_name?.trim()
      const code = product.code?.trim()
      const quantity = product.quantity?.trim() || ''
      const values = product.nutriments
      const label = `${name || ''} ${quantity}`
      const powdered = /\b(poudre|powder|powdered)\b/i.test(label)
      const liquid = !powdered && (/\b(lait|milk|boisson|drink|eau|water|jus|juice|huile|oil|soupe|soup|nectar|sirop|syrup|smoothie)\b/i.test(label)
        || /\d+(?:[.,]\d+)?\s*(?:ml|cl|l)\b/i.test(quantity))
      const volumeKcal = nutrient(values, 'energy-kcal_100ml') ?? (nutrient(values, 'energy-kj_100ml') === null ? null : nutrient(values, 'energy-kj_100ml')! / 4.184)
      const volumeProtein = nutrient(values, 'proteins_100ml')
      const volumeCarbs = nutrient(values, 'carbohydrates_100ml')
      const volumeFat = nutrient(values, 'fat_100ml')
      const hasVolumeNutrition = volumeKcal !== null && volumeProtein !== null && volumeCarbs !== null && volumeFat !== null
      const density = /\b(lait|milk)\b/i.test(label) ? 1.03 : /\b(huile|oil)\b/i.test(label) ? 0.92 : 1
      const weightKcal = nutrient(values, 'energy-kcal_100g') ?? (nutrient(values, 'energy-kj_100g') ?? 0) / 4.184
      const weightProtein = nutrient(values, 'proteins_100g')
      const weightCarbs = nutrient(values, 'carbohydrates_100g')
      const weightFat = nutrient(values, 'fat_100g')
      const unit = liquid ? 'ml' : 'g'
      const multiplier = liquid && !hasVolumeNutrition ? density : 1
      const kcal = (liquid && hasVolumeNutrition ? volumeKcal! : weightKcal) * multiplier
      const protein = (liquid && hasVolumeNutrition ? volumeProtein! : weightProtein) === null ? null : (liquid && hasVolumeNutrition ? volumeProtein! : weightProtein!) * multiplier
      const carbs = (liquid && hasVolumeNutrition ? volumeCarbs! : weightCarbs) === null ? null : (liquid && hasVolumeNutrition ? volumeCarbs! : weightCarbs!) * multiplier
      const fat = (liquid && hasVolumeNutrition ? volumeFat! : weightFat) === null ? null : (liquid && hasVolumeNutrition ? volumeFat! : weightFat!) * multiplier
      if (!name || !code || kcal <= 0 || protein === null || carbs === null || fat === null) return []
      return [{
        id: `off-${code}`, code, name,
        brand: Array.isArray(product.brands) ? product.brands.join(', ') : product.brands?.trim() || '',
        quantity, unit,
        kcal100: Math.round(kcal * 10) / 10, p100: protein, c100: carbs, f100: fat,
        source: 'Open Food Facts', sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
      }]
    })
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ error: 'Could not reach Open Food Facts. Check your connection and try again.' }, { status: 502 })
  }
}
