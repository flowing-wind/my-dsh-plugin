export const zh = {
  title: '个性化', heading: '全局 AGENTS.md', description: '编辑 Harness 主目录下的全局 AGENTS.md。新建或重新打开会话时，Harness 会读取最新内容。',
  conflict: '文件已在别处修改。请先复制编辑内容，再重新打开此页。', loadFailed: '无法读取全局 AGENTS.md。',
  save: '保存', saved: '已保存', saving: '正在保存…', failed: '保存失败：{message}', placeholder: '填写希望 Agent 始终遵循的要求',
} as const
export const en: Record<keyof typeof zh, string> = {
  title: 'Personalization', heading: 'Global AGENTS.md', description: 'Edit the global AGENTS.md in the Harness home. Harness reads the latest instructions when you start or reopen a session.',
  conflict: 'The file changed elsewhere. Copy your edits, then reopen this page.', loadFailed: 'Could not read the global AGENTS.md.',
  save: 'Save', saved: 'Saved', saving: 'Saving…', failed: 'Could not save: {message}', placeholder: 'Enter instructions the Agent should always follow',
}
