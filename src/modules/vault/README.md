
### 🏦 Vault Module

The **Vault** module passively **holds tokens** in a designated account. It does **not perform any actions**, making it ideal for storing funds securely within the system.

---

### ⚙️ How It Works

* **No operations run during `run()`** — it is a passive module.
* Tokens are sent **into the Vault's source account** (slot 0) by other modules or manual transfers.
* The module never forwards, splits, or uses the tokens in any way.

---

### 🧾 Parameters

| Parameter     | Description                                       |
| ------------- | ------------------------------------------------- |
| `description` | Optional text label for the vault (max 255 chars) |

---

### 🔄 Sources & Destinations

* **Source slot 0** is used to **receive tokens**.
* **No destinations** — tokens stay in the vault until manually moved by an external process.

---

### 🧠 Use Cases

* Cold storage or escrow inside a larger system.
* Holding collateral, protocol-owned liquidity, or staged funds.
* Bookmarking or labeling token balances with metadata (via `description`).

