### 🧠 Auto Liquidity Module (Overview)

This module **automatically rebalances liquidity** in a DEX pool without swapping tokens — it only **adds/removes liquidity** within a calculated price range, ensuring you're always near market action.

---

### ⚙️ How It Works

1. **At each interval** (min 10 mins), the module:

   * Fetches the current price.
   * **Removes all liquidity** from the pool back to your *source accounts* (token A and B).
   * Optionally sends a % (`remove_percent`) of this to *destination accounts*.
   * Calculates a **new price range**:
     `range = current_price ± sqrt(1 + range_percent/100)`
   * Re-adds liquidity **without swapping**:

     * Token A is added **below** the current price.
     * Token B is added **above** the current price.
     * Only added if balance > 100× swap fee.

2. **No tokens are bought or sold**. It just resets your liquidity position closer to the current price.

---

### 🛠️ Configurable

* `range_percent`: How wide the new range is.
* `interval_seconds`: How often to rebalance.
* `remove_percent`: % of removed liquidity sent to destination.
* `mode`: `#auto` (rebalance) or `#remove` (withdraw only).

---

Use it to keep your LP active and efficient — without market risk or manual rebalancing.
