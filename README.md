# Road to Ironman

A local-first training and nutrition application built with Next.js App Router, React, TypeScript, Tailwind CSS and Lucide icons. The prototype UI is preserved (dark surfaces, lime accent, rounded cards, swipeable navigation) while the feature set from Road to Ironman V59 has been brought into the Next.js app.

## Features

- Overview dashboard with current training plan, 7-day schedule, latest recorded weight, weekly average, nutrition totals, daily check-in and supplement checklist.
- Date-relative 7-day cycle for Upper A / Lower A / recovery / Upper B / Lower B / Upper B / Upper A.
- Full strength exercise catalogue, session-specific targets, Smith/dumbbell variant lock per session, set-level load / reps / RIR / pain logging, editing and deletion.
- Load recommendations based on the last completed session, rep-range progression, pain response and a 20% maximum jump to the next available load.
- Back, shoulder and ankle reinforcement / rehabilitation catalogue, set logs, resistance, repetitions or duration, pain tracking, progression suggestions and independent performance history.
- Endurance sessions for running, swimming, cycling, triathlon and other activities, including distance, duration, RPE and pain.
- Nutrition with an ingredient-based meal builder: search local foods, saved personal foods and Open Food Facts products, set grams, and automatically calculate calories and macros. Includes a local starter catalog, reusable label-based foods, a secondary manual-total option for legacy or exceptional meals, daily meal slots and immutable nutrition snapshots.
- Supplement library, dose/unit tracking and daily intake checklist.
- Weight and macro targets, weight trend chart, weekly averages and persistent run/swim/triathlon milestones.
- Performance summaries for endurance totals, strength by exercise and variant, reinforcement trends and weekly weight review.
- Date-grouped history with search, category filtering and per-entry deletion.
- JSON export/import, reset controls, `localStorage` persistence and compatibility with the JSON format exported by V59.
- Mobile-responsive layout, horizontal navigation and swipe navigation between sections. Key card actions are spaced and centered; select arrows are kept inside fields and history date headings have no opaque black strip.

See [FEATURES.md](./FEATURES.md) for the feature checklist and [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for the project rules that should be followed when making future changes.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Run checks before merging:

```bash
npm run lint
npm run build
```

## Local storage and data portability

The app stores data in the browser under the key `roadToTriathlonV3`, matching V59. Data remains in that browser/device; there is no authentication, remote database, server sync or automatic cross-device backup. Use **Export** regularly and keep the JSON file somewhere safe. Use **Import** to restore data or import an export created by V59.

The starter food catalog uses typical values and is only a local convenience list. Product search uses the community-maintained Open Food Facts database when the app is online; check results against the package label. Open Food Facts data is credited in the UI and used under its ODbL terms. Search is explicit rather than as-you-type to respect the API rate limit. Search results are not saved automatically. Use **My foods & labels** to reuse exact values for products missing from the database.

Import replaces the app's current in-memory dataset with the selected JSON dataset. Export before importing if you need a backup of the current state.

## Deploy to Vercel

Push the project to a Git repository, import it in Vercel, and use the default Next.js build settings. The app does not require a database or paid external API in this prototype, although Vercel plan limits and any future added services still apply. Because storage is local to the browser, deploying the app does not by itself sync user data between devices.

## Architecture direction

The current version prioritizes a functional feature-complete local prototype. The `lib/program.ts` module holds the workout cycle, exercise catalogues, reinforcement plan and equipment load increments. For production, move persistence behind repository interfaces and introduce authentication, server-backed storage, schema validation and automated domain tests before supporting multiple users/devices.
