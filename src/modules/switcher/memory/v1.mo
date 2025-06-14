import Map "mo:map/Map";
import MU "mo:mosup";

module {
    public type Mem = {
        main : Map.Map<Nat32, NodeMem>;
    };
    public func new() : MU.MemShell<Mem> = MU.new<Mem>(
        {
            main = Map.new<Nat32, NodeMem>();
        }
    );

    // Internal vector state
    public type NodeMem = {
        init : {
        };
        variables : {
            var amount : NumVariant;
            var switch_chance : Nat64;
            var switch_interval : NumVariant;
            var throttle_interval : NumVariant;
        };
        internals : {
            var next_switch_ts : Nat64;
            var next_send_ts : Nat64;
            var current_source : Nat; // 0 or 1
        };
    };

    // Other custom types
    public type NumVariant = {
        #fixed : Nat64;
        #rnd : { min : Nat64; max : Nat64 };
    };
} 