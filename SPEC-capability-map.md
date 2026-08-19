# Devotion — Approved Capability Map

> Approved: 2026-08-19

| Module ID | Responsibility | Depends On |
|---|---|---|
| `design-system` | Shared tokens, typography, notebook-themed primitives | — |
| `bible-data` | SQLite schema for Scripture, asset bundling, DB seeding, query layer | — |
| `bible-reader` | Book/Chapter/Verse selector UI, reading view, Rhema interaction | `bible-data` |
| `devotional-core` | SQLite schema for Devotionals & Tasks, CRUD, Zustand draft store | `bible-data` |
| `notebook-editor` | R.R.M.A. step-flow editor UI, notebook aesthetic | `devotional-core`, `bible-reader` |
| `journal-history` | Calendar/timeline view, search & filter, entry detail | `devotional-core` |
| `daily-dashboard` | Home: today's tasks, streaks, quick-entry | `devotional-core`, `journal-history` |
| `share-card` | Aesthetic card generator via react-native-view-shot | `devotional-core` |
| `privacy-lock` | Biometric/PIN gate via expo-local-authentication | — |

## Build Order

```
Phase 1: design-system
Phase 2: bible-data, privacy-lock
Phase 3: bible-reader, devotional-core
Phase 4: notebook-editor
Phase 5: journal-history
Phase 6: daily-dashboard, share-card
```
