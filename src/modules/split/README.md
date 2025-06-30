
### 🍰 Split Module

The **Split** module distributes tokens from one source across up to **10 destination ports**, using a custom **weighting scheme**. It ensures the entire balance is sent, split by your defined ratios.

---

### ⚙️ How It Works

1. You define a `split` array like `[40, 30, 30]` which maps to destination ports 0, 1, 2.

   * These are **relative weights**, not percentages.
   * The module checks which destination ports exist and calculates their **share of the total balance**.

2. On each run:

   * It checks the source balance and fee requirements.
   * Sends tokens to each active destination **in proportion to its weight**.
   * The **last (largest) destination** gets the **remaining balance** to avoid rounding loss.

3. Skips destinations if:

   * The port isn’t registered.
   * The amount is too small (less than 100× the transfer fee).

---

### 🔢 Parameters

| Parameter | Description                                            |
| --------- | ------------------------------------------------------ |
| `split`   | List of weights (up to 10) — one per destination port. |

---

### 🛠️ Behavior

* **Atomic logic**: All funds are split and sent in one pass.
* **Fee-aware**: Ignores trivial transfers that wouldn't cover fees.
* **Smart final allocation**: Rounding errors are absorbed by the largest destination.
