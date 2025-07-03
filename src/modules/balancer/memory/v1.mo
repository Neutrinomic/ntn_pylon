import Map "mo:map/Map";
import Core "mo:devefi/core";
import MU "mo:mosup";
import Principal "mo:base/Principal";

module {
    public type NodeMem = {
        init : {
        };
        variables : {
            var token_ratios : [Nat]; // The ratio of tokens to maintain
            var threshold_percent : Float; // Threshold percentage for rebalancing
            var swap_amount_usd : Nat; // Amount in USD to swap at a time
            var rebalance_interval_seconds : Nat64; // Interval between rebalance checks
            var remove_interval_seconds : Nat64; // Interval between removal checks
            var remove_amount_usd : Nat; // Amount in USD to remove when requested
            var price_ledger_id : Principal; // Principal of the token used for price quotes
        };
        internals : {
            var last_run : Nat64;
            var last_rebalance : Nat64;
            var last_remove : Nat64;
            var last_error : ?Text;
            var total_value_usd : Float; // Total USD value of all tokens
            var current_ratios : [Float]; // Current value ratios of tokens
        };
    };

    public type Mem = {
        main : Map.Map<Core.NodeId, NodeMem>;
    };

    public func new() : MU.MemShell<Mem> = MU.new<Mem>(
            {
                main = Map.new<Core.NodeId, NodeMem>();
            }
        );
}; 