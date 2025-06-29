import Map "mo:map/Map";
import Nat32 "mo:base/Nat32";
import Float "mo:base/Float";
import Core "mo:devefi/core";
import I "../interface";
import MU "mo:mosup";

module {
    public type NodeMem = {
        init : {};
        variables : {
            var range_percent : Float;
            var interval_seconds : Nat64;
            var remove_percent : Float;
            var mode : I.Mode;
        };
        internals : {
            var empty : Bool;
            var last_run : Nat64;
            var last_rebalance : Nat64;
            var total_added : {
                tokenA : Nat;
                tokenB : Nat;
            };
            var last_inputs : {
                tokenA : Nat;
                tokenB : Nat;
            };
            var last_error : ?Text;
        };
    };

    public type Mem = {
        main : Map.Map<Nat32, NodeMem>;
    };

    public func empty() : Mem {
        {
            main = Map.new<Nat32, NodeMem>();
        };
    };

    public func new() : MU.MemShell<Mem> = MU.new<Mem>(
        {
            main = Map.new<Nat32, NodeMem>();
        }
    );
} 