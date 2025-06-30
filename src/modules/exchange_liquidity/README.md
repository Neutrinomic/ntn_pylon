
### 🧊 Exchange Liquidity Module

This module **adds or removes liquidity** to/from a DEX pool — within a **user-defined price range** — without performing swaps. You choose whether to *add* liquidity from source accounts or *remove* it back to destination accounts.

---

### ⚙️ How It Works

1. You configure:

   * A **price range** (`from_price` to `to_price`, in real units).
   * A **flow mode**: `#add` or `#remove`.

2. On each run:

   * If mode is `#add`:

     * Checks if token A or B balances in the **source accounts** changed.
     * Converts the user’s price range into **DEX-native raw prices**.
     * Adds liquidity **only if the full required token pair is available**:

       * If the range **includes both tokens**, **both must be funded**, or nothing is added.
     * Tracks how much liquidity was added.
   * If mode is `#remove`:

     * Removes all liquidity from the pool to **destination accounts**.
     * Resets internal tracking and marks the pool as emptied.

3. **No swaps occur** — this is pure liquidity position management.

---

### 🔢 Parameters

| Parameter | Description                               |
| --------- | ----------------------------------------- |
| `flow`    | `#add` or `#remove` – action to perform   |
| `range`   | Target price band for liquidity provision |

---

### 🔄 Sources & Destinations

* **Source accounts**: Supply tokens for liquidity in `#add` mode.
* **Destination accounts**: Receive tokens when liquidity is removed.

---

### 🧠 Use Cases

* Use `#add` to **position liquidity** in anticipated price ranges.
* Use `#remove` to **fully exit liquidity positions**.
* Range pricing stays **human-friendly** using automatic unit conversion.
* Ensures **atomic liquidity logic**: either both tokens are added, or none.
