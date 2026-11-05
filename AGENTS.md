# DevSpace: guide for AI agents

## What this is
DevSpace is a projects, tasks and ideas app, built for phones first. It works on its own (data in
the browser) and links to the Aether PC agent so the Aether voice assistant knows your projects.

## Ask the person first
1. Do you want to use it, or change the code?
2. Do you have Node.js 20 or newer?
3. Do you use Aether? (Then link it in Settings.)

## Set it up and check it
1. `npm install`, then `npm run dev`.
2. Open http://localhost:5180. Today should say good morning, afternoon or evening.
3. `npm run build` must finish with no errors.

## Use it
Add a project, add tasks, drop ideas in and swipe them. To link Aether: open DevSpace from Aether's
PC window, or paste the agent's token in Settings.

## Never do this
- Never print or commit tokens or `~/.aether/config.json`.
- Never put real personal data in screenshots; use made-up demo data.
- Never push to `main` or publish without a clear yes.
