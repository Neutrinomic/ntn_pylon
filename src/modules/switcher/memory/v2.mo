import Map "mo:map/Map";
import MU "mo:mosup";
import V1 "./v1";
import Iter "mo:base/Iter";

module {
    public type Mem = {
        main : Map.Map<Nat32, NodeMem>;
    };
    public func new() : MU.MemShell<Mem> = MU.new<Mem>({
        main = Map.new<Nat32, NodeMem>();
    });

    public func upgrade(from : MU.MemShell<V1.Mem>) : MU.MemShell<Mem> {
        MU.upgrade(
            from,
            func(a : V1.Mem) : Mem {
                {
                    main = Map.fromIter<Nat32, NodeMem>(
                        Iter.map<(Nat32, V1.NodeMem), (Nat32, NodeMem)>(
                            Map.entries(a.main),
                            func(e : (Nat32, V1.NodeMem)) : (Nat32, NodeMem) = (e.0, upgrade_nodemem(e.1)),
                        ),
                        Map.n32hash,
                    );
                };
            },
        );
    };

    private func upgrade_nodemem(from : V1.NodeMem) : NodeMem {
        {
            init = {};
            variables = {
                var amount_a = from.variables.amount;
                var amount_b = from.variables.amount;
                var switch_chance = from.variables.switch_chance;
                var switch_interval = from.variables.switch_interval;
                var throttle_interval = from.variables.throttle_interval;
            };
            internals = {
                var next_switch_ts = from.internals.next_switch_ts;
                var next_send_ts = from.internals.next_send_ts;
                var current_source = from.internals.current_source;
            };
        };
    };

    // Internal vector state
    public type NodeMem = {
        init : {};
        variables : {
            var amount_a : NumVariant;
            var amount_b : NumVariant;
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
};
