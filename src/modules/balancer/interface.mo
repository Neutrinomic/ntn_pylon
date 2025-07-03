import Core "mo:devefi/core";
import Principal "mo:base/Principal";

module {
    public type CreateRequest = {
        init : {
        };
        variables : {
            token_ratios : [Nat]; // The ratio of tokens to maintain (e.g., [8, 2] for 80%/20%)
            threshold_percent : Float; // Threshold percentage for rebalancing (default 3%, min 1%)
            swap_amount_usd : Nat; // Amount in USD to swap at a time (default 10, min 10, max 30)
            rebalance_interval_seconds : Nat64; // Interval between rebalance checks (min 20 sec)
            remove_interval_seconds : Nat64; // Interval between removal checks (min 30 sec)
            remove_amount_usd : Nat; // Amount in USD to remove when requested
            price_ledger_id : Principal; // Principal of the token used for price quotes (default USDT)
        };
    };

    public type ModifyRequest = {
        token_ratios : [Nat]; // The ratio of tokens to maintain
        threshold_percent : Float; // Threshold percentage for rebalancing
        swap_amount_usd : Nat; // Amount in USD to swap at a time
        rebalance_interval_seconds : Nat64; // Interval between rebalance checks
        remove_interval_seconds : Nat64; // Interval between removal checks
        remove_amount_usd : Nat; // Amount in USD to remove when requested
        price_ledger_id : Principal; // Principal of the token used for price quotes
    };

    public type Shared = {
        init : {
        };
        variables : {
            token_ratios : [Nat]; // The ratio of tokens to maintain
            threshold_percent : Float; // Threshold percentage for rebalancing
            swap_amount_usd : Nat; // Amount in USD to swap at a time
            rebalance_interval_seconds : Nat64; // Interval between rebalance checks
            remove_interval_seconds : Nat64; // Interval between removal checks
            remove_amount_usd : Nat; // Amount in USD to remove when requested
            price_ledger_id : Principal; // Principal of the token used for price quotes
        };
        internals : {
            last_run : Nat64;
            last_rebalance : Nat64;
            last_remove : Nat64;
            total_value_usd : Float; // Total USD value of all tokens
            current_ratios : [Float]; // Current value ratios of tokens
            last_error : ?Text;
        };
    };
}; 