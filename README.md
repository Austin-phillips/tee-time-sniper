# Tee Time Sniper

Monitors golf course booking sites and sends push notifications when tee times matching your preferences become available.

## Project Structure

```
├── server/          # Node.js poller service
├── mobile/          # React Native (Expo) mobile app
├── supabase/        # Database migrations
└── package.json     # Root scripts for DB management
```

## Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`)
- Expo Go or a dev client build on your device

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Link your local project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Push migrations:
   ```bash
   npm run db:push
   ```

### Finding your Supabase keys

Go to your Supabase dashboard → **Settings → API**:

| Key | Where to find it |
|-----|-----------------|
| `SUPABASE_URL` | Project URL (e.g. `https://xxxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` `secret` key (keep this secret) |

## Server

The server polls golf course booking sites on a cron schedule and sends push notifications via Expo.

### Environment Variables

Create `server/.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=your-64-char-hex-key
POLL_CRON=* * * * *
```

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) |
| `ENCRYPTION_KEY` | Yes | 64-character hex string for encrypting stored credentials. Generate with: `openssl rand -hex 32` |
| `POLL_CRON` | No | Cron expression for poll frequency. Default: `* * * * *` (every minute) |

### Running the Server

```bash
cd server
npm install
npm run dev
```

For production:
```bash
cd server
npm run build
npm start
```

## Mobile App

React Native app built with Expo Router, NativeWind (Tailwind), and Supabase auth.

### Environment Variables

Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are the same `SUPABASE_URL` and `SUPABASE_ANON_KEY` from your Supabase dashboard, prefixed with `EXPO_PUBLIC_`.

### Running the Mobile App

```bash
cd mobile
npm install
npm run sim        # iOS simulator
npm run start      # Dev server (scan QR with Expo Go)
```

### Building for Testing

```bash
cd mobile
npm run build:preview    # iOS ad-hoc build via EAS
```

See [BETA_TESTING.md](./BETA_TESTING.md) for instructions on distributing preview builds to testers.

## Database Migrations

```bash
npm run db:push      # Apply all migrations
npm run db:status    # Check migration status
npm run db:new       # Create a new migration file
```
