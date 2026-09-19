# Create private diary shell

Triage: ready-for-agent
Type: HITL

## What to build

Create the authenticated mobile-first diary shell for the food diary. A person can sign in through Supabase Auth, see today’s local calendar date, navigate the diary surface, and see fixed breakfast, lunch, dinner, and snacks meal slots with clear empty, loading, and error states. Establish the private user/profile boundary, account timezone, Supabase Row Level Security, and the agreed Vite, React, TypeScript, and Mantine foundation.

## Acceptance criteria

- [ ] A person can sign in, remain signed in, and sign out through Supabase Auth.
- [ ] The sign-in form submits when the person presses Enter in the email field.
- [ ] The diary defaults to the authenticated person's current account-local date.
- [ ] The diary renders breakfast, lunch, dinner, and snacks as fixed meal slots.
- [ ] The app has responsive phone-first layout, keyboard-accessible controls, visible focus, and non-color status cues.
- [ ] Supabase Row Level Security prevents one authenticated person from reading another person's diary data.
- [ ] Account timezone and required Supabase configuration are represented at the profile/configuration boundary.
- [ ] Browser-level tests cover authentication, private empty diary rendering, and unauthenticated access.

## Blocked by

None - can start immediately.
