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

    public type NodeMem = {
        init : {

        };
        variables : {
            var max_impact : Float;
            var buy_for_amount : Nat;
            var buy_interval_seconds : Nat64;  // Interval in seconds
            var max_rate : ?Float;  // Maximum rate at which to swap (e.g., ICP/NTN), null means no limit
        };
        internals : {
            var last_run: Nat64;
            var last_error: ?Text;
            var last_buy: Nat64;  // Timestamp of the last buy
        };
    };

 
}