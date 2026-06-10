<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Recurrly, an Expo/React Native subscription management app. Here is a summary of what was done:

- **Installed** `posthog-react-native` and the required Expo peer dependencies (`expo-file-system`, `expo-application`, `expo-device`, `expo-localization`).
- **Created** `app.config.js` to expose `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from `.env` as Expo config extras.
- **Created** `src/config/posthog.ts` — a singleton PostHog client that reads credentials from `expo-constants` and disables itself gracefully when unconfigured.
- **Updated** `src/app/_layout.tsx` — wrapped the app in `PostHogProvider` (with touch autocapture) and added manual screen tracking via `usePathname` for Expo Router.
- **Added** `posthog.identify()` calls in the sign-in and sign-up flows, using the user's email as the stable distinct ID.
- **Added** `posthog.capture()` calls across all key user actions (see table below).
- **Added** `posthog.reset()` on sign-out to clear the PostHog session.
- **Set** environment variables `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `.env`.

## Tracked events

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User completes account creation after email verification succeeds | `src/app/(auth)/sign-up.tsx` |
| `user_signed_in` | User successfully signs in with password or MFA email code | `src/app/(auth)/sign-in.tsx` |
| `user_signed_out` | User confirms and completes sign-out | `src/app/(tabs)/settings.tsx` |
| `subscription_expanded` | User taps a subscription card to expand its details on the home screen | `src/app/(tabs)/index.tsx` |
| `subscription_details_viewed` | User navigates to the subscription detail screen | `src/app/subscriptions/[id].tsx` |
| `profile_name_updated` | User successfully saves an updated display name | `src/app/(tabs)/settings.tsx` |
| `profile_avatar_updated` | User successfully uploads a new profile photo | `src/app/(tabs)/settings.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/197731/dashboard/737511)
- [New signups & sign-ins](https://eu.posthog.com/project/197731/insights/CSJYkHS5) — Daily trend of `user_signed_up` and `user_signed_in`
- [Sign-up to subscription engagement funnel](https://eu.posthog.com/project/197731/insights/hWTcfVZP) — Conversion from signup to first subscription card expansion
- [User sign-outs over time](https://eu.posthog.com/project/197731/insights/NxYfpOhB) — Churn signal: daily `user_signed_out` trend
- [Subscription card engagement](https://eu.posthog.com/project/197731/insights/NQFEWlRM) — Daily active users expanding subscription cards
- [Profile completion actions](https://eu.posthog.com/project/197731/insights/1rbCJrC6) — Name and avatar update rates

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
