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
  <a href="#-meet-aether">Aether</a> ·
  <a href="#-one-codebase-three-platforms">Platforms</a> ·
  <a href="#-run-it">Run it</a> ·
  <a href="#-license">License</a>
</p>

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
flowchart LR
    You(["🧑‍💻 You"]) -->|"dream up 500 ideas"| Aether["✨ Aether"]
    Aether --> Ideas["💭 Dream deck"] -->|swipe right| Project["🗂️ Project"]
    Project --> Plan["Steps + issues"] --> Code["🧩 Generated code"]
    Code --> Push["⬆️ Push to repo"]
    Aether --> Mem[("🧠 Memory cortex")]
    Aether --> Daily["📆 Daily brief"]
```

## 🖥️ One codebase, three platforms

```mermaid
flowchart TB
    Src["src/ · shared React app"] --> Web["🌐 Web<br/>Vite + server.ts"]
    Src --> Desk["🖥️ Windows desktop<br/>Electron + NSIS installer"]
    Src --> Droid["🤖 Android<br/>Capacitor"]
    Desk --> Caps["Native capabilities<br/>files · terminal · git · screen capture · local models"]
    Desk --> Perm["Permission engine"]
    Web & Desk & Droid --> Back["Gemini · Supabase · Firebase"]
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

## 📊 Code composition

```mermaid
%%{init: {'theme':'base','themeVariables':{'pie1':'#6366f1','pie2':'#ec4899','pie3':'#64748b','pie4':'#94a3b8','pie5':'#475569','pie6':'#cbd5e1','pie7':'#334155','pieStrokeColor':'#0d1117','pieOuterStrokeColor':'#0d1117','pieTitleTextColor':'#8b949e','pieLegendTextColor':'#8b949e','pieSectionTextColor':'#0d1117'}}}%%
pie title Code composition (% of bytes, via GitHub linguist)
    "TypeScript" : 99.7
    "Other" : 0.3
```

## 📜 License

Released under the [MIT License](LICENSE). Use it, fork it, ship it.

<p align="center"><img src=".github/assets/divider.svg" width="100%" alt=""></p>

<p align="center">
  <sub>Built by <a href="https://github.com/F0rger123"><b>@F0rger123</b></a> · MIT licensed</sub>
</p>
