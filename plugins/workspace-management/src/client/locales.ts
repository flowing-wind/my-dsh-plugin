/** Localized workspace deletion controls. */
/** Workspace management labels. */
export const zh = {
  deleteSession: '删除对话', allSessions: '同时永久删除此工作区的所有对话（含已归档）',
  sessionNote: '永久删除对话记录及用量明细，保留工作区文件。累计统计不会回退。',
  filesUnavailable: '只有配置的可删除工作区根目录下的子目录允许删除磁盘文件。',
  title: '对话与工作区', subtitle: '管理保存的对话与工作区，删除前请确认所选内容。',
  sessions: '对话', workspaces: '工作区', remove: '删除', cancel: '取消', confirm: '确认删除',
  confirmation: '永久删除所选内容？此操作无法撤销。', retain: '工作区目录和文件默认保留，对话记录也会保留。',
  files: '同时永久删除此工作区的磁盘文件', filesNote: '此选项会停止相关对话的运行。是否删除记录由上方的对话选项决定。',
  error: '操作未完成：{message}', loading: '正在读取…', refresh: '刷新', pending: '正在删除…', empty: '暂无记录',
}
/** English workspace management labels. */
export const en: Record<keyof typeof zh, string> = {
  deleteSession: 'Delete conversation', allSessions: 'Also permanently delete all workspace conversations, including archived ones',
  sessionNote: 'Permanently deletes the conversation and its usage details. Workspace files and aggregate usage totals are retained.',
  filesUnavailable: 'Disk deletion is allowed only below the configured removable workspace root.',
  title: 'Conversations & workspaces', subtitle: 'Manage saved conversations and workspaces. Review your selection before deleting.',
  sessions: 'Conversations', workspaces: 'Workspaces', remove: 'Delete', cancel: 'Cancel', confirm: 'Confirm deletion',
  confirmation: 'Permanently delete the selection? This cannot be undone.', retain: 'Workspace files and conversation logs are retained by default.',
  files: 'Also permanently delete files on disk', filesNote: 'This stops related conversations. The conversation checkbox controls whether their logs are deleted.',
  error: 'Operation did not complete: {message}', loading: 'Loading…', refresh: 'Refresh', pending: 'Deleting…', empty: 'No records',
}
