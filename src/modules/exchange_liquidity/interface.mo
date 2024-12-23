module {
    

    public type CreateRequest = {
        init : {

        };
        variables : {
            flow : Flow;
            range : Range;
        };
    };

    public type ModifyRequest = {
        flow : Flow;
        range: Range;
    };

    public type Shared = {
        init : {

        };
        variables : {
            range : Range;
            flow : Flow;
        };
        internals : {
            addedTokenA : Nat;
            addedTokenB : Nat;
            tokenA : Nat;
            tokenB : Nat;
            last_run : Nat64;
            last_error : ?Text;
        };
    };

    public type Range = {
        #partial : { from_price : Float; to_price : Float };
    };
    
    public type Flow = {
        #add;
        #remove;
    };
}