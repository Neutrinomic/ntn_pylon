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
            var last_error : ?Text;
        };
    };

    public type Flow = {
        #hold; // Hold at source
        #add; // Add from source
        #remove; // Remove from source
        #pass_through; // Pass from source to destination
    };

    public type Range = {
        #full;
        #partial : { from_price : Float; to_price : Float };
    };
 
}