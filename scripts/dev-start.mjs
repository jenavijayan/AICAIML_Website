import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function killProcessesOnPorts(ports) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'powershell' : 'sh';
    const script = process.platform === 'win32'
      ? `foreach ($port in ${ports.map((port) => `'${port}'`).join(', ')}) { try { $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; foreach ($connection in $connections) { try { Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue } catch {} } } catch {} }`
      : `for port in ${ports.join(' ')}; do (ss -ltnp 2>/dev/null | awk -v p=\"$port\" '$4 ~ ":" p "$" {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\\1/' | xargs -r kill -9 || true); done`;
    const args = process.platform === 'win32' ? ['-NoProfile', '-Command', script] : ['-c', script];
    const child = spawn(cmd, args, { stdio: 'ignore' });
    child.on('exit', () => resolve(undefined));
  });
}

function killMatchingProcesses() {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'powershell' : 'sh';
    const args = process.platform === 'win32'
      ? ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.ProcessId -ne [System.Diagnostics.Process]::GetCurrentProcess().Id -and $_.CommandLine -match 'server\\.ts|vite|tsx|vitest|dist/server\\.cjs' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"]
      : ['-c', "ps -eo pid,command | grep -E 'node .*server\\.ts|vite|tsx|vitest|dist/server\\.cjs' | grep -v grep | awk '{print $1}' | xargs -r kill -9"];
    const child = spawn(cmd, args, { stdio: 'ignore' });
    child.on('exit', () => resolve(undefined));
  });
}

async function main() {
  await killMatchingProcesses();
  await killProcessesOnPorts([3000, 3001, 3002, 24678]);
  const env = {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: '3000',
    HMR_PORT: '3001',
    NODE_ENV: 'development'
  };

  const child = spawn(process.execPath, [path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'server.ts'], {
    cwd: rootDir,
    env,
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
