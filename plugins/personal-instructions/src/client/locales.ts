export const zh = {
  title: '个性化', heading: '个性化要求', description: '为所有对话向 Agent 提供额外说明和上下文。工作区中的 AGENTS.md 仍会按原有规则生效。',
  save: '保存', saved: '已保存', saving: '正在保存…', failed: '保存失败：{message}', placeholder: '填写希望 Agent 始终遵循的要求',
} as const
export const en: Record<keyof typeof zh, string> = {
  title: 'Personalization', heading: 'Personal instructions', description: 'Give the Agent extra instructions and context in every conversation. Workspace AGENTS.md files continue to apply normally.',
  save: 'Save', saved: 'Saved', saving: 'Saving…', failed: 'Could not save: {message}', placeholder: 'Enter instructions the Agent should always follow',
}
