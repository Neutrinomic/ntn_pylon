### 🔄 Exchange Module (Auto Swapper)

This module **automatically swaps one token for another** on a DEX (e.g., ICP → NTN) based on your configured limits and timing. It runs periodically and executes a swap **only if conditions are met**
---

### ⚙️ How It Works

1. At every `buy_interval_seconds`:

   * Checks if the source account has at least `buy_for_amount` tokens to sell.
   * Looks up the **current pool price**.
   * If a `max_rate` is set, ensures the current rate is **not too expensive**.
   * Quotes the swap to preview slippage.
   * Computes **price impact**:
     `impact = (expected - actual received) / expected`
   * If impact ≤ `max_impact`, the swap is committed.

2. Funds are taken from the **source account** (`"From"`) and sent to the **destination account** (`"To"`), using the DEX.

---

### 🛠️ Configurable

| Parameter              | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `buy_for_amount`       | How much of the source token to spend on each swap. |
| `buy_interval_seconds` | How often to run (e.g., 60 = every 60 seconds).     |
| `max_impact`           | Maximum acceptable slippage (e.g., 0.02 = 2%).      |
| `max_rate`             | Optional: don't buy if price exceeds this.          |

---

### 🧾 Key Notes

* **Only executes if enough time and funds are available.**
* **Skips swaps** if rate is too high or slippage too large.
* Designed for **automated DCA (dollar-cost averaging)** or scheduled token conversion.
