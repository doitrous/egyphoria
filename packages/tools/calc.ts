// Pure calculation functions, one per tool kind, kept separate from the React components so
// test/tools.test.ts can exercise the math with no DOM/React involved.
import type {
  BmiEligibilityConfig, CostEstimatorConfig, CostInput, SeasonPickerConfig,
  SessionsEstimatorConfig, TippingBudgetConfig, VisaCheckerConfig,
} from './types'

/** cost-estimator: sum each input's contribution against the flat rate table. */
export function computeCostEstimate(config: CostEstimatorConfig, values: Record<string, number | string | boolean>): number {
  let total = 0
  for (const input of config.inputs) {
    const v = values[input.key] ?? input.default
    if (input.type === 'number') total += Number(v) * (config.rates[input.key] ?? 0)
    else if (input.type === 'select') {
      const rate = config.rates[`${input.key}:${v}`] ?? 0
      const multiplier = input.multiplyBy ? Number(values[input.multiplyBy] ?? 1) : 1
      total += rate * multiplier
    } else if (input.type === 'toggle' && v) total += config.rates[input.key] ?? 0
  }
  return Math.round(total * 100) / 100
}

export function defaultValues(inputs: CostInput[]): Record<string, number | string | boolean> {
  return Object.fromEntries(inputs.map((i) => [i.key, i.default]))
}

/** bmi-eligibility: standard metric BMI, then the first range whose ceiling the value clears. */
export function computeBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100
  if (m <= 0 || weightKg <= 0) return 0
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export function bmiRange(config: BmiEligibilityConfig, bmi: number) {
  return config.ranges.find((r) => bmi <= r.maxBmi) ?? config.ranges[config.ranges.length - 1] ?? null
}

/** visa-checker: exact (case-insensitive) nationality match against the rule table. */
export function findVisaRule(config: VisaCheckerConfig, nationality: string) {
  const needle = nationality.trim().toLowerCase()
  return config.rules.find((r) => r.nationality.toLowerCase() === needle) ?? null
}

/** season-picker: look up a given month's entry (month names as configured, e.g. "Jan"). */
export function findSeasonMonth(config: SeasonPickerConfig, month: string) {
  return config.months.find((m) => m.month === month) ?? null
}

/** tipping-budget: per-day rate × days, summed over the roles the caller included. */
export function computeTipping(config: TippingBudgetConfig, days: number, includedKeys: string[]): number {
  const included = new Set(includedKeys)
  return config.roles.filter((r) => included.has(r.key)).reduce((sum, r) => sum + r.perDay * days, 0)
}

/** sessions-estimator: base session count plus each selected factor's extra sessions, priced. */
export function computeSessions(config: SessionsEstimatorConfig, selectedKeys: string[]) {
  const selected = new Set(selectedKeys)
  const sessions = config.baseSessions + config.factors.filter((f) => selected.has(f.key)).reduce((sum, f) => sum + f.extraSessions, 0)
  return { sessions, cost: Math.round(sessions * config.pricePerSession * 100) / 100 }
}
