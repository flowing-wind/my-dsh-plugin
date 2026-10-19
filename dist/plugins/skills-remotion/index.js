/** Register skills supplied by the pinned official Remotion repository. */
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
const require = createRequire(import.meta.url)
export const inject = ['skills']
/** @param ctx - Owner of the global skill provider. */
export function apply(ctx) {
  ctx.plugin(filesystem, { providerName: 'flowing-wind-skills-remotion', includeDefaultRoots: false, customSkillDirs: [join(dirname(require.resolve('@remotion/skills/package.json')), 'skills')], watch: false })
}
