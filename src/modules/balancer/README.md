### 🔄 Balancer Module

This module **automatically maintains a specific value ratio between two tokens** based on your configured parameters. It periodically checks the ratio and rebalances when needed.

---

### ⚙️ How It Works

1. At every `rebalance_interval_seconds`:

   * Calculates the **USD value** of both tokens using price data.
   * Computes the **current value ratio** between tokens.
   * Compares with the **target ratio** (specified by `token_ratios`).
   * If the deviation exceeds `threshold_percent`, initiates a swap.
   * Determines which token is overweight and sells a portion worth `swap_amount_usd`.
   * Verifies the swap won't create excessive slippage before executing.

2. At every `remove_interval_seconds`:

   * Calculates how many tokens to remove based on `remove_amount_usd`.
   * Removes tokens proportionally according to the target ratio.
   * Sends Token A to destination 0 and Token B to destination 1.

---

### 🛠️ Configurable

| Parameter                   | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| `token_ratios`              | Target ratio between tokens (e.g., [7, 3] for 70%/30%).  |
| `threshold_percent`         | How far ratio can deviate before rebalancing (min 1%).   |
| `swap_amount_usd`           | USD value to swap in each rebalance ($10-$30).           |
| `rebalance_interval_seconds`| How often to check for rebalancing (min 20 seconds).     |
| `remove_interval_seconds`   | How often to remove tokens (min 30 seconds).             |
| `remove_amount_usd`         | USD value of tokens to remove each cycle.                |
| `price_ledger_id`           | Principal ID of the token used for price reference.      |

---

### 🧾 Key Notes

* **Handles zero balances** by automatically rebalancing when one token is missing.
* **Skips rebalancing** when deviation is within threshold or total value is too small.
* **Proportional removal** ensures tokens are withdrawn according to target ratio.
* Designed for **automated portfolio management** and maintaining specific asset allocations.
