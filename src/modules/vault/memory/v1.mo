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
            var description : Text;
        };
        internals : {
            // No internal fields needed
        };
    };
} 