# TopoPlan

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

A gantt chart web app with a critical path engine. Runs in the browser, no backend.

## What it does

- Add tasks with a name, assignee, dates, and priority
- Set which tasks must finish first (dependencies)
- The engine finds the critical path: the chain of tasks that decides the end date
- Critical tasks show a black bar, other tasks show their slack in days
- Warns you if the dependencies form a circle

## How it works

The engine takes each task as a duration in days and a list of dependencies:

1. Topological sort — orders the tasks, throws an error on circles
2. Forward pass — finds the earliest start of each task
3. Backward pass — finds the latest start that doesn't delay the project
4. Slack = latest start − earliest start. Slack of 0 means the task is critical

Tests: `npm test` inside `client/`

## Run it

```bash
cd client
npm install
npm run dev
```

## Roadmap

- Reschedule later tasks when one slips
- Skip weekends and PH holidays
- Undo
- Save tasks in the browser

## License

[MIT License](LICENSE) 2026 venz-ochoa
