import { spawn } from 'child_process';

// Wrap a value as a PowerShell single-quoted string. Inside single quotes PowerShell
// treats everything literally, and a literal quote is written by doubling it.
function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Start a program elevated, the way double-clicking it in Explorer would.
 *
 * A plain spawn() uses CreateProcess, which never elevates -- Windows fails it with
 * ERROR_ELEVATION_REQUIRED and Node surfaces that as a bare EACCES. Start-Process -Verb RunAs
 * uses ShellExecute instead, which is what raises the UAC consent prompt.
 *
 * Resolves once the user has answered the prompt and the process has been handed off, NOT when
 * that process exits -- it keeps running independently after this returns.
 */
export async function runElevated(exe: string, args: string[], cwd: string): Promise<void> {
  const argumentList = args.length ? ` -ArgumentList ${args.map(psQuote).join(', ')}` : '';
  const script = [
    `$ErrorActionPreference = 'Stop'`,
    `Start-Process -FilePath ${psQuote(exe)}${argumentList}` +
      ` -WorkingDirectory ${psQuote(cwd)}` +
      ` -Verb RunAs`,
  ].join('; ');

  // -EncodedCommand takes base64 UTF-16LE. Encoding sidesteps the Windows command-line
  // quoting rules entirely, so paths with spaces or quotes can't corrupt the script.
  const encoded = Buffer.from(script, 'utf16le').toString('base64');

  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] }
  );

  await new Promise<void>((resolve, reject) => {
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      if (/cancell?ed/i.test(stderr)) {
        reject(new Error('Cancelled. This needs administrator permission to run.'));
        return;
      }
      reject(new Error(stderr.trim() || `Failed to start ${exe} (PowerShell exit code ${code}).`));
    });
  });
}
