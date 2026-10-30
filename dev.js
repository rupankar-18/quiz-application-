import { spawn, execSync } from "child_process";

// Clean any leftover process on port 5000 before starting
if (process.platform === "win32") {
  try {
    const pids = execSync('powershell -Command "(Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess"', { encoding: "utf8" }).trim();
    if (pids) {
      for (const pid of pids.split(/\s+/)) {
        if (pid && pid !== "0") {
          try {
            execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
          } catch {}
        }
      }
    }
  } catch {}
}

console.log("\x1b[35m[SERVER]\x1b[0m Starting QuizPulse backend on http://localhost:5000...");
const server = spawn("node", ["server/server.js"], { stdio: "inherit", shell: false });


console.log("\x1b[36m[CLIENT]\x1b[0m Starting QuizPulse Vite frontend...");
const client = spawn("node", ["node_modules/vite/bin/vite.js"], { stdio: "inherit", shell: false });


const shutdown = () => {
  server.kill();
  client.kill();
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

