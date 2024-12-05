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
            tokenA : Nat;
            tokenB : Nat;
            last_run : Nat64;
            last_error : ?Text;
        };
    };

    public type Range = {
        #full;
        #partial : { from_price : Float; to_price : Float };
    };
    
    public type Flow = {
        #hold; // Hold at source
        #add; // Add from source
        #remove; // Remove from source
        #pass_through; // Pass from source to destination
    };
}