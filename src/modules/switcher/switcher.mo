import U "mo:devefi/utils";
import Billing "../../billing_all";
import MU "mo:mosup";
import Ver1 "./memory/v1";
import Map "mo:map/Map";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Prng "mo:prng";
import Core "mo:devefi/core";
import I "./interface";
module {
    let T = Core.VectorModule;
    public let Interface = I;

    public module Mem {
        public module Vector {
            public let V1 = Ver1;
        };
    };
    let M = Mem.Vector.V1;

    public let ID = "switcher";

    public class Mod({
        xmem : MU.MemShell<M.Mem>;
        core : Core.Mod;
    }) : T.Class<I.CreateRequest, I.ModifyRequest, I.Shared> {

        let rng = Prng.SFC64a();
        rng.init(123456);

        let mem = MU.access(xmem);

        public func meta() : T.Meta {
            {
                id = ID; // This has to be same as the variant in vec.custom
                name = "Switcher";
                author = "Neutrinite";
                description = "Switch between two sources and destinations with throttling";
                supported_ledgers = [];
                version = #alpha([0, 0, 1]);
                create_allowed = true;
                ledger_slots = [
                    "Switcher"
                ];
                billing = Billing.get();
                sources = sources(0);
                destinations = destinations(0);
                author_account = Billing.authorAccount();
                temporary_allowed = false;
            };
        };

        public func run() : () {
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;
                Run.single(vid, vec, parm);
            };
        };

        module Run {
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, sw : M.NodeMem) : () {
                // Get current source and destination based on current_source
                let source_idx = sw.internals.current_source;
                let ?source = core.getSource(vid, vec, source_idx) else return;
                
                let bal = core.Source.balance(source);
                let fee = core.Source.fee(source);

                let now = U.now();
                


                // Check if it's time to consider switching
                if (now > sw.internals.next_switch_ts) {
                    // Update next switch time
                    switch (sw.variables.switch_interval) {
                        case (#fixed(fixed)) {
                            sw.internals.next_switch_ts := now + fixed * 1_000_000_000;
                        };
                        case (#rnd({ min; max })) {
                            let dur : Nat64 = if (min >= max) 0 else min + rng.next() % (max - min);
                            sw.internals.next_switch_ts := now + dur * 1_000_000_000;
                        };
                    };

                    // Determine if we should switch based on chance (0-1000)
                    let roll = rng.next() % 1000;
                    if (roll < sw.variables.switch_chance) {
                        // Switch to the other source/destination pair
                        sw.internals.current_source := if (sw.internals.current_source == 0) 1 else 0;
                    };
                };

                // Check if it's time to send tokens (throttling)
                if (now > sw.internals.next_send_ts) {
                    // Update next send time
                    switch (sw.variables.throttle_interval) {
                        case (#fixed(fixed)) {
                            sw.internals.next_send_ts := now + fixed * 1_000_000_000;
                        };
                        case (#rnd({ min; max })) {
                            let dur : Nat64 = if (min >= max) 0 else min + rng.next() % (max - min);
                            sw.internals.next_send_ts := now + dur * 1_000_000_000;
                        };
                    };

                    // Calculate amount to send
                    let amount_to_send : Nat64 = switch (sw.variables.amount) {
                        case (#fixed(fixed)) fixed;
                        case (#rnd({ min; max })) if (min >= max) 0 else min + rng.next() % (max - min);
                    };

                    // If current source has insufficient balance, switch to the other source
                    if (bal < fee * 100) {
                        sw.internals.current_source := if (sw.internals.current_source == 0) 1 else 0;
                        return; // Return and try again next time with the new source
                    };
                    
                    var amount = Nat.min(bal, Nat64.toNat(amount_to_send));
                    if (bal - amount : Nat <= fee * 100) amount := bal; // Don't leave dust

                    // Send to the corresponding destination
                    let #ok(intent) = core.Source.Send.intent(source, #destination({ port = source_idx }), amount) else return;
                    ignore core.Source.Send.commit(intent);
                };
            };
        };

        private func validate_min_amount(x : I.NumVariant, req_min : Nat64) : Bool {
            switch (x) {
                case (#fixed(fixed)) fixed > req_min;
                case (#rnd({ min; max })) if (min >= max) false else min > req_min;
            };
        };

        public func create(id : T.NodeId, req : T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            if (not validate_min_amount(t.variables.switch_interval, 60)) return #err("Min switch_interval must be 60 sec");
            if (not validate_min_amount(t.variables.throttle_interval, 20)) return #err("Min throttle_interval must be 20 sec");
            if (t.variables.switch_chance <= 1000) return #err("switch_chance must be between 0 and 1000");

            let obj : M.NodeMem = {
                init = t.init;
                variables = {
                    var amount = t.variables.amount;
                    var switch_chance = t.variables.switch_chance;
                    var switch_interval = t.variables.switch_interval;
                    var throttle_interval = t.variables.throttle_interval;
                };
                internals = {
                    var next_switch_ts = 0;
                    var next_send_ts = 0;
                    var current_source = 0;
                };
            };
            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func delete(id : T.NodeId) : T.Delete {
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");
            if (not validate_min_amount(m.switch_interval, 60)) return #err("Min switch_interval must be 60 sec");
            if (not validate_min_amount(m.throttle_interval, 20)) return #err("Min throttle_interval must be 20 sec");
            if (m.switch_chance <= 1000) return #err("switch_chance must be between 0 and 1000");

            t.variables.amount := m.amount;
            t.variables.switch_chance := m.switch_chance;
            t.variables.switch_interval := m.switch_interval;
            t.variables.throttle_interval := m.throttle_interval;
            t.internals.next_switch_ts := 0;
            t.internals.next_send_ts := 0;

            #ok();
        };

        public func get(id : T.NodeId, vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            #ok {
                init = t.init;
                variables = {
                    amount = t.variables.amount;
                    switch_chance = t.variables.switch_chance;
                    switch_interval = t.variables.switch_interval;
                    throttle_interval = t.variables.throttle_interval;
                };
                internals = {
                    next_switch_ts = t.internals.next_switch_ts;
                    next_send_ts = t.internals.next_send_ts;
                    current_source = t.internals.current_source;
                };
            };
        };

        public func defaults() : I.CreateRequest {
            {
                init = {};
                variables = {
                    amount = #fixed(100_0000);
                    switch_chance = 500; // 50% chance (out of 1000)
                    switch_interval = #fixed(3600); // 1 hour
                    throttle_interval = #fixed(600); // 10 minutes
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, ""), (1, "")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(0, ""), (1, "")];
        };
    };
}; 