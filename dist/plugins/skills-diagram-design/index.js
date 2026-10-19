/** Register the package's global skill catalog with Harness's filesystem provider. */
import * as filesystem from '@deepseek-ai/dsh-skill-filesystem'
import { fileURLToPath } from 'node:url'
export const inject = ['skills']
/** @param ctx - Cordis context owning the packaged skill provider. */
export function apply(ctx) {
  ctx.plugin(filesystem, { providerName: 'flowing-wind-skills-diagram-design', includeDefaultRoots: false, customSkillDirs: [fileURLToPath(new URL('./skills/', import.meta.url))], watch: false })
}
