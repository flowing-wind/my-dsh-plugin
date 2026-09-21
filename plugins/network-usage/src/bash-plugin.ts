/** Session-attributed proxy environment for approved full-access Bash commands. */
import { SandboxBashExecutor } from '@deepseek-ai/dsh-bash-sandbox'
import type { ShellExecRequest, ShellExecSpec } from '@deepseek-ai/dsh-shell'
import type {} from './proxy-plugin.ts'

/** Retains Bash sandbox and approval behavior while authenticating unconfined downloads. */
export class NetworkBashExecutor extends SandboxBashExecutor {
  static override inject = [...SandboxBashExecutor.inject, 'networkProxy']

  /**
   * Attach owner-specific proxy credentials only to unconfined commands.
   * @param request - Command and its already-resolved execution policy.
   * @returns Execution spec with metered proxy variables for full-access mode.
   */
  override resolve(request: ShellExecRequest): ShellExecSpec {
    const spec = super.resolve(request)
    if (spec.sandboxPolicy?.mode !== 'danger-full-access') return spec
    const url = this.ctx.networkProxy.shellUrl(spec.sandboxPolicy.sessionId ?? 'host')
    return { ...spec, env: { ...spec.env,
      HTTP_PROXY: url, HTTPS_PROXY: url, ALL_PROXY: url,
      http_proxy: url, https_proxy: url, all_proxy: url,
    } }
  }
}
export default NetworkBashExecutor
