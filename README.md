# TopoPlan

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/supabase-%233ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)

A project planner for small teams. It shows your tasks on a timeline and marks the **critical tasks**: the ones that will delay the whole project if they are late.

The app is built with React and Vite. It uses Supabase for logins and the database, so it has no server of its own.

## Features

- **Dashboard:** see all your projects and invites.
- **Tasks:** tasks are listed as Up next, In progress, Later and Done this week.
- **Timeline:** see task dates, critical tasks and spare days.
- **Scheduling:** when you move a task by a day, unfinished tasks that wait for it move too. Weekends and listed holidays are skipped. Done tasks never move.
- **Requests:** ask an admin to change a task's status, or to move it one day earlier or later.
- **Team:** invite people by link or email, change roles and remove people.
- **Notifications:** get updates about tasks, requests and invites.
- **Profile:** change your name, email or password, see your activity, or delete your account.
- **Live updates:** changes show up without refreshing the page.

## Roles

Each project has an **owner**, and can have more **admins** and **members**. The owner is also an admin. You can have a different role in each project.

| Action | Member | Admin | Owner |
|---|---|---|---|
| View tasks and the timeline | Yes | Yes | Yes |
| Add, edit, assign and delete tasks | No | Yes | Yes |
| Approve or deny requests | No | Yes | Yes |
| Invite people and remove members | No | Yes | Yes |
| Make a member an admin | No | Yes | Yes |
| Remove an admin or make an admin a member | No | No | Yes |
| Give ownership to another admin, or delete the project | No | No | Yes |

### Task status

- Only an admin who is **assigned to the task** can change its status directly.
- A member assigned to the task can send a request. Any admin in the project can approve or deny it.
- A task cannot start or finish until the task it waits for is done.
- A done task is locked.
- A person can send up to 5 requests for one task in 24 hours.
- A new task with a start date in the past is saved as done.

### Leaving and deleting

- A project with people in it must have at least one admin.
- An admin must finish their tasks before leaving.
- If the owner leaves, another admin becomes the owner.
- You cannot delete your account if you are the only admin of a project with other people.
- To delete your account, you must enter your password again.
- Deleting your account also deletes projects where you are the only person.
- Old notifications and database logs may keep some details after an account is deleted.

## Invites

- Each invite works once and lasts 7 days.
- An email invite only works for that email.
- An invite link without an email works for anyone who has it, so share it with care.
- **The app does not send invite emails.** A person with an account sees the invite in the app. When you create a project, you can also copy each invite link and send it yourself.

| Limit | Amount |
|---|---|
| Invite links, for each admin | 60 per hour (recent email invites count too) |
| Unused invites in a project | No new link once there are 100 |
| Email invites, for each admin | 30 per hour |
| Invites to the same email, from one admin | 3 per 24 hours |
| Emails when creating a project | 20 |

## Setup

You need [Node.js](https://nodejs.org) 22.12 or newer in version 22, version 24, or version 26 and newer. You also need a [Supabase](https://supabase.com) account.

1. Create a **new, empty** Supabase project.
2. Open **SQL Editor**, paste all of [`server/schema.sql`](server/schema.sql), and run it once.
3. In Supabase's login settings, keep **Confirm email** turned on. This stops people from using an email they do not own.
4. Create the file `client/.env`:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```
   Never commit this file. Never put the `service_role` key in the app.
5. Start the app:
   ```bash
   cd client
   npm install
   npm run dev
   ```
6. Open `http://localhost:3000`.

### About the other SQL files

For a new project, run **only `schema.sql`**. Do not run it on a project that already has the tables.

The `migrate_security_*.sql` files are a history of changes to an older database. The `test_security_*.sql` files were used to check each change. Some older ones may not work on the final database.

## Database

| Table | What it stores |
|---|---|
| `users` | Display names |
| `projects` | Project names and descriptions |
| `roles` | Who is in each project, their role, and who the owner is |
| `tasks` | Task details, dates, status and dependencies |
| `requests` | Requests and their answers |
| `invites` | Invite codes |
| `notifications` | Messages shown in the app |
| `activity_log`, `audit_log` | Records of actions |

Supabase stores emails and passwords separately.

The database also has tables for comments, checklists, links, messages, templates, holidays, time off, extra assignees and notification settings. The app has no screens for these, so people cannot change them through the app's connection. Some database functions are also unused.

## Security

- The database checks who can see and change data. Hiding a button is not the only protection.
- Row Level Security is on for all tables. This means database rules control which rows each user can reach.
- People can only see projects they belong to.
- Only admins can add, edit or delete tasks.
- People can only be newly assigned to tasks in projects they belong to.
- The app gets only the table permissions it uses. If you add a feature, you may need to add a permission.
- Removed members lose access to the project. Done tasks may still show their name.

## Holidays

The holiday list is in [`client/src/engine/holidays.js`](client/src/engine/holidays.js). It has dates for 2026 and 2027.

- The two Eid holidays for 2027 still need to be added when announced.
- The 2026 list may be missing Eid'l Adha.
- For years without a list, only weekends are skipped.
- Changing the list does not update saved tasks right away.

## Folders

```
client/
  .env             your Supabase keys (you create this)
  src/
    App.jsx        login and page switching
    db.js          database requests
    supabase.js    Supabase connection
    pages/         app screens
    components/    shared parts of the screens
    engine/        scheduling, rules and tests
server/
  schema.sql       setup for a new database
  migrate_security_*.sql
  test_security_*.sql
```

## Tests

Run these inside `client/`:

```bash
npm test -- --run
npm run build
```

**Current status (November 26, 2026):**

- All 37 app tests passed and the build worked.
- Database changes up to step 8 passed their SQL checks on the existing Supabase project.
- The step 9 security changes have **not been tested yet**.
- `schema.sql` has **not yet been tested** on a new project.
- Not every screen and action has been checked in a browser.
- The app is **not deployed yet**.

## Before going online

- Test `schema.sql` on a new project, then test the app with owner, admin and member accounts.
- Choose a web host. If you use GitHub Pages, set `base: '/your-repo-name/'` in `client/vite.config.js`.
- Add the two `VITE_` values to your build settings.
- In Supabase, set **Site URL** to your app's web address.
- In Supabase, require passwords of at least 8 characters, check the allowed redirect addresses and login limits, and think about adding CAPTCHA.
- Pick a host that can send a security header that stops other sites from showing your app inside a frame (`Content-Security-Policy: frame-ancestors 'none'`). GitHub Pages cannot do this.
- Set up your own email service for sign-up emails. Supabase's built-in one has a low limit.
- Check Supabase's login settings, file storage rules and Edge Functions. `schema.sql` does not set these up.

## Common problems

- **"Email rate limit exceeded":** wait, then try again. You can also create test users in the Supabase dashboard.
- **"Could not find the table ... in the schema cache":** check that `schema.sql` finished and that `client/.env` points to the right project. If both are correct, run `notify pgrst, 'reload schema';`.

## License

[MIT License](LICENSE) 2026 venz-ochoa
