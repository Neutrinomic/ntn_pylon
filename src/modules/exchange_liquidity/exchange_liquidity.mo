import Billing "../../billing_all";
import MU "mo:mosup";
import Ver1 "./memory/v1";
import Map "mo:map/Map";
import Core "mo:devefi/core";
import I "./interface";
import U "mo:devefi/utils";
import Result "mo:base/Result";
import DeVeFi "mo:devefi/lib";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import IT "mo:itertools/Iter";
import Nat32 "mo:base/Nat32";
import Nat "mo:base/Nat";
import Vector "mo:vector";
import Swap "../../shared_modules/swap/swap";
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
            };
        };

        public func create(id : T.NodeId, t : I.CreateRequest) : T.Create {

            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var flow = t.variables.flow;
                };
                internals = {};
            };
            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func defaults() : I.CreateRequest {
            {
                init = {

                };
                variables = {
                    flow = #add;
                };
            };
        };

        public func delete(id : T.NodeId) : () {
            ignore Map.remove(mem.main, Map.n32hash, id);
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            t.variables.flow := m.flow;
            #ok();
        };

        public func get(vid : T.NodeId, vec: T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
            
            let from_account = swap.Pool.accountFromVid(vid, 0);

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);
            let {balance; total} = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);


            #ok {
                init = t.init;
                variables = {
                    flow = t.variables.flow;
                };
                internals = {
                    balance;
                    total;
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, "Add A"), (1, "Add B")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(0, "Remove A"), (1, "Remove B")];
        };


        public func run(vid : T.NodeId, vec : T.NodeCoreMem) : () {
            let ?ex = Map.get(mem.main, Map.n32hash, vid) else U.trap("Vector in module not found");
            let now = U.now();


            switch(ex.variables.flow) {
                case (#add) Run.add(vid, vec);
                case (#remove) Run.remove(vid, vec);
                case (_) (); // TODO
            }
        };


        public module Run {
            public func remove(vid : T.NodeId, vec : T.NodeCoreMem) : () {
                
                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                
                let ?destination_A = core.getDestinationAccountIC(vec, 0) else U.trap("no destination 0");
                let ?destination_B = core.getDestinationAccountIC(vec, 1) else U.trap("no destination 1");

                let from_account = swap.Pool.accountFromVid(vid, 0);

                let {balance; total} = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

                let intent = swap.LiquidityIntentRemove.get(
                    from_account,
                    { ledger = ledger_A; account = destination_A},
                    { ledger = ledger_B; account = destination_B},
                    balance);

                switch(intent) {
                    case (#ok(intent)) {
                        Debug.print(debug_show(intent));
                        let quote = swap.LiquidityIntentRemove.quote(intent);

                        swap.LiquidityIntentRemove.commit(intent);
                    };
                    case (#err(e)) U.trap("Error getting intent: " # e);
                };

    
            };

            public func add(vid : T.NodeId, vec : T.NodeCoreMem) : () {


                let ?source_A = core.getSource(vid, vec, 0) else U.trap("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else U.trap("no source 1");

                let ?sourceAccount_A = core.Source.getAccount(source_A) else U.trap("no source account 0");
                let ?sourceAccount_B = core.Source.getAccount(source_B) else U.trap("no source account 1");

                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                let bal_a = core.Source.balance(source_A);
                let bal_b = core.Source.balance(source_B);

                if (bal_a == 0 or bal_b == 0) return;

                let to_account = swap.Pool.accountFromVid(vid, 0);

                var in_a = bal_a;
                var in_b = bal_b;

                switch(swap.Price.get(ledger_A, ledger_B, 0)) {
                    case (?price) {
                        Debug.print("Price found " # debug_show(price));
                        // We will add liquidity only at the rate the pool is currently
                        // If bal_a is more valuable than bal_b, in_a will be limited to the amount of bal_b
                        // and vice versa with in_b
                
                        if ((bal_a * price) / swap.scale > bal_b) {
                            in_a := (bal_b * swap.scale) / price;
                        } else {
                            in_b := (bal_a * price) / swap.scale;
                        };

                    };
                    case (null) {
                        Debug.print("Adding first time" # debug_show({bal_a; bal_b}));
                        // First time adding liquidity
                        // We will add liquidity at the incoming rate unless one of the balances is 0
                        if ((in_a == 0) or (in_b == 0)) U.trap("First time adding liquidity, one of the balances is 0");
                    };
                };



                let intent = swap.LiquidityIntentAdd.get(
                    to_account,
                    { ledger = ledger_A; account = sourceAccount_A; amount = in_a },
                    { ledger = ledger_B; account = sourceAccount_B; amount = in_b });


                switch(intent) {
                    case (#ok(intent)) {
                       Debug.print(debug_show(intent));
                        let quote = swap.LiquidityIntentAdd.quote(intent);

                        swap.LiquidityIntentAdd.commit(intent);
                    };
                    case (#err(e)) U.log("Error getting intent: " # e);
                };
            

          
            
            };

        };

       

    };




};
