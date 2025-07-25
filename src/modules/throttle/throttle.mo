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

    public let ID = "throttle";

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
                name = "Throttle";
                author = "Neutrinite";
                description = "Send X tokens every Y seconds..";
                supported_ledgers = [];
                version = #alpha([0, 0, 1]);
                create_allowed = true;
                ledger_slots = [
                    "Throttle"
                ];
                billing = Billing.get();
                sources = sources(0);
                destinations = destinations(0);
                author_account = Billing.authorAccount();
                temporary_allowed = true;
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
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, th:M.NodeMem) : () {
                let ?source = core.getSource(vid, vec, 0) else return;
                
                let bal = core.Source.balance(source);
                let fee = core.Source.fee(source);

                let now = U.now();
                if (bal < fee * 100) return;

                if (now > th.internals.wait_until_ts) {
                    switch (th.variables.interval_sec) {
                        case (#fixed(fixed)) {
                            th.internals.wait_until_ts := now + fixed * 1_000_000_000;
                        };
                        case (#rnd({ min; max })) {
                            let dur : Nat64 = if (min >= max) 0 else rng.next() % (max - min);
                            th.internals.wait_until_ts := now + (min + dur) * 1_000_000_000;
                        };
                    };

                    let max_amount : Nat64 = switch (th.variables.max_amount) {
                        case (#fixed(fixed)) fixed;
                        case (#rnd({ min; max })) if (min >= max) 0 else min + rng.next() % (max - min);
                    };

                    var amount = Nat.min(bal, Nat64.toNat(max_amount));
                    if (bal - amount : Nat <= fee * 100) amount := bal; // Don't leave dust

                    let #ok(intent) = core.Source.Send.intent(source, #destination({ port = 0 }), amount, null) else return;
                    ignore core.Source.Send.commit(intent);
                };
            };
        };

        private func validate_min_amount(x:I.NumVariant, req_min:Nat64) : Bool {
            switch (x) {
                case (#fixed(fixed)) fixed > req_min;
                case (#rnd({ min; max })) if (min >= max) false else min > req_min;
            };
        };

        public func create(id : T.NodeId, _req:T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            if (not validate_min_amount(t.variables.interval_sec, 60)) return #err("Min interval_sec must be 60 sec");

            let obj : M.NodeMem = {
                init = t.init;
                variables = {
                    var interval_sec = t.variables.interval_sec;
                    var max_amount = t.variables.max_amount;
                };
                internals = {
                    var wait_until_ts = 0;
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
            if (not validate_min_amount(m.interval_sec, 60)) return #err("Min interval_sec must be 60 sec");

            t.variables.interval_sec := m.interval_sec;
            t.variables.max_amount := m.max_amount;
            t.internals.wait_until_ts := 0;

            #ok();
        };

        public func get(id : T.NodeId, _vec: T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            #ok {
                init = t.init;
                variables = {
                    interval_sec = t.variables.interval_sec;
                    max_amount = t.variables.max_amount;
                };
                internals = {
                    wait_until_ts = t.internals.wait_until_ts;
                };
            };
        };

        public func defaults() : I.CreateRequest {
            {
                init = {};
                variables = {
                    interval_sec = #fixed(10);
                    max_amount = #fixed(100_0000);
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, "")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(0, "")];
        };

    };

};
