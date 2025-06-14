module {

    public type CreateRequest = {
        init : {
        };
        variables : {
            amount : NumVariant;
            switch_chance : Nat64; // 0-1000 percentage chance to switch
            switch_interval : NumVariant; // Time in seconds before considering a switch
            throttle_interval : NumVariant; // Time in seconds between sends
        };
    };

    public type ModifyRequest = {
        amount : NumVariant;
        switch_chance : Nat64;
        switch_interval : NumVariant;
        throttle_interval : NumVariant;
    };

    public type Shared = {
        init : {
        };
        variables : {
            amount : NumVariant;
            switch_chance : Nat64;
            switch_interval : NumVariant;
            throttle_interval : NumVariant;
        };
        internals : {
            next_switch_ts : Nat64;
            next_send_ts : Nat64;
            current_source : Nat; // 0 or 1
        };
    };

    public type NumVariant = {
        #fixed : Nat64;
        #rnd : { min : Nat64; max : Nat64 };
    };

} 