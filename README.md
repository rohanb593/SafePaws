# SafePaws

Project overview for SafePaws.

## Description
SafePaws is a mobile app connecting pet owners with trusted local pet minders.

## Tech Stack
- React Native (Expo)
- TypeScript
- Supabase (Auth, Database, Realtime, Storage, Edge Functions)

## Installation
```
npm install
```

## Running the App
```
cd app && npx expo start
```

## Running Supabase Locally
```
supabase start
```

## Applying Migrations
```
supabase db push
```

## Folder Structure
- `app/` — React Native mobile app (screens, components, hooks, store, types, utils)
- `supabase/` — Supabase config, migrations, edge functions, and seed data
- `docs/` — Design report, domain analysis, requirements, meeting notes
- `infrastructure/` — Environment variable templates
