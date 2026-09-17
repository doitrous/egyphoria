import type { ToolKind } from './types'
import { CostEstimator } from './CostEstimator'
import { ComparisonTable } from './ComparisonTable'
import { SeasonPicker } from './SeasonPicker'
import { BmiEligibility } from './BmiEligibility'
import { VisaChecker } from './VisaChecker'
import { TippingBudget } from './TippingBudget'
import { SessionsEstimator } from './SessionsEstimator'

export * from './types'
export * from './calc'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TOOL_COMPONENTS: Record<ToolKind, React.ComponentType<{ config: any }>> = {
  'cost-estimator': CostEstimator,
  'comparison-table': ComparisonTable,
  'season-picker': SeasonPicker,
  'bmi-eligibility': BmiEligibility,
  'visa-checker': VisaChecker,
  'tipping-budget': TippingBudget,
  'sessions-estimator': SessionsEstimator,
}

/** Picks the component for a tool's `kind`. Unknown kind (a hub typo, a kind this template
 * hasn't shipped yet) renders a plain notice rather than crashing the page. */
export function ToolRenderer({ kind, config }: { kind: string; config: Record<string, unknown> }) {
  const Component = TOOL_COMPONENTS[kind as ToolKind]
  if (!Component) return <p>Unknown tool kind: {kind}</p>
  return <Component config={config} />
}
