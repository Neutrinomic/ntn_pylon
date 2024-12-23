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
            var range : Range;
            var flow : Flow;
        };
        internals : {
            var empty: Bool;
            var last_run: Nat64;
            var total_added : {
                tokenA: Nat;
                tokenB: Nat;
            };
            var last_inputs : {
                tokenA: Nat;
                tokenB: Nat;
            };
            var last_error : ?Text;
        };
    };

    public type Flow = {
        #add; // Add from source
        #remove; // Remove from source
    };

    public type Range = {
        #partial : { from_price : Float; to_price : Float };
    };
 
}