# Auto Liquidity Module

This module automatically rebalances liquidity in a pool based on current price and a specified range percentage.

## Features

- **Automatic Rebalancing**: Periodically removes liquidity and adds it back within a specified price range around the current price.
- **Configurable Interval**: Set how often rebalancing should occur (minimum 10 minutes).
- **Partial Removal**: Option to send a percentage of removed liquidity to destination accounts.
- **Multiple Modes**: Auto mode for rebalancing or Remove mode for just removing liquidity.

## Parameters

- **Range Percent**: The percentage range around the current price (e.g., 5% means from current price -5% to +5%).
- **Interval Seconds**: How often to rebalance (minimum 600 seconds = 10 minutes).
- **Remove Percent**: Percentage of removed liquidity to send to destination accounts (0-100%).
- **Mode**: Auto (rebalance) or Remove (just remove liquidity).

## How It Works

1. When the rebalancing interval is reached, the module:
   - Gets the current price from the pool
   - Removes all liquidity from the pool to the source accounts
   - If remove_percent > 0, transfers that percentage to destination accounts
   - Calculates a new price range based on current price ± range_percent
   - Adds liquidity back to the pool within that price range
   - Adds tokens one by one (first token A, then token B)

2. If a token balance is below 100x the swap fee, it won't be added.

3. In Remove mode, the module simply removes all liquidity to the source accounts.

## Usage

Configure the module with appropriate parameters for your use case:
- For frequent rebalancing with small ranges: lower interval, smaller range_percent
- For less frequent rebalancing with wider ranges: higher interval, larger range_percent
- To keep some profits: set remove_percent > 0
- To just remove all liquidity: set mode to #remove 