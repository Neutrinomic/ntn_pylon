### 📊 Grid Trader Module

The **Grid Trader** module implements an automated grid trading strategy that places buy and sell orders at regular price intervals. It profits from price oscillations in ranging markets by buying low and selling high within a defined price grid.

---

### ⚙️ How It Works

1. **Grid Initialization**:
   * Creates a grid of buy and sell orders around a center price
   * Buy orders are placed below the current price
   * Sell orders are placed above the current price
   * Grid spacing determines the percentage distance between levels

2. **Order Execution**:
   * Monitors market price at regular intervals
   * Executes buy orders when price drops to grid levels
   * Executes sell orders when price rises to grid levels
   * Respects maximum slippage limits for all trades

3. **Auto-Rebalancing**:
   * Detects significant price movements outside the grid
   * Automatically repositions the grid around new price levels
   * Maintains optimal order distribution for current market conditions

4. **Profit Generation**:
   * Captures profits from price oscillations between grid levels
   * Accumulates gains from successful buy-low, sell-high cycles
   * Tracks total profit and number of executed orders

---

### 🔢 Configurable Parameters

| Parameter           | Description                                               | Range/Example    |
| ------------------- | --------------------------------------------------------- | ---------------- |
| `grid_spacing`      | Percentage spacing between grid levels                    | 0.01-1.0 (1%-100%) |
| `position_size`     | Amount of tokens to trade at each grid level             | ≥ 1,000,000      |
| `num_grid_levels`   | Total number of buy + sell orders in the grid            | 2-50             |
| `center_price`      | Center price for grid (null = auto-detect from market)   | Optional Float   |
| `auto_rebalance`    | Automatically reposition grid on significant price moves | true/false       |
| `max_slippage`      | Maximum acceptable slippage per trade                     | 0.0-0.5 (0%-50%) |
| `check_interval_sec`| How often to check for order execution opportunities     | ≥ 60 seconds     |

---

### 📊 Grid Strategy Example

With `grid_spacing = 0.02` (2%) and `num_grid_levels = 10`:

```
Sell Orders (above center):
🔴 $106.00 ← +6%
🔴 $104.00 ← +4%  
🔴 $102.00 ← +2%

Center: $100.00

🟢 $98.00  ← -2%
🟢 $96.00  ← -4%
🟢 $94.00  ← -6%
Buy Orders (below center)
```

---

### 🧠 Use Cases

* **Range-bound Markets**: Profits from sideways price action
* **Volatility Harvesting**: Captures gains from price oscillations
* **Dollar-Cost Averaging**: Systematic accumulation during price swings
* **Market Making**: Provides liquidity while earning spread profits
* **Automated Trading**: Hands-off trading in established price ranges

---

### 💡 Strategy Notes

* **Works best in ranging markets** with regular price oscillations
* **Underperforms in strong trends** where price moves in one direction
* **Auto-rebalancing helps adapt** to changing market conditions
* **Risk increases with wider grid spacing** but potential profits also increase
* **Requires sufficient balance** in both tokens to execute all grid orders

---

### 📈 Performance Tracking

The module tracks:
- Total profit generated from grid trades
- Number of orders executed
- Current grid configuration and status
- Individual grid level fill status and timing
- Error conditions and execution failures

---

### ⚠️ Risk Considerations

* **Impermanent Loss**: Token ratios change as grid executes
* **Trend Risk**: Strong directional moves can exhaust one side of the grid
* **Slippage Risk**: Market impact on larger position sizes
* **Timing Risk**: Grid may miss optimal entry/exit points
* **Liquidity Risk**: Insufficient DEX liquidity for order execution