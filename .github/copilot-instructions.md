# Copilot instructions — Road to Ironman

## Goal
Extend the existing Road to Ironman app without losing the features already ported from V59 or the prototype V1 visual identity. Read `FEATURES.md` and `ARCHITECTURE.md` before making structural changes.

## Visual and UX rules
- Preserve the dark charcoal/blue-black palette, lime accent (`--accent`), border opacity, glass-like panels, rounded cards, compact typography and mobile-first spacing already in `app/globals.css` and `components/app-shell.tsx`.
- Keep the navigation horizontally scrollable on small screens and retain swipe navigation between main sections.
- Prefer clear, small interactions over decorative complexity. Keep touch targets comfortable and input labels visible.
- Keep primary action buttons visually separated from the text above and center the important card actions where appropriate.
- Keep select controls within the available width; the dropdown chevron must stay inside the field at all screen sizes.
- History date separators should not introduce an opaque black strip behind the date label.
- A saved check-in confirmation should only confirm saving; do not repeat backup/export instructions in that message.
- Avoid replacing real data with hard-coded demo numbers. Empty states must be honest and helpful.

## Domain rules
- `lib/program.ts` is the source of truth for the workout program, session prescriptions, reinforcement plan, cycle and load increments.
- Keep strength and reinforcement histories separate. Never compare reinforcement values to strength exercises.
- A session is date-relative to `START_DATE`; preserve historical logs when the schedule is reviewed.
- A variant exercise's history must remain separated by variant (`smith` and `dumbbell`). The selected variant becomes locked after a set has been saved for a date/session.
- Strength progression uses the last completed prescription, the target rep range, RIR and reported pain. Reduce load when pain is at least 3/10 or the minimum rep threshold is missed. Only raise load when the top of the range is met with at least 2 RIR and the next available increment is not greater than 20%; otherwise progress reps first.
- Reinforcement progression follows each definition's mode (`reps`, `perSide`, `time`, or `test`), resistance rules and pain score.
- Do not invent weight measurements, nutrition data or endurance sessions. Weekly averages must be computed from actual recorded weights.
- Meal creation should default to an ingredient builder. For every ingredient, store its quantity in grams and nutrition values per 100 g, then calculate meal totals automatically. Keep a local reusable food catalog and allow custom foods using package-label values. Label starter-food values as estimates and allow optional quick-total entry for legacy/imported meals.
- Meal logs store a nutrition snapshot including macros and ingredient portions; changing or deleting a library meal/food must not retroactively alter older logged meals.
- Milestones remain achieved once recorded in `goalHistory`.

## Data and migration
- Current browser storage key is `roadToTriathlonV3` to remain compatible with V59.
- Keep import tolerant of V59 exports, including daily aliases (`sleepHours`, `shoulderPain`, `anklePain`, `backPain`) and historic reinforcement/endurance field variants.
- Preserve unknown legacy log fields where possible instead of silently dropping historical data.
- Export must include all user-entered state: goals, daily check-ins, workouts, reinforcement, endurance, meal library and daily snapshots, supplements/logs, variant choices and goal history.
- Warn users before destructive reset or replacement import; encourage JSON export before data reset/import.
- Do not add backend dependencies, secrets, analytics or paid API requirements without an explicit product decision.

## Code organization and checks
- Keep program/domain constants in `lib/program.ts`; UI in `components/`; app routing in `app/`.
- Keep helpers deterministic and avoid browser globals during server rendering. `localStorage`, downloads and prompts must be used from client-side interactions/effects only.
- If touching recommendations or migrations, add/update tests or a deterministic example where practical.
- Run `npm run lint` and `npm run build` before claiming a change is verified. If dependency installation/network blocks checks, state that limitation clearly.
