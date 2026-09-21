/** Bubblewrap filesystem confinement plus a Session-owned proxy in a private network namespace. */
import { Context } from '@deepseek-ai/cordis'
import { LocalSandboxProvider } from '@deepseek-ai/dsh-sandbox-local'
import type { Config } from '@deepseek-ai/dsh-sandbox-local'
import { basename } from 'node:path'
import type { ConfinedArgv, SandboxPolicy } from '@deepseek-ai/dsh-sandbox'
import type {} from './proxy-plugin.ts'

export type { Config } from '@deepseek-ai/dsh-sandbox-local'

const bridge = `
const net = require('node:net');
const { spawn } = require('node:child_process');
const [socketPath, command, ...args] = process.argv.slice(1);
const sockets = new Set();
const server = net.createServer(client => {
  const remote = net.connect(socketPath);
  sockets.add(client); sockets.add(remote);
  const close = () => { client.destroy(); remote.destroy(); sockets.delete(client); sockets.delete(remote); };
  client.on('error', close); remote.on('error', close);
  client.on('close', close); remote.on('close', close);
  client.pipe(remote); remote.pipe(client);
});
server.listen(0, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + server.address().port;
  const env = { ...process.env, HTTP_PROXY: url, HTTPS_PROXY: url, ALL_PROXY: url,
    http_proxy: url, https_proxy: url, all_proxy: url,
    NO_PROXY: 'localhost,127.0.0.1,::1', no_proxy: 'localhost,127.0.0.1,::1', NODE_USE_ENV_PROXY: '1' };
  const child = spawn(command, args, { stdio: 'inherit', env });
  const finish = code => {
    for (const socket of sockets) socket.destroy();
    server.close(() => { process.exitCode = code; });
  };
  child.once('error', error => { console.error(error.message); finish(1); });
  child.once('exit', (code, signal) => finish(code === null ? 1 : code));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
`

/** Linux-only opt-in provider; direct external sockets cannot leave the network namespace. */
export class NetworkSandbox extends LocalSandboxProvider {
  static inject = ['networkProxy']
  /** @param ctx - Session proxy service. @param options - Explicit Linux runner paths. */
  constructor(ctx: Context, options: Config) {
    super(ctx, options)
    if (process.platform !== 'linux') throw new Error('NetworkSandbox requires Linux bubblewrap network namespaces')
    if (options.runnerCommand?.length !== 1 || basename(options.runnerCommand[0]!) !== 'bwrap') {
      throw new Error('NetworkSandbox requires runnerCommand naming exactly the bubblewrap executable')
    }
  }

  /**
   * Confine the command and expose only its Session's metered proxy socket.
   * @param argv - Exact command and arguments.
   * @param policy - Filesystem policy and required Session identity.
   * @param signal - Cancellation before spawn.
   * @returns Filesystem-enforcing argv with direct external networking disabled.
   */
  override async confine(argv: readonly string[], policy: SandboxPolicy, signal?: AbortSignal): Promise<ConfinedArgv> {
    if (policy.sessionId === undefined) throw new Error('Network sandbox requires a Session identity')
    const socket = await this.ctx.networkProxy.socketFor(policy.sessionId)
    const wrapped = await super.confine([
      process.execPath, '--eval', bridge, '--', '/run/dsh-egress.sock', ...argv,
    ], policy, signal)
    const separator = wrapped.argv.indexOf('--')
    wrapped.argv.splice(separator, 0,
      '--unshare-net', '--tmpfs', '/run',
      '--tmpfs', this.ctx.networkProxy.config.socketDirectory,
      '--ro-bind', socket, '/run/dsh-egress.sock',
    )
    return wrapped
  }
}

export default NetworkSandbox
