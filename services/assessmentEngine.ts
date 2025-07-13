
// NOTE: This file translates the Python-based engine logic into TypeScript.
// For simplicity in a React context, some complex stateful parts like confidence
// calibration are simplified or implemented with more straightforward logic.
// A full implementation of the detailed engines would require more complex state management.

export class ImprovedAdaptiveDifficultyEngine {
  private current_difficulty: number;
  private recent_performance: boolean[] = [];
  private consecutive_correct = 0;
  private consecutive_incorrect = 0;
  private readonly MAX_HISTORY = 10;
  private readonly MIN_DIFFICULTY = 1;
  private readonly MAX_DIFFICULTY = 100;

  constructor(initial_difficulty: number) {
    this.current_difficulty = initial_difficulty;
  }

  public update_difficulty(is_correct: boolean, response_time: number, confidence: number, estimated_time: number): number {
    this.update_history(is_correct);
    const adjustment = this.calculate_enhanced_adjustment(is_correct, response_time, confidence, estimated_time);
    this.current_difficulty += adjustment;
    this.current_difficulty = Math.max(this.MIN_DIFFICULTY, Math.min(this.MAX_DIFFICULTY, this.current_difficulty));
    return this.current_difficulty;
  }

  private update_history(is_correct: boolean): void {
    this.recent_performance.push(is_correct);
    if (this.recent_performance.length > this.MAX_HISTORY) {
      this.recent_performance.shift();
    }

    if (is_correct) {
      this.consecutive_correct++;
      this.consecutive_incorrect = 0;
    } else {
      this.consecutive_incorrect++;
      this.consecutive_correct = 0;
    }
  }

  private calculate_enhanced_adjustment(is_correct: boolean, response_time: number, confidence: number, estimated_time: number): number {
    // 1. Basic Performance Adjustment
    let base_adjustment = is_correct ? 5 : -7;
    const streak_bonus = is_correct ? Math.min(this.consecutive_correct * 1.5, 10) : -Math.min(this.consecutive_incorrect * 1.5, 10);
    base_adjustment += streak_bonus;

    // 2. Enhanced Confidence Impact (simplified)
    // High confidence + correct -> bigger increase
    // Low confidence + correct -> smaller increase
    // High confidence + incorrect -> bigger decrease
    // Low confidence + incorrect -> smaller decrease (user knew they were guessing)
    const confidence_impact = (confidence - 0.5) * 10; // scale from -5 to +5
    let confidence_adjustment = is_correct ? confidence_impact : -confidence_impact;

    // 3. Response Time Impact
    const time_impact = this.calculate_time_impact(response_time, estimated_time, is_correct);

    // 4. Dynamic Stability Adjustment (simplified)
    const stability_factor = this.calculate_stability_factor();

    const total_adjustment = (base_adjustment + confidence_adjustment + time_impact) * stability_factor;
    return total_adjustment;
  }

  private calculate_time_impact(response_time: number, estimated_time: number, is_correct: boolean): number {
    const time_ratio = response_time / (estimated_time + 1); // Avoid division by zero
    if (is_correct) {
      // Rewarded for being fast and correct
      if (time_ratio < 0.7) return 3;
      // Penalized for being very slow and correct (might indicate struggling)
      if (time_ratio > 1.5) return -2;
    } else {
      // Penalized for being fast and incorrect (guessing)
      if (time_ratio < 0.5) return -4;
      // Slightly less penalized if they took time (indicates thought)
      if (time_ratio > 1.2) return -1;
    }
    return 0;
  }

  private calculate_stability_factor(): number {
    if (this.recent_performance.length < 5) return 0.8; // Be cautious at the start
    const changes = this.recent_performance.slice(1).filter((val, i) => val !== this.recent_performance[i]).length;
    const change_rate = changes / this.recent_performance.length;

    if (change_rate > 0.6) return 0.7; // High fluctuation, slow down changes
    if (change_rate < 0.2) return 1.2; // Stable performance, accelerate changes
    return 1.0;
  }
}
