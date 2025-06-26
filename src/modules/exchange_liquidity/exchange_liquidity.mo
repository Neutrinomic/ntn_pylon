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
import Option "mo:base/Option";
import Float "mo:base/Float";

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

    public let ID = "exchange_liquidity";

    public class Mod({
        xmem : MU.MemShell<VM.Mem>;
        core : Core.Mod;
        swap : Swap.Mod;
    }) : T.Class<I.CreateRequest, I.ModifyRequest, I.Shared> {

        let mem = MU.access(xmem);

        // Helper function to convert actual price to raw price
        private func convertToRawPrice(ledgerA : Principal, ledgerB : Principal, actualPrice : Float) : Float {
            let decimalAdjustment = swap.calculateDecimalAdjustment(ledgerA, ledgerB);
            return actualPrice / decimalAdjustment;
        };

        // Helper function to convert raw price to actual price
        private func convertToActualPrice(ledgerA : Principal, ledgerB : Principal, rawPrice : Float) : Float {
            let decimalAdjustment = swap.calculateDecimalAdjustment(ledgerA, ledgerB);
            return rawPrice * decimalAdjustment;
        };

        // Helper function to convert range from actual price to raw price
        private func convertRangeToRawPrice(ledgerA : Principal, ledgerB : Principal, range : I.Range) : swap.LiquidityIntentAdd.Range {
            switch (range) {
                case (#partial({ from_price; to_price })) {
                    #partial({
                        from_price = convertToRawPrice(ledgerA, ledgerB, from_price);
                        to_price = convertToRawPrice(ledgerA, ledgerB, to_price);
                    })
                };
            };
        };

        // Helper function to convert range from raw price to actual price
        private func convertRangeToActualPrice(ledgerA : Principal, ledgerB : Principal, range : I.Range) : I.Range {
            switch (range) {
                case (#partial({ from_price; to_price })) {
                    #partial({
                        from_price = convertToActualPrice(ledgerA, ledgerB, from_price);
                        to_price = convertToActualPrice(ledgerA, ledgerB, to_price);
                    })
                };
            };
        };

        public func meta() : T.Meta {
            {
                id = ID; // This has to be same as the variant in vec.custom
                name = "Exchange Liquidity";
                author = "Neutrinite";
                description = "Add liquidity to pool";
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

        public func create(id : T.NodeId, req : T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            if (req.ledgers[0] == req.ledgers[1]) return #err("Requred different ledgers");
            // Check if there is a pool
            let #ic(l1) = req.ledgers[0] else return #err("Ledger 1 not supported");
            let #ic(l2) = req.ledgers[1] else return #err("Ledger 2 not supported");
            if (Option.isNull(swap.Pool.get(swap.getPoolAccount(l1, l2, 0)))) return #err("No pool found");

            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var flow = t.variables.flow;
                    var range = t.variables.range;
                };
                internals = {
                    var empty = true;
                    var last_run = 0;
                    var last_error = null;
                    var total_added = {
                        tokenA = 0;
                        tokenB = 0;
                    };
                    var last_inputs = {
                        tokenA = 0;
                        tokenB = 0;
                    };
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
                    range = #partial({
                        from_price = 0.0;
                        to_price = 0.0;
                    });
                    flow = #add;
                };
            };
        };

        public func delete(id : T.NodeId) : T.Delete {
            let ?vec = core.getNodeById(id) else return #err("Not found");
            switch (Run.remove(id, vec)) {
                case (#ok()) ();
                case (#err(x)) return #err(x);
                case (#skip) return #err("Cound't delete")
            };
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            t.variables.flow := m.flow;
            
            // When modifying, we need to store the range in actual price format
            // The conversion to raw price happens when we use it in the add function
            t.variables.range := m.range;
            
            #ok();
        };

        public func get(vid : T.NodeId, vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");

            let from_account = swap.Pool.accountFromVid(vid, 0);

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);
            let { tokenA; tokenB } = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

            // We don't need to convert the range here because we're already storing actual prices
            // in the module's memory. The conversion only happens when interacting with the swap module.
            let actualRange = t.variables.range;

            #ok {
                init = t.init;
                variables = {
                    flow = t.variables.flow;
                    range = actualRange;
                };
                internals = {
                    addedTokenA = t.internals.total_added.tokenA;
                    addedTokenB = t.internals.total_added.tokenB;
                    tokenA;
                    tokenB;
                    last_run = t.internals.last_run;
                    last_error = t.internals.last_error;
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

        let RUN_ONCE_EVERY : Nat64 = 6 * 1_000_000_000;
        let RUN_ONCE_UNLESS_INPUTS_CHANGED : Nat64 = 90 * 1_000_000_000;

        private func has_input_changed(vid : T.NodeId, vec : T.NodeCoreMem, vmem : VM.NodeMem) : Bool {
            let ?sourceA = core.getSource(vid, vec, 0) else return false;
            let ?sourceB = core.getSource(vid, vec, 1) else return false;
            let { tokenA; tokenB } = vmem.internals.last_inputs;
            let new_tokenA = core.Source.balance(sourceA);
            let new_tokenB = core.Source.balance(sourceB);

            (tokenA != new_tokenA or tokenB != new_tokenB);
        };

        private func refresh_last_inputs(vid : T.NodeId, vec : T.NodeCoreMem, vmem : VM.NodeMem) {
            let ?sourceA = core.getSource(vid, vec, 0) else return;
            let ?sourceB = core.getSource(vid, vec, 1) else return;

            vmem.internals.last_inputs := {
                tokenA = core.Source.balance(sourceA);
                tokenB = core.Source.balance(sourceB);
            };
        };

        public func run() : () {
            let now = U.now();
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active or vec.billing.frozen) continue vec_loop;
                if (not Option.isNull(parm.internals.last_error) and (parm.internals.last_run + RUN_ONCE_EVERY) > now) continue vec_loop;
                parm.internals.last_run := now;
                switch (Run.single(vid, vec, parm)) {
                    case (#err(e)) {
                        parm.internals.last_error := ?e;
                        if (DEBUG) U.log("Err in exchange_liquidity: " # e);
                    };
                    case (#ok) {
                        if (not Option.isNull(parm.internals.last_error)) parm.internals.last_error := null;
                    };
                    case (#skip) continue vec_loop;
                };
                refresh_last_inputs(vid, vec, parm);
            };
        };

        module Run {
            type RunResult = {
                #ok;
                #skip;
                #err : Text;
            };
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, ex : VM.NodeMem) : RunResult {
                let now = U.now();

                switch (ex.variables.flow) {
                    case (#add) {

                        let force_refresh = (ex.internals.last_run + RUN_ONCE_UNLESS_INPUTS_CHANGED > now);

                        if (not has_input_changed(vid, vec, ex) and (not force_refresh)) return #skip;

                        Run.add(vid, vec);
                    };
                    case (#remove) Run.remove(vid, vec);
                    case (_) return #ok();
                };
            };

            public func remove(vid : T.NodeId, vec : T.NodeCoreMem) : RunResult {
                let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                if (cvid.internals.empty) return #ok();
                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                let ?destination_A = core.getDestinationAccountIC(vec, 0) else return #err("no destination 0");
                let ?destination_B = core.getDestinationAccountIC(vec, 1) else return #err("no destination 1");

                let from_account = swap.Pool.accountFromVid(vid, 0);

                let { tokenA; tokenB } = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

                if (tokenA == 0 and tokenB == 0) return #ok();
                U.performance(
                    "Exchange remove liquidity",
                    func() : R<(), Text> {

                        let intent = swap.LiquidityIntentRemove.get({
                            from_account;
                            l1 = ledger_A;
                            l2 = ledger_B;
                            to_a_account = destination_A;
                            to_b_account = destination_B;
                        });

                        switch (intent) {
                            case (#ok(intent)) {
                                swap.LiquidityIntentRemove.commit(intent);
                                cvid.internals.empty := true;
                                cvid.internals.total_added := {
                                    tokenA = 0;
                                    tokenB = 0;
                                };
                                #ok;
                            };
                            case (#err(e)) #err(e);
                        };
                    },
                );

            };

            public func add(vid : T.NodeId, vec : T.NodeCoreMem) : RunResult {

                let ?source_A = core.getSource(vid, vec, 0) else return #err("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("no source 1");

                let ?sourceAccount_A = core.Source.getAccount(source_A) else return #err("no source account 0");
                let ?sourceAccount_B = core.Source.getAccount(source_B) else return #err("no source account 1");

                let ?extended = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");

                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                let bal_a = core.Source.balance(source_A);
                let bal_b = core.Source.balance(source_B);

                if (bal_a == 0 and bal_b == 0) return #ok();

                let to_account = swap.Pool.accountFromVid(vid, 0);

                var in_a = bal_a;
                var in_b = bal_b;

                // Convert the range from actual price to raw price before passing to swap module
                let rawRange = convertRangeToRawPrice(ledger_A, ledger_B, extended.variables.range);

                let intent = swap.LiquidityIntentAdd.get({
                    to_account;
                    l1 = ledger_A;
                    l2 = ledger_B;
                    from_a_account = sourceAccount_A;
                    from_b_account = sourceAccount_B;
                    range = rawRange;
                    from_a_amount = in_a;
                    from_b_amount = in_b;
                });

                U.performance(
                    "Exchange add liquidity",
                    func() : R<(), Text> {

                        switch (intent) {
                            case (#ok(intent)) {
                                swap.LiquidityIntentAdd.commit(intent);
                                let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                                cvid.internals.empty := false;
                                cvid.internals.total_added := {
                                    tokenA = cvid.internals.total_added.tokenA + (if (intent.zeroForOne) intent.from_a_amount else intent.from_b_amount);
                                    tokenB = cvid.internals.total_added.tokenB + (if (intent.zeroForOne) intent.from_b_amount else intent.from_a_amount);
                                };
                                #ok;
                            };
                            case (#err(e)) #err(e);
                        };

                    },
                );

            };

        };

    };

};
