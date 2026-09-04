export interface ServerStatus {
  online: boolean;
  sessions?: number;
  error?: string;
}

// "Is the server up" answered by OPENING THE LOGIN PORT, not by calling an HTTP API.
//
// This used to GET http://host:8088/api/sessions -- LSB's optional REST API. That service is
// not running on the test server and would need its own port opened to the internet to serve
// one badge, so the badge was red on every launcher no matter how healthy the server was.
//
// A TCP connect to the login port is the same question a tester actually has ("can I log in?")
// and needs nothing running that is not already there. `sessions` is simply unknown now, and
// the UI already treats it as optional.
export async function getServerStatus(host: string, port: number): Promise<ServerStatus> {
  const net = await import('net');

  return new Promise<ServerStatus>((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (status: ServerStatus) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(5000);
    socket.once('connect', () => finish({ online: true }));
    socket.once('timeout', () => finish({ online: false, error: 'timed out' }));
    socket.once('error', (err: Error) => finish({ online: false, error: err.message }));
    socket.connect(port, host);
  });
}
