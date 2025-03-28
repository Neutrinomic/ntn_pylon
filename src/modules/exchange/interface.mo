module {
    
    public type CreateRequest = {
        init : {

        };
        variables : {
            max_impact : Float;
            buy_for_amount : Nat;
            buy_interval_seconds : Nat64;  // Interval in seconds
            max_rate : ?Float;  // Maximum rate at which to swap (e.g., ICP/NTN), null means no limit
        };
    };

    public type ModifyRequest = {
        max_impact : Float;
        buy_for_amount : Nat;
        buy_interval_seconds : Nat64;
        max_rate : ?Float;
    };

    public type Shared = {
        init : {

        };
        variables : {
            max_impact : Float;
            buy_for_amount : Nat;
            buy_interval_seconds : Nat64;
            max_rate : ?Float;
        };
        internals : {
            swap_fee_e4s : Nat;
            price : ?Float;
            last_run : Nat64;
            last_error : ?Text;
            last_buy : Nat64;
            next_buy : Nat64;  // Calculated next buy time for UI
            current_rate : ?Float;  // Current exchange rate for UI display
        };
    };
}