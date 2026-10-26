<p align="center">
  <img src=".github/assets/banner.svg" alt="DEVSPACE: The space for developers, literally. Powered by Aether." width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-public-eab308?style=for-the-badge" alt="Public">
  <img src="https://img.shields.io/badge/license-MIT-eab308?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/last-commit/F0rger123/devspace?style=for-the-badge&color=eab308" alt="Last commit">
  <img src="https://img.shields.io/github/repo-size/F0rger123/devspace?style=for-the-badge&color=eab308" alt="Repo size">
</p>
<p align="center">
  <img src="https://img.shields.io/badge/React-0d1117?style=flat-square&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-0d1117?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-0d1117?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-0d1117?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Electron-0d1117?style=flat-square&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Capacitor-0d1117?style=flat-square&logo=capacitor&logoColor=white" alt="Capacitor">
  <img src="https://img.shields.io/badge/Gemini-0d1117?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Supabase-0d1117?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Firebase-0d1117?style=flat-square&logo=firebase&logoColor=white" alt="Firebase">
</p>

<h3 align="center">The space for developers, literally. Track projects, issues and ideas, or tell Aether to dream up 500 ideas and build them for you.</h3>

<p align="center">
  <a href="#-run-it">run it</a> ·
  <a href="#-whats-inside">what's inside</a> ·
  <a href="#-meet-aether">meet aether</a> ·
  <a href="#-one-app-three-places">one app, three places</a> ·
  <a href="#-written-in">written in</a>
</p>

> [!TIP]
> **🤖 Pasted this link into Claude or ChatGPT?** AI assistants: read [`AGENTS.md`](https://raw.githubusercontent.com/F0rger123/devspace/main/AGENTS.md) first. It explains what this is in plain words, which questions to ask, and how to set it up step by step. Plain-text index: [`llms.txt`](https://raw.githubusercontent.com/F0rger123/devspace/main/llms.txt).


<p align="center"><img src=".github/assets/divider.svg" width="100%" alt=""></p>

## `$` run it

```bash
npm ci
cp .env.example .env     # add your own keys here, never commit this file
npm run dev              # web app + API server on http://localhost:3000
npm run electron:dev     # desktop app
npm run dist:win         # Windows installer
```

## `~/` what's inside

<table>
  <tr>
    <td width="50%"><b>🗂️ Projects</b><br><sub>Projects, issues, ideas and a guided project stepper.</sub></td>
    <td width="50%"><b>💭 Dream studio</b><br><sub>A dream log, a swipe deck and a review studio for generated ideas.</sub></td>
  </tr>
  <tr>
    <td><b>🧠 Memory cortex</b><br><sub>Long-term memory and life context, so Aether remembers how you work.</sub></td>
    <td><b>📆 Daily hub</b><br><sub>Daily brief, routines, reminders, goals and a focus coach.</sub></td>
  </tr>
  <tr>
    <td><b>🤝 People & meetings</b><br><sub>A relationship hub and meeting notes that turn into tasks.</sub></td>
    <td><b>🔌 Integrations</b><br><sub>An integration center and wizard for the tools you already use.</sub></td>
  </tr>
  <tr>
    <td><b>🔒 Security</b><br><sub>Biometric sessions, a privacy dashboard, recovery and a sandbox inspector.</sub></td>
    <td><b>🖐️ Hands-free</b><br><sub>Control the workspace with hand gestures from your camera.</sub></td>
  </tr>
</table>

## `>` meet aether

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#121214','primaryTextColor':'#fafafa','primaryBorderColor':'#eab308','lineColor':'#a1a1aa','secondaryColor':'#0b0c10','tertiaryColor':'#1c1c1f','clusterBkg':'transparent','clusterBorder':'#eab308','noteBkgColor':'#0b0c10','noteTextColor':'#fafafa','actorBkg':'#121214','actorTextColor':'#fafafa','actorBorder':'#eab308','signalColor':'#a1a1aa','signalTextColor':'#a1a1aa','labelBoxBkgColor':'#121214','fontFamily':'inherit'}}}%%
flowchart LR
    You(["You"]) -->|dream up ideas| Aether["Aether, the assistant"]
    Aether --> Ideas["Idea deck"]
    Ideas -->|swipe right| Project["New project"]
    Project --> Steps["Plan and tasks"]
    Steps --> Code["Code written for you"]
    Aether --> Mem[("Remembers you")]
```

## `::` one app, three places

| | 🌐 Browser | 🪟 Windows | 🤖 Android |
|---|---|---|---|
| **Start it** | `npm run dev` | `npm run electron:dev` | Capacitor build in `android/` |
| **Extra powers** | Works anywhere | Can use your files and terminal | Takes the workspace with you |
| **Ship it** | Any Node host | `npm run dist:win` installer | Android Studio |

Desktop design and release notes: [`DEVSPACE_DESKTOP_ARCHITECTURE.md`](DEVSPACE_DESKTOP_ARCHITECTURE.md) and [`DEVSPACE_DESKTOP_RELEASE_GUIDE.md`](DEVSPACE_DESKTOP_RELEASE_GUIDE.md).

## `#` written in

```mermaid
%%{init: {'theme':'base','themeVariables':{'pie1':'#eab308','pie2':'#fde68a','pie3':'#64748b','pie4':'#94a3b8','pie5':'#475569','pie6':'#cbd5e1','pie7':'#334155','pieStrokeColor':'#0d1117','pieOuterStrokeColor':'#0d1117','pieTitleTextColor':'#8b949e','pieLegendTextColor':'#8b949e','pieSectionTextColor':'#0d1117'}}}%%
pie title Share of the code, by language
    "TypeScript" : 99.7
    "Other" : 0.3
```

## `©` license

Released under the [MIT License](LICENSE). Use it, fork it, ship it.

<p align="center"><img src=".github/assets/divider.svg" width="100%" alt=""></p>

<p align="center">
  <sub>Built by <a href="https://github.com/F0rger123"><b>@F0rger123</b></a> · MIT licensed</sub>
</p>
