module {
    
    public type CreateRequest = {
        init : {

        };
        variables : {
            max_slippage_e6s : Nat;
        };
    };

    public type ModifyRequest = {
        max_slippage_e6s : Nat;
    };

    public type Shared = {
        init : {

        };
        variables : {
            max_slippage_e6s : Nat;
        };
        internals : {
            swap_fee_e4s : Nat;
            price_e16s : ?Nat;
        };
    };
}