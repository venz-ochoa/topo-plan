# react-express-docker-template

A minimal full-stack template: React (Vite) + Express + PostgreSQL, wired together with Docker Compose. Clone it, rename it, build on it.

## The stack

| Layer    | Tech               | Where it runs          |
|----------|--------------------|------------------------|
| Frontend | React 18 + Vite    | http://localhost:3000  |
| Backend  | Express (Node 20)  | http://localhost:3001  |
| Database | PostgreSQL 16      | localhost:5432         |

## File hierarchy (what each file is for)

```text
.
├── docker-compose.yml        #this is for the 3 services (db, api, web) - one command runs everything
├── server/                   #this is for the backend
│   ├── Dockerfile            #this is for the api container image
│   ├── package.json          #this is for the backend dependencies (express, pg, cors, dotenv)
│   ├── db/
│   │   └── init.sql          #this is for the database tables (runs automatically on first start)
│   └── src/
│       ├── index.js          #this is for the express app (mount your route files here)
│       ├── db.js             #this is for the database connection pool
│       └── routes/
│           └── example.js    #this is for the GET / POST / PUT / DELETE route template (copy this)
└── client/                   #this is for the frontend
    ├── Dockerfile            #this is for the web container (builds react, serves with nginx)
    ├── nginx.conf            #this is for serving the app + sending /api calls to express
    ├── package.json          #this is for the frontend dependencies (react, react-router, vite)
    ├── vite.config.js        #this is for the vite dev server and the /api proxy
    ├── index.html            #this is for the html shell react mounts into
    ├── public/
    │   ├── favicon.svg       #this is for the browser tab icon
    │   └── icons/            #this is for the svg icons used across the pages
    └── src/
        ├── main.jsx          #this is for the react entry point
        ├── App.jsx           #this is for the routes (add one per page)
        ├── api.js            #this is for the GET / POST / PUT / DELETE fetch templates
        ├── index.css         #this is for the styles
        ├── components/
        │   └── Navbar.jsx    #this is for the top navigation bar
        └── pages/
            ├── Home.jsx      #this is for the home page
            └── Example.jsx   #this is for the page template (shows GET + POST, copy this)
```

## Quick start (Docker)

```bash
docker compose up --build
```

| What              | Where                                    |
|-------------------|------------------------------------------|
| React app         | http://localhost:3000                    |
| Express API       | http://localhost:3001/api/health         |
| Example endpoint  | http://localhost:3001/api/example        |
| PostgreSQL        | localhost:5432 (user `app`, pass `app`)  |

Stop everything: `docker compose down`
Stop and wipe the database: `docker compose down -v`

## Development without Docker

Terminal 1 - start only the database:

```bash
docker compose up db
```

Terminal 2 - start the API (auto-restarts on save):

```bash
cd server
npm install
npm run dev
```

Terminal 3 - start React (hot reload):

```bash
cd client
npm install
npm run dev
```

## How to add a new page (screen)

1. Copy `client/src/pages/Example.jsx` to `client/src/pages/MyPage.jsx` and edit it.
2. Add the route in `client/src/App.jsx`:

   ```jsx
   import MyPage from './pages/MyPage.jsx';

   <Route path="/mypage" element={<MyPage />} />
   ```

3. Add the link in `client/src/components/Navbar.jsx`.

## How to add a new API route

1. Copy `server/src/routes/example.js` to `server/src/routes/myroute.js` and change the SQL.
2. Mount it in `server/src/index.js`:

   ```js
   import myRouter from './routes/myroute.js';

   app.use('/api/myroute', myRouter);
   ```

3. Add matching fetch functions in `client/src/api.js`.

## Database

- Tables live in `server/db/init.sql`. Edit it, then reset the database:

  ```bash
  docker compose down -v && docker compose up
  ```

- The connection string comes from `docker-compose.yml`. Locally (outside Docker) it falls back to `postgres://app:app@localhost:5432/app`.
- Credentials live in `docker-compose.yml` (defaults: user `app`, password `app`, db `app`).

## Pushing to GitHub

```bash
git init
git add .
git commit -m "initial template"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Tip: once pushed, open the repo on GitHub, go to Settings and check "Template repository" - then you can create new projects from it with one click.