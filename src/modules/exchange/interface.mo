module {
    
    public type CreateRequest = {
        init : {

        };
        variables : {
            max_slippage : Float;
        };
    };

    public type ModifyRequest = {
        max_slippage : Float;
    };

    public type Shared = {
        init : {

        };
        variables : {
            max_slippage : Float;
        };
        internals : {
            swap_fee_e4s : Nat;
            price : ?Float;
        };
    };
}