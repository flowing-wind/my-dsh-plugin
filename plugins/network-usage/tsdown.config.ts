import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle('@deepseek-ai/dsh-experimental-network-usage',
  ['lib/types/index.js', 'lib/types/proxy-plugin.js', 'lib/types/sandbox-plugin.js', 'lib/types/bash-plugin.js'], { hostPhase: true })
