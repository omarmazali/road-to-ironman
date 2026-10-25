# Feature checklist — Road to Ironman V59 → Next.js prototype

This file records the current implementation surface so future edits can avoid accidental regressions.

## Dashboard
- [x] Goal banner with start / target weight progression.
- [x] Last recorded weight and weekly average based only on saved weigh-ins.
- [x] Today's calories and protein calculated from logged meal snapshots.
- [x] Seven-day training overview; selecting a date opens that day's training plan.
- [x] Daily check-in: weight, sleep, shoulder pain, ankle pain, back pain and notes.
- [x] Check-in locks after saving for the current day.
- [x] Daily supplement intake checklist.

## Training
- [x] Date-relative seven-day cycle; supports reviewing past/future dates.
- [x] Upper A, Lower A, Upper B and Lower B exercise plans with session-specific prescriptions.
- [x] Strength set logging: variant, load, reps, RIR and pain.
- [x] Smith / dumbbell selection for bench press; variant is locked after a set is recorded for that date/session.
- [x] Per-set edit and delete controls.
- [x] Recommendations from completed sessions with double progression, pain-driven reduction, RIR check and 20% load-jump ceiling.
- [x] Reinforcement catalogue for back, shoulder and ankle, including repetition, per-side, duration and test modes.
- [x] Reinforcement sets log actual reps/duration, resistance and pain; separate history and recommendations.
- [x] Endurance activity logs for running, swimming, cycling, triathlon and other activity; distance, duration, RPE and pain.

## Nutrition
- [x] Four meal slots: breakfast, lunch, dinner and snacks.
- [x] Shared reusable meal library with create/edit/delete.
- [x] Ingredient-based meal builder: select foods, enter grams, and automatically total calories, protein, carbohydrates and fats.
- [x] Local starter food catalog and Open Food Facts product search; users can save custom foods from product-label values for reuse.
- [x] Search runs on explicit submit, not each keystroke; selected product values retain source and barcode in meal snapshots.
- [x] Live calculated meal summary before saving, plus a secondary manual-total mode for legacy or exceptional meals.
- [x] Calories, protein, carbohydrates, fats and portion notes.
- [x] Historical meal assignment snapshots so library edits do not retroactively rewrite logged nutrition.
- [x] Supplement creation with dose/unit, daily intake log and removal.

## Goals and performance
- [x] Editable start / milestone / target weights, daily calorie target and protein target.
- [x] Weight chart and weekly average review.
- [x] Persistent milestones for strength base, 500 m swim, 5 km / 10 km run, 1 km swim, half marathon, sprint triathlon, Olympic triathlon, 70.3 and Ironman.
- [x] Running, swimming and cycling mileage summaries.
- [x] Strength progression grouped by exercise and variant.
- [x] Reinforcement progression kept separate from strength lifts.
- [x] Weekly review based on actual recorded weight measurements.

## History and portability
- [x] All entries grouped by date with search and category filter.
- [x] Individual record deletion for check-ins, strength sets, reinforcement sets, endurance sessions and meal assignments.
- [x] Full JSON export.
- [x] JSON import that normalizes V59 daily field names and legacy reinforcement/endurance field variants.
- [x] Local storage key matches V59 (`roadToTriathlonV3`).
- [x] Full local-data reset with confirmation.

## Product / UX constraints
- [x] Keep the dark visual language, lime accent, glass-like cards and rounded controls from prototype V1.
- [x] Center key call-to-action buttons with visible separation from explanatory text.
- [x] Keep select chevrons inside their controls on mobile and desktop.
- [x] History date headers use a transparent background rather than a black sticky strip.
- [x] Responsive layout and horizontally scrollable main nav.
- [x] Touch swipe between top-level sections, excluding form fields and controls.
- [x] Do not fabricate training, weight or nutrition measurements.
- [x] No paid API or database required for the current prototype.

## Current limitations to remember
- Persistence is browser-local; no login, server sync or multi-device data sharing.
- Check-in becomes read-only after saving for the day; history can delete an entry, but does not offer an inline edit flow for check-in measurements.
- Exercise set editing uses small browser prompts rather than a custom modal; a later UI pass can replace these while preserving the same data behavior.
- The app currently relies on client-side TypeScript/React domain logic; add automated tests for recommendations and migration before production use.
