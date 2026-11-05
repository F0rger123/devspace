<p align="center">
  <img src=".github/assets/banner.svg" alt="DEVSPACE: The space for developers, literally. Powered by Aether." width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2_mobile_first-eab308?style=for-the-badge&labelColor=121214" alt="Version 2, mobile first">
  <img src="https://img.shields.io/badge/React-18-eab308?style=for-the-badge&labelColor=121214" alt="React 18">
  <img src="https://img.shields.io/badge/Tailwind-4-eab308?style=for-the-badge&labelColor=121214" alt="Tailwind 4">
  <img src="https://img.shields.io/badge/works_with-Aether-eab308?style=for-the-badge&labelColor=121214" alt="Works with Aether">
</p>

> [!TIP]
> **AI agents: start here.** Pasted this link into Claude or ChatGPT? Read
> [`AGENTS.md`](https://raw.githubusercontent.com/F0rger123/devspace/v2/AGENTS.md) first. Plain-text index:
> [`llms.txt`](https://raw.githubusercontent.com/F0rger123/devspace/v2/llms.txt).

<h3 align="center">Your projects, tasks and ideas, made for your phone first. Aether plans the big ones with you and has Claude Code build them.</h3>

<p align="center">
  <img src=".github/assets/v2-today-phone.jpg" width="200" alt="Today on a phone: counts, up next, projects in motion">
  <img src=".github/assets/v2-ideas-phone.jpg" width="200" alt="Ideas: swipe right to keep, left to drop">
  <img src=".github/assets/v2-project-phone.jpg" width="200" alt="A project with its tasks">
</p>
<p align="center"><img src=".github/assets/v2-today-desktop.jpg" width="640" alt="Today on a computer, with the sidebar"></p>
<p align="center"><sub>Screenshots use made-up demo data.</sub></p>

## `~/` what's inside

| Page | What it does |
|---|---|
| **Today** | What to do next across your active projects, most important first, and how far each one is |
| **Projects** | Every project with its tasks, progress and status (active, paused, done) |
| **Ideas** | Drop ideas in, swipe right to keep and left to drop, turn kept ones into projects |
| **Blueprints** | Big plans made by voice with Aether, and how far Claude Code got building them |
| **Settings** | Link Aether, download a copy of your data |

## `>` how it fits with Aether

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#121214','primaryTextColor':'#fafafa','primaryBorderColor':'#eab308','lineColor':'#a1a1aa','fontFamily':'inherit'}}}%%
flowchart LR
    You(["You"]) -->|"plan by voice"| Aether["Aether on your phone"]
    Aether -->|"saves the plan"| PC["Aether on your PC"]
    You -->|"tap and type"| DS["DevSpace"]
    DS <-->|"projects and ideas stay in step"| PC
    PC -->|"one step at a time"| Claude["Claude Code builds it"]
```

## `↓` download it

**DevSpace for Windows:** grab **DevSpace Setup** from [Releases](https://github.com/F0rger123/devspace/releases).
With [Aether for Windows](https://github.com/F0rger123/aether-agent) installed it links to Aether by itself.

## `$` run it

```bash
npm install
npm run dev      # http://localhost:5180, also reachable from your phone on the same Wi-Fi
npm run build    # production build in dist/
npm run app      # the Windows app
npm run dist     # the Windows installer, in release/
```

Your data is kept in the browser. Link the [Aether PC agent](https://github.com/F0rger123/aether-agent)
in Settings and it's kept on your PC too, where Aether on your phone can see it.

The first DevSpace (built in Google AI Studio) is on the `main` branch. This `v2` branch is the
rebuild: only the parts that really work, mobile first.
