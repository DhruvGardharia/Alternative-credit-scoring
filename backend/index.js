import express from 'express';
import dotenv from 'dotenv';
import connectDb from './database/db.js';
import bodyParser from 'body-parser';
import path from 'path';
import cookieParser from 'cookie-parser';
import cloudinary from 'cloudinary';
import axios from 'axios';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import FormData from 'form-data';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();
const port = process.env.PORT || 5005;

// ── Python FastAPI Child Process ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirnameESM = path.dirname(__filename);
const INSURANCE_AI_DIR = path.join(__dirnameESM, '..', 'insurance-ai');
const PYTHON_CMD = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
const FASTAPI_INTERNAL_PORT = process.env.FASTAPI_INTERNAL_PORT || '8000';

let pythonProcess = null;
let isShuttingDown = false; // set to true during intentional Node shutdown
let restartTimer = null;   // track pending restart so we can cancel it
let restartAttempts = 0;   // count how many times this process slot has been restarted

function cancelRestartTimer() {
  if (restartTimer !== null) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
}

function startPythonServer() {
  if (!fs.existsSync(INSURANCE_AI_DIR)) {
    console.warn('[Python] insurance-ai directory not found — skipping AI service startup');
    return;
  }

  // Cancel any pending restart timer — a new process is starting right now
  cancelRestartTimer();

  // Safety: if a process is somehow already running, don't spawn a second one
  if (pythonProcess && !pythonProcess.killed) {
    console.log('[Python] Process already running, skipping duplicate start.');
    return;
  }

  console.log(`[Python] Starting FastAPI server on port ${FASTAPI_INTERNAL_PORT}...`);

  const proc = spawn(
    PYTHON_CMD,
    ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', FASTAPI_INTERNAL_PORT],
    {
      cwd: INSURANCE_AI_DIR,
      env: { ...process.env },   // forward all env vars (GROQ_API_KEY etc.)
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  pythonProcess = proc;

  proc.stdout.on('data', (d) => process.stdout.write(`[Python] ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`[Python] ${d}`));

  proc.stderr.on('data', (d) => process.stderr.write(`[Python] ${d}`));

  proc.on('close', (code) => {
    // Ignore if this is a stale/replaced process, or if we're shutting down
    if (pythonProcess !== proc || isShuttingDown) return;
    pythonProcess = null;

    // Check if the port was taken by another Node instance in the meantime
    if (!isPortFree(FASTAPI_INTERNAL_PORT) && isPythonAlive()) {
      console.log('[Python] Process closed but port is healthy (likely adopted by another instance).');
      return;
    }

    restartAttempts++;
    if (restartAttempts > 3) {
      console.error(`[Python] Process keeps crashing (${restartAttempts} times). Stopping auto-restart.`);
      console.error(`[Python] Check that port ${FASTAPI_INTERNAL_PORT} is not in use by another application.`);
      return;
    }

    console.warn(`[Python] FastAPI process exited (code ${code}) — restarting in 5s (attempt ${restartAttempts}/3)...`);
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (!isShuttingDown) killPortThenStart();
    }, 5000);
  });

  proc.on('error', (err) => {
    console.error(`[Python] Failed to start: ${err.message}`);
    console.error(`[Python] Make sure '${PYTHON_CMD}' is in PATH and uvicorn is installed`);
  });
}

// Kill Python child when Node exits — uses taskkill on Windows for full tree kill
function cleanupPython() {
  isShuttingDown = true;   // block any pending restart callbacks first
  cancelRestartTimer();    // cancel any queued restart

  if (pythonProcess && !pythonProcess.killed) {
    console.log('[Python] Shutting down FastAPI child process...');
    const proc = pythonProcess;
    pythonProcess = null;                       // null FIRST so close guard works
    proc.removeAllListeners('close');           // then remove listeners
    if (process.platform === 'win32') {
      // taskkill /F /T kills the process AND all its children (the actual uvicorn workers)
      spawn('taskkill', ['/PID', String(proc.pid), '/F', '/T'], { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
  }
}

// Check if anything is bound on the port in LISTENING state
function isPortFree(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        `netstat -ano | findstr " :${port} "`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      // Only consider it busy if we find a line with "LISTENING"
      return !out.toLowerCase().includes('listening');
    } else {
      execSync(`fuser ${port}/tcp 2>/dev/null`, { stdio: 'ignore' });
      return false;
    }
  } catch (_) {
    return true; // findstr/fuser exits nonzero when nothing found = port is free
  }
}

// Check if a Python/uvicorn server is already alive on the port and answering HTTP
function isPythonAlive() {
  try {
    execSync(
      `node -e "require('http').get('http://localhost:${FASTAPI_INTERNAL_PORT}/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"`,
      { timeout: 3000, stdio: 'ignore' }
    );
    return true;  // exited 0 = server answered OK
  } catch (_) {
    return false; // connection refused or timeout = not alive
  }
}

function killPortThenStart(retry = 0) {
  if (isShuttingDown) return;
  if (pythonProcess && !pythonProcess.killed) {
    console.log('[Python] Process already running, skipping redundant start.');
    return;
  }

  // ── Step 0: Health-check first — if a healthy server is already up, adopt it ─
  // This prevents two `npm run dev` instances from fighting each other.
  if (!isPortFree(FASTAPI_INTERNAL_PORT) && isPythonAlive()) {
    console.log(`[Python] FastAPI already healthy on port ${FASTAPI_INTERNAL_PORT} — adopting existing server, skipping kill/start.`);
    return;
  }

  // ── Step 1: Kill orphan Python/uvicorn processes by command line (wmic) ─────
  // This catches processes that outlived a previous Node run and are NOT tracked
  // by `pythonProcess`, so they won't show up through our own handle.
  if (process.platform === 'win32') {
    try {
      // Find all python.exe PIDs whose command line contains 'uvicorn' and 'main:app'
      const wmicOut = execSync(
        `wmic process where "name='python.exe'" get processid,commandline /format:csv`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      const orphanPids = wmicOut
        .split('\n')
        .filter(l => l.toLowerCase().includes('uvicorn') && l.toLowerCase().includes('main:app'))
        .map(l => { const parts = l.trim().split(','); return parts[parts.length - 1].trim(); })
        .filter(p => p && /^\d+$/.test(p));

      if (orphanPids.length > 0) {
        console.log(`[Python] Killing ${orphanPids.length} orphan uvicorn process(es): ${orphanPids.join(', ')}`);
        orphanPids.forEach(pid => {
          try { execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' }); } catch (_) {}
        });
      }
    } catch (_) {
      // wmic not available or no matching processes — that's fine
    }
  }

  // ── Step 2: Kill by port (broad — all connection states, not just LISTENING) ─
  let killedAny = false;
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        `netstat -ano | findstr " :${FASTAPI_INTERNAL_PORT} "`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      const pids = [...new Set(
        out.trim().split('\n')
          .map(l => l.trim().split(/\s+/).at(-1))
          .filter(p => p && /^\d+$/.test(p) && p !== '0')
      )];
      pids.forEach(pid => {
        try {
          execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
          console.log(`[Python] Killed PID ${pid} from port ${FASTAPI_INTERNAL_PORT}`);
          killedAny = true;
        } catch (_) {}
      });
    } else {
      execSync(`fuser -k ${FASTAPI_INTERNAL_PORT}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch (_) { /* findstr exits 1 when nothing found — fine */ }

  // ── Step 3: Wait for port to clear, then start ───────────────────────────────
  // On Windows, taskkill is async under the hood — give the OS time to release the port
  const delay = killedAny && process.platform === 'win32' ? 1000 : 100;

  setTimeout(() => {
    if (isShuttingDown) return;

    if (!isPortFree(FASTAPI_INTERNAL_PORT)) {
      if (retry < 6) {
        console.warn(`[Python] Port ${FASTAPI_INTERNAL_PORT} still busy, retrying in 1s (attempt ${retry + 1}/6)...`);
        setTimeout(() => killPortThenStart(retry + 1), 1000);
      } else {
        console.error(`[Python] Port ${FASTAPI_INTERNAL_PORT} still busy after all retries. Giving up.`);
      }
      return;
    }
    startPythonServer();
  }, delay);
}

process.on('exit', cleanupPython);
process.on('SIGINT', () => { cleanupPython(); process.exit(0); });
process.on('SIGTERM', () => { cleanupPython(); process.exit(0); });

// Give any previous zombie 500ms to die, then clear port and start fresh
setTimeout(() => killPortThenStart(0), 500);
// ─────────────────────────────────────────────────────────────────────────────

cloudinary.v2.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.Cloud_Api,
  api_secret: process.env.Cloud_Secret,
});


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());


import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import insuranceRoutes from './routes/insuranceRoutes.js';
import taxRoutes from "./routes/taxRoutes.js";
import loanRoutes from './routes/loanRoutes.js';
import lenderRoutes from './routes/lenderRoutes.js';
import lenderAuthRoutes from './routes/lenderAuthRoutes.js';

import platformRoutes from './routes/platformRoutes.js';
import statementRoutes from './routes/statementRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import chatRoutes from "./routes/chatRoutes.js";
import creditRoutes from './routes/creditRoutes.js';

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use("/api/tax", taxRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/lender', lenderRoutes);
app.use('/api/lender-auth', lenderAuthRoutes);

app.use('/api/platform', platformRoutes);
app.use('/api/statement', statementRoutes);
app.use('/api/income', incomeRoutes);
app.use("/api/ai", chatRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/credit', creditRoutes);  

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

connectDb().then(() => {
  app.listen(process.env.PORT || port, () => {
    console.log(
      `Server is running on http://localhost:${process.env.PORT || port}`,
    );
  });
});
