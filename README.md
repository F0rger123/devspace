<p align="center">
  <img src=".github/assets/banner.svg" alt="DEVSPACE: The space for developers, literally. Powered by Aether." width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-public-6366f1?style=for-the-badge" alt="Public">
  <img src="https://img.shields.io/badge/license-MIT-6366f1?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/last-commit/F0rger123/devspace?style=for-the-badge&color=6366f1" alt="Last commit">
  <img src="https://img.shields.io/github/repo-size/F0rger123/devspace?style=for-the-badge&color=6366f1" alt="Repo size">
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
  <a href="#-what-it-does">What it does</a> ·
  <a href="#-meet-aether">Meet Aether</a> ·
  <a href="#️-one-app-three-places">One app, three places</a> ·
  <a href="#️-run-it">Run it</a> ·
  <a href="#-what-its-written-in">What it's written in</a> ·
  <a href="#-license">License</a>
</p>

> [!TIP]
> **🤖 Pasted this link into Claude or ChatGPT?** AI assistants: read [`AGENTS.md`](https://raw.githubusercontent.com/F0rger123/devspace/main/AGENTS.md) first. It explains what this is in plain words, which questions to ask, and how to set it up step by step. Plain-text index: [`llms.txt`](https://raw.githubusercontent.com/F0rger123/devspace/main/llms.txt).


<p align="center"><img src=".github/assets/divider.svg" width="100%" alt=""></p>

## ⚡ What it does

| | Module | Highlights |
|---|---|---|
| 🗂️ | **Projects** | Projects, issues, ideas and a guided project stepper |
| 💭 | **Dream studio** | Dream log, swipe deck and review studio for generated ideas |
| 🧠 | **Memory cortex** | Long-term memory and life-context settings for the assistant |
| 📆 | **Daily hub** | Daily brief, routines, reminders, goals and a focus coach |
| 🤝 | **Relationships & meetings** | Relationship hub and meeting intelligence |
| 🔌 | **Integrations** | Integration center and wizard, backend integration tab |
| 🔒 | **Security** | Biometric session security, privacy dashboard, recovery center, sandbox inspector |
| 🖐️ | **Hands-free** | MediaPipe hand tracking |

## ✨ Meet Aether

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#0d1117','primaryTextColor':'#e6edf3','primaryBorderColor':'#6366f1','lineColor':'#ec4899','secondaryColor':'#161b22','tertiaryColor':'#0d1117','clusterBkg':'transparent','clusterBorder':'#6366f1','noteBkgColor':'#161b22','noteTextColor':'#e6edf3','actorBkg':'#0d1117','actorTextColor':'#e6edf3','actorBorder':'#6366f1','signalColor':'#ec4899','signalTextColor':'#ec4899','labelBoxBkgColor':'#0d1117','fontFamily':'inherit'}}}%%
flowchart LR
    You(["You"]) -->|dream up ideas| Aether["Aether, the assistant"]
    Aether --> Ideas["Idea deck"]
    Ideas -->|swipe right| Project["New project"]
    Project --> Steps["Plan and tasks"]
    Steps --> Code["Code written for you"]
    Aether --> Mem[("Remembers you")]
```

## 🖥️ One app, three places

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#0d1117','primaryTextColor':'#e6edf3','primaryBorderColor':'#6366f1','lineColor':'#ec4899','secondaryColor':'#161b22','tertiaryColor':'#0d1117','clusterBkg':'transparent','clusterBorder':'#6366f1','noteBkgColor':'#161b22','noteTextColor':'#e6edf3','actorBkg':'#0d1117','actorTextColor':'#e6edf3','actorBorder':'#6366f1','signalColor':'#ec4899','signalTextColor':'#ec4899','labelBoxBkgColor':'#0d1117','fontFamily':'inherit'}}}%%
flowchart TB
    Core["DevSpace"] --> Web["In the browser"]
    Core --> Win["Windows app<br/>can use files and terminal"]
    Core --> Android["Android app"]
```

Desktop design and release notes: [`DEVSPACE_DESKTOP_ARCHITECTURE.md`](DEVSPACE_DESKTOP_ARCHITECTURE.md) and [`DEVSPACE_DESKTOP_RELEASE_GUIDE.md`](DEVSPACE_DESKTOP_RELEASE_GUIDE.md).

## 🛠️ Run it

```bash
npm ci
cp .env.example .env
npm run dev              # web app + API server
npm run electron:dev     # desktop app
npm run dist:win         # Windows NSIS installer
```

## 📊 What it's written in

```mermaid
%%{init: {'theme':'base','themeVariables':{'pie1':'#6366f1','pie2':'#ec4899','pie3':'#64748b','pie4':'#94a3b8','pie5':'#475569','pie6':'#cbd5e1','pie7':'#334155','pieStrokeColor':'#0d1117','pieOuterStrokeColor':'#0d1117','pieTitleTextColor':'#8b949e','pieLegendTextColor':'#8b949e','pieSectionTextColor':'#0d1117'}}}%%
pie title Share of the code, by language
    "TypeScript" : 99.7
    "Other" : 0.3
```

## 📜 License

Released under the [MIT License](LICENSE). Use it, fork it, ship it.

<p align="center"><img src=".github/assets/divider.svg" width="100%" alt=""></p>

<p align="center">
  <sub>Built by <a href="https://github.com/F0rger123"><b>@F0rger123</b></a> · MIT licensed</sub>
</p>
