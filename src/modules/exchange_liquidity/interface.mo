module {
    


    public type CreateRequest = {
        init : {

        };
        variables : {
            flow : Flow;
        };
    };

    public type ModifyRequest = {
        flow : Flow;
    };

    public type Shared = {
        init : {

        };
        variables : {
            flow : Flow;
        };
        internals : {
            balance : Nat;
            total : Nat;
        };
    };

    public type Flow = {
        #hold; // Hold at source
        #add; // Add from source
        #remove; // Remove from source
        #pass_through; // Pass from source to destination
    };
}