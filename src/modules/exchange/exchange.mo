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
            };
        };

        public func create(id : T.NodeId, req:T.CommonCreateRequest, t : I.CreateRequest) : T.Create {

            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var max_slippage_e6s = t.variables.max_slippage_e6s;
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
                    max_slippage_e6s = 20_000;
                };
            };
        };

        public func delete(id : T.NodeId) : () {
            ignore Map.remove(mem.main, Map.n32hash, id);
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            t.variables.max_slippage_e6s := m.max_slippage_e6s;
            #ok();
        };

        public func get(id : T.NodeId, vec: T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);

            #ok {
                init = t.init;
                variables = {
                    max_slippage_e6s = t.variables.max_slippage_e6s;
                };
                internals = {
                    swap_fee_e4s = swap._swap_fee_e4s;
                    price_e16s = swap.Price.get(ledger_A, ledger_B, 0);
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, "From")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(1, "To")];
        };

        public func run() : () {
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;
                Run.single(vid, vec, parm);
            };
        };

        module Run {
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, th:VM.NodeMem) : () {
                let now = U.now();

                let ?source = core.getSource(vid, vec, 0) else return;
                let ?destination = core.getDestinationAccountIC(vec, 0) else return;
                let ?source_account = core.Source.getAccount(source) else return;

                let bal = core.Source.balance(source);
                U.log("Swapping" # debug_show(bal));
                if (bal == 0) return;
                let ?price_e16s = swap.Price.get(U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), 0) else return;

                let intent = swap.Intent.get(source_account, destination, U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), bal);
                U.log(debug_show(intent));
                    switch(intent) {
                        case (#err(e)) U.log("Error in intent " # debug_show(e));
                    
                        case (#ok(intent)) {
                            let out = swap.Intent.quote(intent);
                            
                            let expected_receive_fwd = (bal * price_e16s) / 1_0000_0000_0000_0000;
                            if (expected_receive_fwd < out) U.trap("Internal error, shouldn't get more than expected " # debug_show(expected_receive_fwd) # " " # debug_show(out));
                            let slippage_e6s = ((expected_receive_fwd - out:Nat) * 1_000_000) / expected_receive_fwd;
                            if (slippage_e6s > th.variables.max_slippage_e6s) {
                                U.log("Slippage too high. slippage_e6s = " # debug_show(slippage_e6s));
                                return;
                            };
                            swap.Intent.commit(intent);
                            U.log("Intent is ok");
                        }
                    }
            };
        };

       

    };




};
