/**
 * dsh-notify-relay · 手机信使（Host插件·零依赖·无构建）
 * 让AI长任务结束/出事时主动推通知到你手机：支持 Server酱(sc.ftqq.com)·Bark·Gotify·任意webhook。
 * 配置 webhook 即用；纪律区块管"什么时候该推"。
 */
export const name = 'notify-relay'
export const inject = ['systemPrompt', 'tools']
const SECTION = 'notify-relay:rules'
const DEFAULTS = { order: 96, enabled: true, tool: true, webhook: '', title: 'DSH 信使' }

function norm(c) {
  const r = c ?? {}
  return {
    order: typeof r.order === 'number' ? r.order : DEFAULTS.order,
    enabled: r.enabled !== false,
    tool: r.tool !== false,
    webhook: typeof r.webhook === 'string' ? r.webhook.trim() : '',
    title: typeof r.title === 'string' && r.title ? r.title : DEFAULTS.title,
  }
}

function renderSection() {
  return [
    '## 手机信使 · 主动通知纪律',
    '',
    '**该推的（跑 notify_send）**：①长任务（>3分钟）完成时——结果一句话+关键读数；②出错/阻塞时——错因+下一步；③需要用户决策时——选项列清楚。',
    '**不该推的**：中间进度（除非超10分钟）、能自己修的小事、纯过程日志。通知是打扰，省着用——宁缺毋滥，推送内容必须值回打扰成本。',
    '**格式**：标题一句话结论，正文≤3行（结果/读数/下一步）。没有 webhook 配置时工具会报未配置——提醒用户去设置面板填。',
  ].join('\n')
}

export default function plugin(ctx) {
  const cfg = norm(ctx.config?.[SECTION])
  if (!cfg.enabled) { ctx.logger?.info?.('dsh-notify-relay: disabled'); return }
  ctx.registerSection?.({ name: SECTION, order: cfg.order, render: () => renderSection() })

  if (cfg.tool) {
    ctx.registerTool?.({
      name: 'notify_send',
      description: '推送一条通知到用户手机（Server酱/Bark/Gotify/任意webhook，取面板配置）。用于长任务完成/出错/需决策时主动告知。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '一句话标题（结论式）' },
          body: { type: 'string', description: '正文≤3行：结果/读数/下一步' },
        },
        required: ['title'],
        additionalProperties: false,
      },
      output: { schema: { type: 'object', properties: { report: { type: 'string' } }, required: ['report'], additionalProperties: false } },
      execute: async (args) => {
        try {
          const hook = ctx.config?.[SECTION]?.webhook || process.env.DSH_NOTIFY_WEBHOOK || ''
          if (!hook) return { report: '未配置 webhook。请在插件设置里填 Server酱 SendKey 地址(https://sctapi.ftqq.com/<KEY>.send)或 Bark/Gotify 地址；也可设环境变量 DSH_NOTIFY_WEBHOOK。' }
          const title = String(args?.title ?? cfg.title).slice(0, 64)
          const body = String(args?.body ?? '').slice(0, 900)
          const isServerChan = hook.includes('ftqq.com') || hook.includes('sctapi')
          const isBark = /https?:\/\/[^/]+\/[^/]+\/?$/.test(hook) && hook.includes('/notify') === false && !hook.includes('?')
          let url, payload, headers = { 'Content-Type': 'application/json' }
          if (isServerChan) { url = hook; payload = JSON.stringify({ title, desp: body }) }
          else if (/gotify/i.test(hook)) { url = hook.includes('/message') ? hook : hook.replace(/\/$/, '') + '/message'; payload = JSON.stringify({ title, message: body, priority: 5 }) }
          else { url = hook; payload = JSON.stringify({ title, body, message: body }) } // Bark与通用webhook都吃{title,message/body}
          const res = await fetch(url, { method: 'POST', headers, body: payload })
          const ok = res.ok
          return { report: ok ? `【信使】已推送：「${title}」` : `【信使】推送失败 HTTP ${res.status}（查 webhook 地址/Key）` }
        } catch (error) {
          return { report: 'notify-relay 内部错：' + String(error?.message ?? error).slice(0, 160) }
        }
      },
    })
  }
  ctx.logger?.info?.('dsh-notify-relay: section %s registered (order=%d)', SECTION, cfg.order)
}
