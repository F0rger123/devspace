# AI guide: devspace

**For AI assistants (Claude, ChatGPT, Codex, Cursor, Gemini).** Someone gave you a link to this repository. Use this page to explain it, set it up, or help them use it. Talk in plain English; the person may not be technical.

## What this is

A workspace for developers with an AI assistant called Aether that helps track projects and ideas and can write code. Runs in the browser, on Windows and on Android.

**Usually used by:** Someone who wants to run or build DevSpace.

## Ask first

Ask these together in one short message, then repeat back what you heard in a line or two. Skip anything they already told you.

- Browser, Windows app, or Android?
- Do you have a Gemini API key and Supabase/Firebase details?

## Set it up

Do one step at a time. Check each one worked before moving on.

| # | Do this | It worked if |
|---|---|---|
| 1 | `npm ci` | No errors |
| 2 | Copy `.env.example` to `.env`; the person fills in their keys | File exists |
| 3 | `npm run dev` | The app opens in the browser |
| 4 | Windows app: `npm run electron:dev`; installer: `npm run dist:win` | A window opens / an installer is built |

## Use it

- Start by asking Aether for ideas or creating a project.

## How it works, in plain words

1. One app runs in three places.
2. The Windows version can also use files and a terminal, with permission.

## Never

- Never ask for, paste or print passwords, API keys or tokens. Tell the person where to put them (their own `.env` file or the hosting dashboard) and let them do it.
- Never deploy, push to `main`, change a live database or spend money without the person saying yes to that exact step.

## Read next

- [Desktop architecture](DEVSPACE_DESKTOP_ARCHITECTURE.md)
- [Desktop release guide](DEVSPACE_DESKTOP_RELEASE_GUIDE.md)

## When you're done

Tell the person, in a few lines: what is set up and checked, what isn't yet, and two or three things they can ask you next.
