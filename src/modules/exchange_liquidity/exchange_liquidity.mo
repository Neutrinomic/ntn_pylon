import Billing "../../billing_all";
import MU "mo:mosup";
import Ver1 "./memory/v1";
import Map "mo:map/Map";
import Core "mo:devefi/core";
import I "./interface";
import U "mo:devefi/utils";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import IT "mo:itertools/Iter";
import Nat32 "mo:base/Nat32";
import Nat "mo:base/Nat";
import Vector "mo:vector";
import Swap "mo:devefi_swap";
import Debug "mo:base/Debug";

module {
    let T = Core.VectorModule;
    public let Interface = I;
    type R<A,B> = Result.Result<A,B>;

    public module Mem {
        public module Vector {
            public let V1 = Ver1;
        };
    };
    let VM = Mem.Vector.V1;


    public let ID = "exchange_liquidity";


    public class Mod({
        xmem : MU.MemShell<VM.Mem>;
        core : Core.Mod;
        swap : Swap.Mod;
    }) : T.Class<I.CreateRequest, I.ModifyRequest, I.Shared> {

        let mem = MU.access(xmem);

        public func meta() : T.Meta {
            {
                id = ID; // This has to be same as the variant in vec.custom
                name = "Exchange";
                author = "Neutrinite";
                description = "Exchange X tokens for Y";
                supported_ledgers = [];
                version = #alpha([0, 0, 1]);
                create_allowed = true;
                ledger_slots = [
                    "TokenA",
                    "TokenB",
                ];
                billing = Billing.get();
                sources = sources(0);
                destinations = destinations(0);
                author_account = Billing.authorAccount();
                temporary_allowed = true;
            };
        };

        public func create(id : T.NodeId, req:T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            if (req.ledgers[0] == req.ledgers[1]) return #err("Requred different ledgers");
            
            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var flow = t.variables.flow;
                    var range = t.variables.range;
                };
                internals = {
                    var empty = true;
                };
            };
            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func defaults() : I.CreateRequest {
            {
                init = {

                };
                variables = {
                    range = #full;
                    flow = #add;
                };
            };
        };

        public func delete(id : T.NodeId) : T.Delete {
            let ?vec = core.getNodeById(id) else return #err("Not found");
            switch(Run.remove(id, vec)) {
                case (#ok()) ();
                case (#err(x)) return #err(x);
            };
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            t.variables.flow := m.flow;
            t.variables.range := m.range;
            #ok();
        };

        public func get(vid : T.NodeId, vec: T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
            
            let from_account = swap.Pool.accountFromVid(vid, 0);

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);
            let {tokenA; tokenB} = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);


            #ok {
                init = t.init;
                variables = {
                    flow = t.variables.flow;
                    range = t.variables.range;
                };
                internals = {
                    tokenA;
                    tokenB;
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, "Add A"), (1, "Add B")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(0, "Remove A"), (1, "Remove B")];
        };

        let DEBUG = true;

        public func run() : () {
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;
                switch(Run.single(vid, vec, parm)) {
                    case (#err(e)) {
                        if (DEBUG) U.log("Err in exchange_liquidity: " # e);
                    };
                    case (#ok) ();
                }
            };
        };

        module Run {

            public func single(vid : T.NodeId, vec : T.NodeCoreMem, ex:VM.NodeMem) : R<(), Text> {
                let now = U.now();

                    switch(ex.variables.flow) {
                        case (#add) Run.add(vid, vec);
                        case (#remove) Run.remove(vid, vec);
                        case (_) return #ok();
                    }
            };

            public func remove(vid : T.NodeId, vec : T.NodeCoreMem) : R<(), Text> {
                let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                if (cvid.internals.empty) return #ok();
                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                
                let ?destination_A = core.getDestinationAccountIC(vec, 0) else return #err("no destination 0");
                let ?destination_B = core.getDestinationAccountIC(vec, 1) else return #err("no destination 1");

                let from_account = swap.Pool.accountFromVid(vid, 0);

                let {tokenA; tokenB} = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

                if (tokenA == 0 or tokenB == 0) return #ok();
                U.performance("Exchange remove liquidity", func() : R<(), Text> { 

                // U.log("\n\nRemoving liquidity \n\n");
                let intent = swap.LiquidityIntentRemove.get({
                    from_account;
                    l1 = ledger_A;
                    l2 = ledger_B;
                    to_a_account = destination_A;
                    to_b_account = destination_B;
                });

                // U.log("\nIntent ready\n");
                switch(intent) {
                    case (#ok(intent)) {
                        swap.LiquidityIntentRemove.commit(intent);
                        // U.log("\n\nLiquidity Remove Commited\n\n");
                        cvid.internals.empty := true;
                        #ok;
                    };
                    case (#err(e)) #err("Error getting intent: " # e);
                };
                });

    
            };

            public func add(vid : T.NodeId, vec : T.NodeCoreMem) : R<(), Text> {


                let ?source_A = core.getSource(vid, vec, 0) else return #err("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("no source 1");

                let ?sourceAccount_A = core.Source.getAccount(source_A) else return #err("no source account 0");
                let ?sourceAccount_B = core.Source.getAccount(source_B) else return #err("no source account 1");

                let ?extended = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");

                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                let bal_a = core.Source.balance(source_A);
                let bal_b = core.Source.balance(source_B);

                if (bal_a == 0 or bal_b == 0) return #ok();

                let to_account = swap.Pool.accountFromVid(vid, 0);

                var in_a = bal_a;
                var in_b = bal_b;

                // switch(swap.Price.get(ledger_A, ledger_B, 0)) {
                //     case (?price) {

                //         U.log("!!!!!Price: " # debug_show(price) # "\n\n");
                //         // We will add liquidity only at the rate the pool is currently
                //         // If bal_a is more valuable than bal_b, in_a will be limited to the amount of bal_b
                //         // and vice versa with in_b
                
                //         if (swap.Price.divide(bal_a, price) > bal_b) {
                //             in_a := swap.Price.multiply(bal_b, price);
                //         } else {
                //             in_b := swap.Price.divide(bal_a, price);
                //         };
                //         U.log(debug_show({in_a; in_b}));

                //     };
                //     case (null) {
                //         U.log("No price found");
                //         (); // First time adding liquidity
                //     };
                // };

                // U.log("\n\n\n Adding liquidity: " # debug_show({in_a; in_b}) # "\n\n\n");
                let intent = swap.LiquidityIntentAdd.get({
                    to_account;
                    l1 = ledger_A;
                    l2 = ledger_B;
                    from_a_account = sourceAccount_A;
                    from_b_account = sourceAccount_B;
                    range = extended.variables.range;
                    from_a_amount = in_a;
                    from_b_amount = in_b;
                });
                // U.log("\nIntent ready\n");
                U.performance("Exchange add liquidity", func() : R<(), Text> { 

                switch(intent) {
                    case (#ok(intent)) {
                        swap.LiquidityIntentAdd.commit(intent);
                        // U.log("\n\nLiquidity Add Commited\n\n");
                        let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                        cvid.internals.empty := false;
                        #ok;
                    };
                    case (#err(e)) #err("Error getting intent: " # e);
                };
            
                });
          
            
            };

        };

       

    };




};
