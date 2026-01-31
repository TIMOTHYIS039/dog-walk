# Dog Walk Tracker

Track a dog walk by GPS: route, pee/poo events, and live owner view.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Walker**: Click “Start a walk” → you get a walk code and a Walker URL. Share the **Owner** link with the dog owner. Your route is tracked by GPS; use “Record Pee” / “Record Poo” during the walk, then “End walk”.
- **Owner**: Enter the walk code (or open the shared Owner link) to watch the route live or review a completed walk.

Walks are stored in memory; they are lost when the server restarts.
