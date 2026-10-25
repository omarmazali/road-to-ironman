# Road to Ironman — V3 changes

## UI corrections
- Check-in confirmation now only confirms that today's check-in is saved; it no longer repeats backup instructions.
- Centered and spaced the Open training, Manage nutrition, Save set, Export all data, Delete all data, and meal-save actions.
- Select controls use an in-field chevron and reserve right padding so arrows do not overflow narrow layouts.
- History date separators no longer have a black opaque background strip.

## Nutrition calculator
- Meal builder now starts in ingredient mode.
- Select from a local list of common foods and set each amount in grams.
- Meal calories, protein, carbs and fat update automatically from the per-100 g values.
- Add custom foods from their packaging values and reuse them in future meals.
- A live summary shows calculated meal totals before saving.
- Optional quick-total entry remains available for legacy meals/imported nutrition records.
- Meal snapshots keep ingredient portions and totals for the logged day even if library foods or meals are edited later.

## Compatibility and validation
- Kept the local storage key `roadToTriathlonV3` for V59 compatibility.
- TSX syntax checks and a targeted TypeScript check with temporary dependency declarations passed.
- Full Next.js build/lint were not run because npm dependency installation timed out in this environment.
