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
import Int "mo:base/Int";
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

    public let ID = "auto_liquidity";

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

        // Helper function to calculate price range based on current price and percentage
        private func calculatePriceRange(currentPrice : Float, rangePercent : Float) : {
            from_price : Float;
            to_price : Float;
        } {
            let percentage = rangePercent / 100.0;
            let from_price = currentPrice * (1.0 - percentage);
            let to_price = currentPrice * (1.0 + percentage);
            return { from_price; to_price };
        };

        public func meta() : T.Meta {
            {
                id = ID; // This has to be same as the variant in vec.custom
                name = "Auto Liquidity";
                author = "Neutrinite";
                description = "Automatically rebalance liquidity based on current price";
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
            if (req.ledgers[0] == req.ledgers[1]) return #err("Required different ledgers");
            // Check if there is a pool
            let #ic(l1) = req.ledgers[0] else return #err("Ledger 1 not supported");
            let #ic(l2) = req.ledgers[1] else return #err("Ledger 2 not supported");
            if (Option.isNull(swap.Pool.get(swap.getPoolAccount(l1, l2, 0)))) return #err("No pool found");

            // Validate parameters
            if (t.variables.interval_seconds < 600) return #err("Interval must be at least 600 seconds (10 minutes)");
            if (t.variables.range_percent <= 0.0) return #err("Range percent must be greater than 0");
            if (t.variables.remove_percent < 0.0 or t.variables.remove_percent > 100.0) return #err("Remove percent must be between 0 and 100");

            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var range_percent = t.variables.range_percent;
                    var interval_seconds = t.variables.interval_seconds;
                    var remove_percent = t.variables.remove_percent;
                    var mode = t.variables.mode;
                };
                internals = {
                    var empty = true;
                    var last_run = 0;
                    var last_rebalance = 0;
                    var total_added = {
                        tokenA = 0;
                        tokenB = 0;
                    };
                    var last_inputs = {
                        tokenA = 0;
                        tokenB = 0;
                    };
                    var last_error = null;
                };
            };
            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func defaults() : I.CreateRequest {
            {
                init = {};
                variables = {
                    range_percent = 5.0;
                    interval_seconds = 3600; // Default 1 hour
                    remove_percent = 0.0; // Default no removal
                    mode = #auto; // Default auto mode
                };
            };
        };

        public func delete(id : T.NodeId) : T.Delete {
            let ?vec = core.getNodeById(id) else return #err("Not found");
            switch (Run.remove(id, vec)) {
                case (#ok()) ();
                case (#err(x)) return #err(x);
                case (#skip) return #err("Couldn't delete");
            };
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            // Validate parameters
            if (m.interval_seconds < 600) return #err("Interval must be at least 600 seconds (10 minutes)");
            if (m.range_percent <= 0.0) return #err("Range percent must be greater than 0");
            if (m.remove_percent < 0.0 or m.remove_percent > 100.0) return #err("Remove percent must be between 0 and 100");

            t.variables.range_percent := m.range_percent;
            t.variables.interval_seconds := m.interval_seconds;
            t.variables.remove_percent := m.remove_percent;
            t.variables.mode := m.mode;
            t.internals.last_inputs := {
                tokenA = 0;
                tokenB = 0;
            };

            #ok();
        };

        public func get(vid : T.NodeId, vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");

            let from_account = swap.Pool.accountFromVid(vid, 0);

            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);
            let { tokenA; tokenB } = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

            // Get current price
            let current_price = switch (swap.Price.get(ledger_A, ledger_B, 0)) {
                case (null) {
                    null;
                };
                case (?price) {
                    ?convertToActualPrice(ledger_A, ledger_B, price);
                };
            };

            // Calculate next rebalance time
            let now = U.now();
            let interval_ns : Nat64 = t.variables.interval_seconds * 1_000_000_000;
            let next_rebalance = t.internals.last_rebalance + interval_ns;

            #ok {
                init = t.init;
                variables = {
                    range_percent = t.variables.range_percent;
                    interval_seconds = t.variables.interval_seconds;
                    remove_percent = t.variables.remove_percent;
                    mode = t.variables.mode;
                };
                internals = {
                    current_price = current_price;
                    last_rebalance = t.internals.last_rebalance;
                    next_rebalance = next_rebalance;
                    tokenA = tokenA;
                    tokenB = tokenB;
                    addedTokenA = t.internals.total_added.tokenA;
                    addedTokenB = t.internals.total_added.tokenB;
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

        public func run() : () {
            let now = U.now();
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active or vec.billing.frozen) continue vec_loop;
                if (not Option.isNull(parm.internals.last_error) and (parm.internals.last_run + RUN_ONCE_EVERY) > now) continue vec_loop;
                parm.internals.last_run := now;

                // Check mode and run appropriate function
                switch (parm.variables.mode) {
                    case (#auto) {
                        // Add input change detection
                        let force_refresh = (parm.internals.last_run + RUN_ONCE_UNLESS_INPUTS_CHANGED < now);
                        if (not has_input_changed(vid, vec, parm) and (not force_refresh)) continue vec_loop;

                        switch (Run.single(vid, vec, parm)) {
                            case (#err(e)) {
                                parm.internals.last_error := ?e;
                                if (DEBUG) U.log("Err in auto_liquidity: " # e);
                            };
                            case (#ok) {
                                if (not Option.isNull(parm.internals.last_error)) parm.internals.last_error := null;
                            };
                            case (#skip) continue vec_loop;
                        };
                    };
                    case (#remove) {
                        switch (Run.remove(vid, vec)) {
                            case (#err(e)) {
                                parm.internals.last_error := ?e;
                                if (DEBUG) U.log("Err in auto_liquidity remove: " # e);
                            };
                            case (#ok) {
                                if (not Option.isNull(parm.internals.last_error)) parm.internals.last_error := null;
                            };
                            case (#skip) continue vec_loop;
                        };
                    };
                };
                refresh_last_inputs(vid, vec, parm);
            };
        };

        private func refresh_last_inputs(vid : T.NodeId, vec : T.NodeCoreMem, vmem : VM.NodeMem) {
            let ?sourceA = core.getSource(vid, vec, 0) else return;
            let ?sourceB = core.getSource(vid, vec, 1) else return;

            vmem.internals.last_inputs := {
                tokenA = core.Source.balance(sourceA);
                tokenB = core.Source.balance(sourceB);
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

                // First get necessary data
                var ledger_A = U.onlyICLedger(vec.ledgers[0]);
                var ledger_B = U.onlyICLedger(vec.ledgers[1]);

                // Use getDirectDetailed to get more precise price information
                let ?price_details = swap.Price.getDirectDetailed(ledger_A, ledger_B, 0) else return #err("No price found");
                let current_price_raw = price_details.cur;
                var current_price = convertToActualPrice(ledger_A, ledger_B, current_price_raw);

                // Check if sources have funds
                let ?source_A = core.getSource(vid, vec, 0) else return #err("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("no source 1");
                let bal_a = core.Source.balance(source_A);
                let bal_b = core.Source.balance(source_B);
                let min_fee = swap._swap_fee_e4s * 100; // 100x the fee as minimum
                let sources_have_funds = bal_a >= min_fee or bal_b >= min_fee;

                // Check if it's time to rebalance
                let interval_ns : Nat64 = ex.variables.interval_seconds * 1_000_000_000;
                let is_rebalance_time = ex.internals.last_rebalance + interval_ns <= now;

                // If it's not time to rebalance and sources don't have funds, skip
                if (not is_rebalance_time and not sources_have_funds) {
                    return #skip;
                };

                // First remove liquidity if it's time to rebalance
                if (is_rebalance_time) {
                    switch (remove_and_distribute(vid, vec, ex)) {
                        case (#err(e)) return #err(e);
                        case (#ok) ();
                        case (#skip) ();
                    };

                    // Update last rebalance time
                    ex.internals.last_rebalance := now;
                };

                // Calculate price range
                var range_data = calculatePriceRange(current_price, ex.variables.range_percent);
                var from_price = range_data.from_price;
                var to_price = range_data.to_price;

                // Add liquidity with new range if sources have funds or it's time to rebalance
                switch (add(vid, vec, from_price, to_price)) {
                    case (#err(e)) return #err(e);
                    case (#ok) {
                        return #ok;
                    };
                    case (#skip) return #skip;
                };
            };

            public func remove_and_distribute(vid : T.NodeId, vec : T.NodeCoreMem, ex : VM.NodeMem) : RunResult {
                let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                if (cvid.internals.empty) return #ok();

                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                // Get source accounts for returning tokens
                let ?source_A = core.getSource(vid, vec, 0) else return #err("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("no source 1");

                let ?sourceAccount_A = core.Source.getAccount(source_A) else return #err("no source account 0");
                let ?sourceAccount_B = core.Source.getAccount(source_B) else return #err("no source account 1");

                // Get destination accounts for sending the remove_percent
                let ?destination_A = core.getDestinationAccountIC(vec, 0) else return #err("no destination 0");
                let ?destination_B = core.getDestinationAccountIC(vec, 1) else return #err("no destination 1");

                let from_account = swap.Pool.accountFromVid(vid, 0);

                let { tokenA; tokenB } = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

                if (tokenA == 0 and tokenB == 0) return #ok();

                // Remove liquidity to source accounts
                let intent = swap.LiquidityIntentRemove.get({
                    from_account;
                    l1 = ledger_A;
                    l2 = ledger_B;
                    to_a_account = sourceAccount_A;
                    to_b_account = sourceAccount_B;
                });

                switch (intent) {
                    case (#ok(intent)) {
                        swap.LiquidityIntentRemove.commit(intent);
                        cvid.internals.empty := true;

                        // Calculate removed amounts
                        let tokenA_removed = tokenA;
                        let tokenB_removed = tokenB;

                        // If remove_percent > 0, transfer that percentage to destination accounts
                        if (ex.variables.remove_percent > 0.0) {
                            let remove_fraction = ex.variables.remove_percent / 100.0;

                            // Calculate amounts to send to destinations
                            let tokenA_to_send = Float.toInt(Float.fromInt(tokenA_removed) * remove_fraction);
                            let tokenB_to_send = Float.toInt(Float.fromInt(tokenB_removed) * remove_fraction);

                            // Transfer to destination accounts using core.Source.Send
                            if (tokenA_to_send > 0) {
                                let #ok(intentA) = core.Source.Send.intent(source_A, #destination({ port = 0 }), Int.abs(tokenA_to_send)) else return #err("Failed to create transfer intent for token A");
                                ignore core.Source.Send.commit(intentA);
                            };

                            if (tokenB_to_send > 0) {
                                let #ok(intentB) = core.Source.Send.intent(source_B, #destination({ port = 1 }), Int.abs(tokenB_to_send)) else return #err("Failed to create transfer intent for token B");
                                ignore core.Source.Send.commit(intentB);
                            };
                        };
                    };
                    case (#err(e)) return #err(e);
                };

                #ok;
            };

            public func remove(vid : T.NodeId, vec : T.NodeCoreMem) : RunResult {
                let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                if (cvid.internals.empty) return #ok();
                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                // Get source accounts for returning tokens
                let ?source_A = core.getSource(vid, vec, 0) else return #err("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("no source 1");

                let ?sourceAccount_A = core.Source.getAccount(source_A) else return #err("no source account 0");
                let ?sourceAccount_B = core.Source.getAccount(source_B) else return #err("no source account 1");

                let from_account = swap.Pool.accountFromVid(vid, 0);

                let { tokenA; tokenB } = swap.Pool.balance(ledger_A, ledger_B, 0, from_account);

                if (tokenA == 0 and tokenB == 0) return #ok();

                let intent = swap.LiquidityIntentRemove.get({
                    from_account;
                    l1 = ledger_A;
                    l2 = ledger_B;
                    to_a_account = sourceAccount_A;
                    to_b_account = sourceAccount_B;
                });

                switch (intent) {
                    case (#ok(intent)) {
                        swap.LiquidityIntentRemove.commit(intent);
                        cvid.internals.empty := true;
                    };
                    case (#err(e)) return #err(e);
                };

                #ok;
            };

            public func add(vid : T.NodeId, vec : T.NodeCoreMem, from_price : Float, to_price : Float) : RunResult {
                let ?source_A = core.getSource(vid, vec, 0) else return #err("no source 0");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("no source 1");

                let ?sourceAccount_A = core.Source.getAccount(source_A) else return #err("no source account 0");
                let ?sourceAccount_B = core.Source.getAccount(source_B) else return #err("no source account 1");

                let ?extended = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");

                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);

                let bal_a = core.Source.balance(source_A);
                let bal_b = core.Source.balance(source_B);

                // Check if we have enough balance
                let min_fee = swap._swap_fee_e4s * 100; // 100x the fee as minimum
                if (bal_a < min_fee and bal_b < min_fee) return #ok();

                let to_account = swap.Pool.accountFromVid(vid, 0);

                var in_a = bal_a;
                var in_b = bal_b;

                // Get detailed price information including prev and next tick prices
                let ?price_details = swap.Price.getDirectDetailed(ledger_A, ledger_B, 0) else return #err("No price found");

                // If price details are not available, fall back to the calculated range
                let raw_from_price = convertToRawPrice(ledger_A, ledger_B, if (price_details.dir) from_price else to_price);
                let raw_to_price = convertToRawPrice(ledger_A, ledger_B, if (price_details.dir) to_price else from_price);

                // First try to add token A if available - use range from prev tick down to lower bound
                if (bal_a >= min_fee) {
                    // For token A, we want to provide liquidity below the current tick
                    // Use prev tick price as the upper bound
                    // Adjust based on the pool direction (dir parameter)
                    let range_a = #partial({
                        from_price = price_details.next;
                        to_price = Float.max(raw_to_price, price_details.next);
                    });

                    let intent_a = swap.LiquidityIntentAdd.get({
                        to_account;
                        l1 = ledger_A;
                        l2 = ledger_B;
                        from_a_account = sourceAccount_A;
                        from_b_account = sourceAccount_B;
                        range = range_a;
                        from_a_amount = in_a;
                        from_b_amount = 0; // Only add token A
                    });

                    switch (intent_a) {
                        case (#ok(intent)) {
                            swap.LiquidityIntentAdd.commit(intent);
                            let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                            cvid.internals.empty := false;
                            cvid.internals.total_added := {
                                tokenA = cvid.internals.total_added.tokenA + (if (intent.zeroForOne) intent.from_a_amount else intent.from_b_amount);
                                tokenB = cvid.internals.total_added.tokenB + (if (intent.zeroForOne) intent.from_b_amount else intent.from_a_amount);
                            };
                        };
                        case (#err(e)) return #err(e);
                    };
                };

                // Then try to add token B if available - use range from next tick up to upper bound
                if (bal_b >= min_fee) {
                    // For token B, we want to provide liquidity above the current tick
                    // Use next tick price as the lower bound
                    // Adjust based on the pool direction (dir parameter)
                    let range_b = #partial({
                        from_price = Float.min(raw_from_price, price_details.prev);
                        to_price = price_details.prev;
                    });

                    let intent_b = swap.LiquidityIntentAdd.get({
                        to_account;
                        l1 = ledger_A;
                        l2 = ledger_B;
                        from_a_account = sourceAccount_A;
                        from_b_account = sourceAccount_B;
                        range = range_b;
                        from_a_amount = 0; // Only add token B
                        from_b_amount = in_b;
                    });

                    switch (intent_b) {
                        case (#ok(intent)) {
                            swap.LiquidityIntentAdd.commit(intent);
                            let ?cvid = Map.get(mem.main, Map.n32hash, vid) else return #err("Not found");
                            cvid.internals.empty := false;
                            cvid.internals.total_added := {
                                tokenA = cvid.internals.total_added.tokenA + (if (intent.zeroForOne) intent.from_a_amount else intent.from_b_amount);
                                tokenB = cvid.internals.total_added.tokenB + (if (intent.zeroForOne) intent.from_b_amount else intent.from_a_amount);
                            };
                        };
                        case (#err(e)) return #err(e);
                    };
                };

                #ok;
            };
        };
    };
};
