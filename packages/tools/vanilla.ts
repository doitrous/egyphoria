// Framework-free DOM renderer for the same 7 tool kinds as packages/tools/*.tsx — for non-Next
// consumers (Laravel, static HTML). Reuses calc.ts for every calculation; never duplicates math.
// Built by scripts/build-vanilla.mjs into public/seo-tools.js (see README "vanilla bundle").
import {
  bmiRange, computeBmi, computeCostEstimate, computeSessions, computeTipping,
  defaultValues, findSeasonMonth, findVisaRule,
} from './calc'
import { embedSnippet, toolTitle } from './embed'
import type {
  BmiEligibilityConfig, ComparisonTableConfig, CostEstimatorConfig, SeasonPickerConfig,
  SessionsEstimatorConfig, TippingBudgetConfig, ToolKind, VisaCheckerConfig,
} from './types'

type Tool = { kind: string; config: Record<string, unknown> }

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag)
  if (text !== undefined) el.textContent = text
  return el
}

/** A `<label>` wrapping one bound form control — the shared shape behind every input in the kit. */
function labeled(text: string, control: HTMLElement): HTMLLabelElement {
  const label = h('label')
  label.append(`${text} `, control)
  return label
}

function numberField(value: number, onChange: (v: number) => void, min?: number, max?: number): HTMLInputElement {
  const input = h('input')
  input.type = 'number'
  if (min !== undefined) input.min = String(min)
  if (max !== undefined) input.max = String(max)
  input.value = String(value)
  input.addEventListener('input', () => onChange(Number(input.value)))
  return input
}

function selectField(options: { value: string; label: string }[], value: string, onChange: (v: string) => void): HTMLSelectElement {
  const select = h('select')
  for (const o of options) {
    const opt = h('option', o.label)
    opt.value = o.value
    select.append(opt)
  }
  select.value = value
  select.addEventListener('change', () => onChange(select.value))
  return select
}

function checkboxField(checked: boolean, onChange: (v: boolean) => void): HTMLInputElement {
  const input = h('input')
  input.type = 'checkbox'
  input.checked = checked
  input.addEventListener('change', () => onChange(input.checked))
  return input
}

function costEstimator(el: HTMLElement, config: CostEstimatorConfig) {
  const values = defaultValues(config.inputs)
  const out = h('p')
  const renderOut = () => {
    const total = computeCostEstimate(config, values)
    out.replaceChildren('Estimated total: ', h('strong', `${total.toLocaleString()} ${config.currency}`))
  }
  el.replaceChildren(h('h2', config.title))
  for (const input of config.inputs) {
    const set = (v: number | string | boolean) => { values[input.key] = v; renderOut() }
    const control = input.type === 'number' ? numberField(Number(values[input.key]), set, input.min, input.max)
      : input.type === 'select' ? selectField(input.options, String(values[input.key]), set)
      : checkboxField(Boolean(values[input.key]), set)
    el.append(labeled(input.label, control))
  }
  el.append(out)
  renderOut()
}

function comparisonTable(el: HTMLElement, config: ComparisonTableConfig) {
  const headRow = h('tr')
  headRow.append(h('th'))
  for (const c of config.columns) headRow.append(h('th', c.label))
  const thead = h('thead')
  thead.append(headRow)
  const tbody = h('tbody')
  for (const row of config.rows) {
    const nums = config.columns.map((c) => Number(row.values[c.key]))
    const min = config.highlightMin ? Math.min(...nums.filter((n) => !Number.isNaN(n))) : null
    const tr = h('tr')
    tr.append(h('th', row.label))
    for (const c of config.columns) {
      const v = row.values[c.key]
      const td = h('td')
      td.append(min !== null && Number(v) === min ? h('strong', String(v)) : String(v))
      tr.append(td)
    }
    tbody.append(tr)
  }
  const table = h('table')
  table.append(thead, tbody)
  el.replaceChildren(h('h2', config.title), table)
}

function seasonPicker(el: HTMLElement, config: SeasonPickerConfig) {
  let month = config.months[0]?.month ?? ''
  const out = h('p')
  const renderOut = () => {
    const picked = findSeasonMonth(config, month)
    out.replaceChildren(picked ? `${'★'.repeat(picked.rating)}${'☆'.repeat(5 - picked.rating)} — ${picked.note}` : '')
  }
  const select = selectField(config.months.map((m) => ({ value: m.month, label: m.label })), month, (v) => { month = v; renderOut() })
  el.replaceChildren(h('h2', config.title), labeled('Month', select), out)
  renderOut()
}

function bmiEligibility(el: HTMLElement, config: BmiEligibilityConfig) {
  let heightCm = 170
  let weightKg = 70
  const out = h('p')
  const renderOut = () => {
    const bmi = computeBmi(heightCm, weightKg)
    const range = bmi > 0 ? bmiRange(config, bmi) : null
    if (!range) { out.replaceChildren(); return }
    out.replaceChildren('BMI: ', h('strong', String(bmi)), ` — ${range.label} (${range.eligible ? 'eligible' : 'not eligible'})`)
  }
  const height = labeled('Height (cm)', numberField(heightCm, (v) => { heightCm = v; renderOut() }))
  const weight = labeled('Weight (kg)', numberField(weightKg, (v) => { weightKg = v; renderOut() }))
  el.replaceChildren(h('h2', config.title), height, weight, out)
  renderOut()
}

function visaChecker(el: HTMLElement, config: VisaCheckerConfig) {
  let nationality = ''
  const out = h('p')
  const renderOut = () => {
    if (!nationality) { out.replaceChildren(); return }
    const rule = findVisaRule(config, nationality)
    out.replaceChildren(rule ? `${rule.requirement} — ${rule.notes}` : config.defaultNotice)
  }
  const options = [{ value: '', label: 'Select…' }, ...config.rules.map((r) => ({ value: r.nationality, label: r.nationality }))]
  const select = selectField(options, nationality, (v) => { nationality = v; renderOut() })
  el.replaceChildren(h('h2', config.title), labeled('Nationality', select), out)
  renderOut()
}

function tippingBudget(el: HTMLElement, config: TippingBudgetConfig) {
  let days = config.defaultDays
  const included = new Set(config.roles.filter((r) => r.defaultIncluded).map((r) => r.key))
  const out = h('p')
  const renderOut = () => {
    const total = computeTipping(config, days, [...included])
    out.replaceChildren('Suggested tipping budget: ', h('strong', `${total.toLocaleString()} ${config.currency}`))
  }
  const daysLabel = labeled('Days', numberField(days, (v) => { days = v; renderOut() }, 1))
  el.replaceChildren(h('h2', config.title), daysLabel)
  for (const r of config.roles) {
    const toggle = (v: boolean) => { if (v) included.add(r.key); else included.delete(r.key); renderOut() }
    el.append(labeled(r.label, checkboxField(included.has(r.key), toggle)))
  }
  el.append(out)
  renderOut()
}

function sessionsEstimator(el: HTMLElement, config: SessionsEstimatorConfig) {
  const selected = new Set<string>()
  const out = h('p')
  const renderOut = () => {
    const { sessions, cost } = computeSessions(config, [...selected])
    out.replaceChildren(
      'Estimated sessions: ', h('strong', String(sessions)), ' — estimated cost: ',
      h('strong', `${cost.toLocaleString()} ${config.currency}`),
    )
  }
  el.replaceChildren(h('h2', config.title))
  for (const f of config.factors) {
    const toggle = (v: boolean) => { if (v) selected.add(f.key); else selected.delete(f.key); renderOut() }
    el.append(labeled(f.label, checkboxField(selected.has(f.key), toggle)))
  }
  el.append(out)
  renderOut()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RENDERERS: Record<ToolKind, (el: HTMLElement, config: any) => void> = {
  'cost-estimator': costEstimator,
  'comparison-table': comparisonTable,
  'season-picker': seasonPicker,
  'bmi-eligibility': bmiEligibility,
  'visa-checker': visaChecker,
  'tipping-budget': tippingBudget,
  'sessions-estimator': sessionsEstimator,
}

export const kinds = Object.keys(RENDERERS) as ToolKind[]

/** Renders one tool into `el`, replacing its content. Unknown kind renders a plain notice,
 * matching ToolRenderer's fallback in packages/tools/index.tsx. */
export function render(el: HTMLElement, tool: Tool): void {
  const renderer = RENDERERS[tool.kind as ToolKind]
  if (!renderer) { el.replaceChildren(h('p', `Unknown tool kind: ${tool.kind}`)); return }
  renderer(el, tool.config)
}

// Auto-init: seo-runtime's Laravel/Express packages render tool pages as
// `<div id="seo-tool-{slug}" class="seo-tool-placeholder" data-kind="..." data-config="{escaped JSON}">`
// (see Entities::toolBodyHtml in the Laravel package). data-config holds the tool's `config`
// object only; `kind` comes from data-kind. The browser un-escapes the attribute for us.
function initAll() {
  document.querySelectorAll<HTMLElement>('.seo-tool-placeholder[data-kind][data-config]').forEach((el) => {
    const kind = el.dataset.kind
    const raw = el.dataset.config
    if (!kind || !raw) return
    try {
      render(el, { kind, config: JSON.parse(raw) })
    } catch {
      el.replaceChildren(h('p', `Invalid tool config: ${kind}`))
    }
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll)
else initAll()

declare global {
  interface Window { SeoTools: { render: typeof render; embedSnippet: typeof embedSnippet; toolTitle: typeof toolTitle; kinds: ToolKind[] } }
}
window.SeoTools = { render, embedSnippet, toolTitle, kinds }
