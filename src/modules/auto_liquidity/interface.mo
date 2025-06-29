import Core "mo:devefi/core";
import Float "mo:base/Float";

module {
    public type Range = {
        #partial : {
            from_price : Float;
            to_price : Float;
        };
    };

    public type Mode = {
        #auto; // Automatically rebalance liquidity
        #remove; // Just remove all liquidity
    };

    public type CreateRequest = {
        init : {};
        variables : {
            range_percent : Float;
            interval_seconds : Nat64;
            remove_percent : Float;
            mode : Mode;
        };
    };

    public type ModifyRequest = {
        range_percent : Float;
        interval_seconds : Nat64;
        remove_percent : Float;
        mode : Mode;
    };

    public type Shared = {
        init : {};
        variables : {
            range_percent : Float;
            interval_seconds : Nat64;
            remove_percent : Float;
            mode : Mode;
        };
        internals : {
            current_price : ?Float;
            last_rebalance : Nat64;
            next_rebalance : Nat64;
            tokenA : Nat;
            tokenB : Nat;
            addedTokenA : Nat;
            addedTokenB : Nat;
            last_run : Nat64;
            last_error : ?Text;
        };
    };
} 