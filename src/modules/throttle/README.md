
### ⏱️ Throttle Module

The **Throttle** module periodically sends a fixed or randomized amount of tokens from a source to a destination — at a **rate you control**.

---

### ⚙️ How It Works

1. You define:

   * A **send interval** (`interval_sec`) — fixed or random.
   * A **max send amount** per interval (`max_amount`) — fixed or random.

2. On each run:

   * If enough time has passed (`now > wait_until_ts`) **and** source balance ≥ `fee × 100`, it proceeds.
   * Calculates how much to send:
     `amount = min(balance, max_amount)`
   * Sends the tokens to **port 0's destination**.
   * Schedules the next send by updating `wait_until_ts`.

3. If the amount would leave “dust” (less than `fee × 100`), it sends the full balance instead.

---

### 🔢 Parameters

| Parameter      | Description                                              |
| -------------- | -------------------------------------------------------- |
| `interval_sec` | Time between sends (min 60s) — fixed or randomized range |
| `max_amount`   | Max amount to send each time — fixed or randomized range |

---

### 🧠 Use Cases

* Rate-limited token streams
* Drip transfers to other modules or wallets
* Payment throttling for contracts or DAOs

---

### 💡 Behavior Notes

* Will **not send** if too little balance is available.
* Random mode adds unpredictability to timing and amount.
