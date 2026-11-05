// DevSpace for Windows: the same app as the web version, in its own window. It serves the built app
// to itself on this computer, and links to Aether by itself when Aether for Windows is installed.
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");
const { app, BrowserWindow, shell } = require("electron");

const DIST = path.join(__dirname, "..", "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      let file = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
      if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    // Always the same port, so the browser storage (your projects) stays the same between runs.
    server.listen(5181, "127.0.0.1", () => resolve(5181));
  });
}

function aetherToken() {
  try {
    return JSON.parse(fs.readFileSync(path.join(os.homedir(), ".aether", "config.json"), "utf8")).token;
  } catch {
    return null;
  }
}

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(async () => {
  const port = await serve();
  const win = new BrowserWindow({
    width: 1180, height: 820, minWidth: 380, minHeight: 600, backgroundColor: "#050507", title: "DevSpace",
    icon: path.join(__dirname, "icon.png"), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  const t = aetherToken();
  win.loadURL(`http://127.0.0.1:${port}/` + (t ? `#t=${t}` : ""));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  app.on("second-instance", () => { win.show(); win.focus(); });
});

app.on("window-all-closed", () => app.quit());
