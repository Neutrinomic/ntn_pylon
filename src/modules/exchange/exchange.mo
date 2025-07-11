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
import Nat64 "mo:base/Nat64";
import Vector "mo:vector";
import Swap "mo:devefi_swap";
import Float "mo:base/Float";
import ICRC55 "mo:devefi/ICRC55";
import Option "mo:base/Option";

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
                description = "Exchange X tokens for Y.";
                supported_ledgers = [];
                version = #alpha([0, 0, 1]);
                create_allowed = true;
                ledger_slots = [
                    "Sell",
                    "Buy",
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
                    var max_impact = t.variables.max_impact;
                    var buy_for_amount = t.variables.buy_for_amount;
                    var buy_interval_seconds = t.variables.buy_interval_seconds;
                    var max_rate = t.variables.max_rate;
                };
                internals = {
                    var last_run = 0;
                    var last_error = null;
                    var last_buy = 0;
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
                    max_impact = 20_000;
                    buy_for_amount = 1_000_000;  // Default amount of source token to use for each buy
                    buy_interval_seconds = 60 : Nat64;  // Default to 1 minute (60 seconds)
                    max_rate = null;  // No rate limit by default
                };
            };
        };

        public func delete(id : T.NodeId) : T.Delete {
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            t.variables.max_impact := m.max_impact;
            t.variables.buy_for_amount := m.buy_for_amount;
            t.variables.buy_interval_seconds := m.buy_interval_seconds;
            t.variables.max_rate := m.max_rate;
            #ok();
        };

        public func get(id : T.NodeId, vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);
            
            // Calculate the next buy time (convert seconds to nanoseconds)
            let now = U.now();
            let interval_ns : Nat64 = t.variables.buy_interval_seconds * 1_000_000_000;
            let next_buy = t.internals.last_buy + interval_ns;
            
            // Get current rate
            let current_rate = switch(swap.Price.get(ledger_A, ledger_B, 0)) {
                case (null) {
                    null;
                };
                case (?rate) {
                    let decimal_adjustment = swap.calculateDecimalAdjustment(ledger_A, ledger_B);
                    ?(rate * decimal_adjustment);
                };
            };

            #ok {
                init = t.init;
                variables = {
                    max_impact = t.variables.max_impact;
                    buy_for_amount = t.variables.buy_for_amount;
                    buy_interval_seconds = t.variables.buy_interval_seconds;
                    max_rate = t.variables.max_rate;
                };
                internals = {
                    swap_fee_e4s = swap._swap_fee_e4s;
                    price = current_rate;
                    last_run = t.internals.last_run;
                    last_error = t.internals.last_error;
                    last_buy = t.internals.last_buy;
                    next_buy = next_buy;
                    current_rate = current_rate;
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
        let RUN_ONCE_EVERY : Nat64 = 6 * 1_000_000_000; // 6 seconds in nanoseconds

        public func run() : () {
            let now = U.now();
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;
                
                // Skip if there was an error and not enough time has passed
                if (Option.isSome(parm.internals.last_error) and (parm.internals.last_run + RUN_ONCE_EVERY*5) > now) continue vec_loop;
                
                parm.internals.last_run := now;
                
                switch (Run.single(vid, vec, parm)) {
                    case (#err(e)) {
                        parm.internals.last_error := ?e;
                        if (DEBUG) U.log("Err in exchange: " # e);
                    };
                    case (#ok) {
                        if (Option.isSome(parm.internals.last_error)) parm.internals.last_error := null;
                    };
                };
            };
        };

        
        module Run {
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, th : VM.NodeMem) : R<(), Text> {
                let now = U.now();
                if (vec.ledgers.size() < 2) return #err("Ledger missing");
                // Convert seconds to nanoseconds
                let interval_ns : Nat64 = th.variables.buy_interval_seconds * 1_000_000_000;
                
                // Check if it's time to buy
                if (th.internals.last_buy + interval_ns > now) {
                    return #ok;
                };
                
                let ?source = core.getSource(vid, vec, 0) else return #err("No source");
                let ?destination = core.getDestinationAccountIC(vec, 0) else return #err("No destination");
                let ?source_account = core.Source.getAccount(source) else return #err("No source account");
                
                let available_balance = core.Source.balance(source);
                
                // Check if we have enough balance
                if (available_balance < th.variables.buy_for_amount) {
                    return #ok;
                };
                
                let buy_for_amount = th.variables.buy_for_amount;
                
                let ?price = swap.Price.get(U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), 0) else return #err("No price for exchange " # debug_show(vec.ledgers[0]) # " -> " # debug_show(vec.ledgers[1]));
                
                // Check if the current rate is below the max rate (if specified)
                // For ICP -> NTN, a higher price means you get fewer NTN per ICP, so we want price <= max_rate
                switch (th.variables.max_rate) {
                    case (null) { /* No max rate specified, proceed with swap */ };
                    case (?max_rate) {
                        if (1/price > max_rate) {
                            // Current rate exceeds max rate, skip this swap
                            return #ok;
                        };
                    };
                };
                
                let intent = swap.Intent.get(source_account, destination, U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), buy_for_amount, false);
                
                return U.performance("Exchange SWAP", func() : R<(), Text> { 
                    switch (intent) {
                        case (#err(e)) #err(e);
                        case (#ok(intent)) {
                            let {amount_in; amount_out} = swap.Intent.quote(intent);
                            let expected_receive_fwd = (swap.Price.multiply(buy_for_amount, price));
                            
                            if (expected_receive_fwd < amount_out) return #err("Internal error, " # debug_show(buy_for_amount) # " shouldn't get more than expected " # debug_show (expected_receive_fwd) # " " # debug_show (amount_out));
                            
                            let impact = (Float.fromInt(expected_receive_fwd) - Float.fromInt(amount_out)) / Float.fromInt(expected_receive_fwd);
                            U.log(debug_show({expected_receive_fwd; amount_out; impact}));
                            
                            if (impact > th.variables.max_impact) return #err("Price impact too high: " # debug_show(impact));
                            
                            swap.Intent.commit(intent);
                            
                            // Update the last buy timestamp
                            th.internals.last_buy := now;
                            
                            #ok;
                        };
                    };
                });
            };
        };

    };

};
