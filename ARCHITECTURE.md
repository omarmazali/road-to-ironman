# Architecture — Road to Ironman

## Current prototype

```text
Next.js App Router
  app/page.tsx
    components/app-shell.tsx  -> view navigation and UI components
  app/api/foods/search/route.ts -> explicit Open Food Facts product search proxy
      lib/program.ts         -> workout definitions, cycle, loads and rehab plan
      browser localStorage   -> persistence under roadToTriathlonV3
      JSON import/export     -> backup and V59 data migration
```

The current prototype is client-driven and local-first. The program definitions are kept outside the UI to make the workout catalogue and progression rules easier to test and maintain. The application intentionally does not require a database or paid API to run.

## Domain boundaries

- `lib/program.ts`: exercise and reinforcement definitions, targets, cycle and equipment load increments. Treat these as domain source-of-truth data rather than re-declaring them in UI components.
- `components/app-shell.tsx`: navigation and views for dashboard, training, nutrition, goals, performance and history. It owns local persistence orchestration for this prototype.
- `FEATURES.md`: feature checklist that should be updated when behavior is deliberately changed.
- `.github/copilot-instructions.md`: non-regression requirements for future Copilot edits.

## Data shape

The persisted state includes goals, daily check-ins, workout logs, reinforcement logs, endurance sessions, reusable meals, per-day meal snapshots, supplement definitions and daily intake, variant choices and milestone history. JSON import accepts the V59 daily-field aliases and older reinforcement/endurance shapes; export includes the full editable app state.

Nutrition product search calls Open Food Facts only after an explicit user search; local starter foods and personal foods remain available offline. External results are attributed and copied into meal ingredient snapshots with their source and barcode. The browser key remains `roadToTriathlonV3` to maximize compatibility with V59 when served from the same origin. Local storage is origin-specific, so moving from a `file://` page or another domain may require exporting the V59 JSON and importing it into the new app.

## Production target

Before treating this as a multi-user production app, separate domain logic into pure modules and persistence into repositories:

```text
features/
  dashboard/
  training/
  reinforcement/
  endurance/
  nutrition/
  goals/
  performance/
services/
  progression-engine/
  goal-engine/
  analytics-engine/
repositories/
  user-repository/
  workout-repository/
  nutrition-repository/
  goal-repository/
infra/
  postgres/
  auth/
```

The next production step would add schema validation, automated tests for progression and migration, authentication, server-backed persistence and safe repository boundaries before adding real cross-device sync.
