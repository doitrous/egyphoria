/** The seven calculator kinds the ticket names. Each has one small client component below. */
export type ToolKind =
  | 'cost-estimator'
  | 'comparison-table'
  | 'season-picker'
  | 'bmi-eligibility'
  | 'visa-checker'
  | 'tipping-budget'
  | 'sessions-estimator'

export type NumberInput = { key: string; label: string; type: 'number'; default: number; min?: number; max?: number }
export type SelectInput = {
  key: string; label: string; type: 'select'; default: string; options: { value: string; label: string }[]
  /** Multiplies the selected option's rate by another input's numeric value — e.g. a per-session
   * procedure price times a "sessions" number input. Omit for a flat, one-time rate. */
  multiplyBy?: string
}
export type ToggleInput = { key: string; label: string; type: 'toggle'; default: boolean }
export type CostInput = NumberInput | SelectInput | ToggleInput

/** cost-estimator config: inputs × a flat rate table. A select/toggle input's rate key is
 * "{inputKey}:{value}" for a select, or just "{inputKey}" for a toggle/number input. */
export type CostEstimatorConfig = {
  title: string
  currency: string
  inputs: CostInput[]
  rates: Record<string, number>
}

export type ComparisonTableConfig = {
  title: string
  columns: { key: string; label: string }[]
  rows: { label: string; values: Record<string, string | number> }[]
  highlightMin?: boolean
}

export type SeasonPickerConfig = {
  title: string
  months: { month: string; label: string; rating: 1 | 2 | 3 | 4 | 5; note: string }[]
}

export type BmiEligibilityConfig = {
  title: string
  ranges: { maxBmi: number; label: string; eligible: boolean }[]
}

export type VisaCheckerConfig = {
  title: string
  rules: { nationality: string; requirement: string; notes: string }[]
  defaultNotice: string
}

export type TippingBudgetConfig = {
  title: string
  currency: string
  defaultDays: number
  roles: { key: string; label: string; perDay: number; defaultIncluded: boolean }[]
}

export type SessionsEstimatorConfig = {
  title: string
  currency: string
  baseSessions: number
  pricePerSession: number
  factors: { key: string; label: string; extraSessions: number }[]
}
