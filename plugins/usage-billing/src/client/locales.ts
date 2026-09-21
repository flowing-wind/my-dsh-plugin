/** Billing labels owned by the optional usage plugin. */
export const zh = {
  ungrouped: '未分组', unnamed: '未命名对话', archived: '已归档', subtotal: '工作区内对话合计',
  todayTokens: '今日 Token', todayCost: '今日预估 ¥{cost}', lifetimeCost: '累计预估 ¥{cost}',
  title: '用量与余额',
  balance: '账户余额', total: '历史预估费用', tokens: '累计 Token', hit: '缓存命中率',
  peak: '高峰计价', offPeak: '空闲计价', unknown: '价格未配置',
  session: '对话', input: '输入', output: '输出', cost: '预估费用', refresh: '刷新',
  loading: '正在读取用量…', error: '无法读取用量，请重试', unavailable: '余额暂不可用',
  notice: '今日按北京时间自然日统计，费用以 DeepSeek 实际扣费为准。明细仅包含现有及归档对话；删除明细不回退累计统计。',
  unpriced: '有 {count} 次请求缺少价格，未计入费用。', current: '本对话约 ¥{cost}',
  empty: '还没有产生用量', deleted: '对话已删除或未载入',
  details: '对话 Token 与费用明细（{count}）',
}
/** Exact English counterpart of the billing namespace. */
export const en: Record<keyof typeof zh, string> = {
  ungrouped: 'Ungrouped', unnamed: 'Untitled conversation', archived: 'Archived', subtotal: 'Workspace conversation subtotal',
  todayTokens: 'Today’s tokens', todayCost: 'Today ≈ ¥{cost}', lifetimeCost: 'Lifetime ≈ ¥{cost}',
  title: 'Usage & balance',
  balance: 'Account balance', total: 'Estimated lifetime cost', tokens: 'Total tokens', hit: 'Cache hit rate',
  peak: 'Peak pricing', offPeak: 'Off-peak pricing', unknown: 'Price unavailable',
  session: 'Conversation', input: 'Input', output: 'Output', cost: 'Estimated cost', refresh: 'Refresh',
  loading: 'Loading usage…', error: 'Could not load usage. Please retry.', unavailable: 'Balance unavailable',
  notice: 'Today follows the Beijing calendar day; DeepSeek charges are authoritative. Details include existing and archived conversations only; deleting details retains aggregate totals.',
  unpriced: '{count} requests have no configured price and are excluded from cost.', current: 'This conversation ≈ ¥{cost}',
  empty: 'No usage yet', deleted: 'Conversation deleted or not loaded',
  details: 'Conversation token and cost details ({count})',
}
