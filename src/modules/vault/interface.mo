module {

    public type CreateRequest = {
        init : {
        };
        variables : {
            description : Text;
        };
    };

    public type ModifyRequest = {
        description : Text;
    };

    public type Shared = {
        init : {
        };
        variables : {
            description : Text;
        };
        internals : {
            // No internal fields needed
        };
    };

} 