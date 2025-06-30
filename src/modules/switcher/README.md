
### 🔁 Switcher Module

The **Switcher** module sends tokens from one of two sources to their respective destinations, **switching between them randomly over time** and throttling how often tokens are sent.

---

### ⚙️ How It Works

1. You define:

   * **Two source–destination pairs**: slot A and B.
   * **Send amount** for each (`amount_a` and `amount_b`).
   * **Throttle interval** (how often to send).
   * **Switch interval** and **switch chance** (how often and how likely it is to switch between A and B).

2. On each run:

   * If `now > next_switch_ts`, roll a 0–999 dice. If it's below `switch_chance`, **switch** the active source (A ↔ B).
   * If `now > next_send_ts`, send up to the configured amount (or less if balance is low) from the **current source** to its paired destination.
   * If the source has too little balance (e.g. < 100× fee), it **automatically switches** to the other one.

3. Supports both **fixed values** and **randomized ranges** for intervals and amounts.

---

### 🔢 Parameters

| Parameter              | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `amount_a`, `amount_b` | Amount to send from source A or B                   |
| `switch_interval`      | How often to consider switching (fixed or range)    |
| `switch_chance`        | Probability (0–1000) to switch during each interval |
| `throttle_interval`    | How often to send from the current source           |

---

### 🔄 Sources & Destinations

* Slot 0 and 1 define:

  * Source A → Destination A
  * Source B → Destination B
* Only one path is active at a time, switching is automatic.

