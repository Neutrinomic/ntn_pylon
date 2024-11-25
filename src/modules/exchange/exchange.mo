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
import Float "mo:base/Float";
import ICRC55 "mo:devefi/ICRC55";

module {
    let T = Core.VectorModule;
    public let Interface = I;
    type R<A, B> = Result.Result<A, B>;

    public module Mem {
        public module Vector {
            public let V1 = Ver1;
        };
    };
    let VM = Mem.Vector.V1;

    public let ID = "exchange";

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
                    "From",
                    "To",
                ];
                billing = Billing.get();
                sources = sources(0);
                destinations = destinations(0);
                author_account = Billing.authorAccount();
                temporary_allowed = true;
            };
        };

        public func create(id : T.NodeId, req : T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            if (req.ledgers[0] == req.ledgers[1]) return #err("Requred different ledgers");
            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var max_slippage = t.variables.max_slippage;
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
                    max_slippage = 20_000;
                };
            };
        };

        public func delete(id : T.NodeId) : T.Delete {
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            t.variables.max_slippage := m.max_slippage;
            #ok();
        };

        public func get(id : T.NodeId, vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);

            #ok {
                init = t.init;
                variables = {
                    max_slippage = t.variables.max_slippage;
                };
                internals = {
                    swap_fee_e4s = swap._swap_fee_e4s;
                    price = swap.Price.get(ledger_A, ledger_B, 0);
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, "From")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(1, "To")];
        };

        let DEBUG = true;

        public func run() : () {
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;

                switch (Run.single(vid, vec, parm)) {
                    case (#err(e)) {
                        if (DEBUG) U.log("Err in exchange: " # e);
                    };
                    case (#ok) ();
                };
                
                
            };
        };

        
        module Run {
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, th : VM.NodeMem) : R<(), Text> {
                let now = U.now();

                let ?source = core.getSource(vid, vec, 0) else return #err("No source");
                let ?destination = core.getDestinationAccountIC(vec, 0) else return #err("No destination");
                let ?source_account = core.Source.getAccount(source) else return #err("No source account");

                let bal = core.Source.balance(source);
                if (bal == 0) return #ok;
                
                let ?price = swap.Price.get(U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), 0) else return #err("No price for exchange " # debug_show(vec.ledgers[0]) # " -> " # debug_show(vec.ledgers[1]));
                // U.log("\n\n Swapping " # debug_show(bal) # "\n\n");
                let intent = swap.Intent.get(source_account, destination, U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), bal, false);
                // U.log(debug_show(intent));
                U.performance("Exchange SWAP", func() : R<(), Text> { 

                switch (intent) {
                    case (#err(e)) #err(e);

                    case (#ok(intent)) {
                        let {amount_in; amount_out} = swap.Intent.quote(intent);

                        let expected_receive_fwd = (swap.Price.multiply(bal, price));
                        
                        if (expected_receive_fwd < amount_out) return #err("Internal error, " # debug_show(bal) # " shouldn't get more than expected " # debug_show (expected_receive_fwd) # " " # debug_show (amount_out));
                        let slippage = (Float.fromInt(expected_receive_fwd) - Float.fromInt(amount_out)) / Float.fromInt(expected_receive_fwd);
                        U.log(debug_show({expected_receive_fwd; amount_out; slippage}));
                        if (slippage > th.variables.max_slippage) return #err("Slippage too high. slippage_e6s = " # debug_show (slippage));
                        swap.Intent.commit(intent);
                        #ok;
                    };
                };

                });
            };
        };

    };

};
