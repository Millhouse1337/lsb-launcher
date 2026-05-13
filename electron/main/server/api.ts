export interface ServerStatus {
  online: boolean;
  sessions?: number;
  error?: string;
}

export async function getServerStatus(host: string, port: number): Promise<ServerStatus> {
  const url = `http://${host}:${port}/api/sessions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const body = await res.json();
    return { online: true, sessions: typeof body === 'number' ? body : undefined };
  } catch (err) {
    return { online: false, error: err instanceof Error ? err.message : 'unknown' };
  } finally {
    clearTimeout(timer);
  }
}
