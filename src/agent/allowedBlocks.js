// Dependency-free protocol allowlist. The provider validates streamed blocks
// before the deferred visual renderer is loaded.
export const ALLOWED_BLOCKS = new Set([
  'summary_card', 'action_card', 'confirmation_card', 'metric_grid', 'data_table',
  'chart_block', 'form_block', 'suggestion_chips', 'progress_steps', 'error_card',
  'calculation_steps', 'source_card', 'rag_source_block', 'latex_formula_block',
  'derivation_steps_block', 'payoff_chart_block', 'payoff_block',
  'black_scholes_explorer_block', 'bs_pricer_block', 'greeks_sensitivity_block',
  'put_call_parity_block', 'monte_carlo_simulation_block', 'binomial_tree_block',
  'structured_product_payoff_block', 'exercise_block', 'quiz_block',
  'answer_feedback_block', 'concept_map_block',
]);
