import Billing "../../billing_all";
import MU "mo:mosup";
import Ver1 "./memory/v1";
import Map "mo:map/Map";
import Core "mo:devefi/core";
import I "./interface";
import U "mo:devefi/utils";
import Result "mo:base/Result";

import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Swap "mo:devefi_swap";
import Option "mo:base/Option";
import Float "mo:base/Float";
import Principal "mo:base/Principal";

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

    public let ID = "balancer";
    
    public class Mod({
        xmem : MU.MemShell<VM.Mem>;
        core : Core.Mod;
        swap : Swap.Mod;
    }) : T.Class<I.CreateRequest, I.ModifyRequest, I.Shared> {

        let mem = MU.access(xmem);

        public func meta() : T.Meta {
            {
                id = ID;
                name = "Balancer";
                author = "Neutrinite";
                description = "Maintains specified value ratios between two tokens by automatically rebalancing.";
                supported_ledgers = [];
                version = #alpha([0, 0, 1]);
                create_allowed = true;
                ledger_slots = [
                    "Token A",
                    "Token B",
                ];
                billing = Billing.get();
                sources = sources(0);
                destinations = destinations(0);
                author_account = Billing.authorAccount();
                temporary_allowed = true;
            };
        };

        // Helper function to calculate target ratios from token_ratios
        private func calculateTargetRatios(token_ratios : [Nat]) : [Float] {
            let total_ratio = Float.fromInt(token_ratios[0] + token_ratios[1]);
            
 
            
            let target_ratio_A = Float.fromInt(token_ratios[0]) / total_ratio;
            let target_ratio_B = Float.fromInt(token_ratios[1]) / total_ratio;
            return [target_ratio_A, target_ratio_B];
        };

        public func create(id : T.NodeId, req : T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            // Validate that we have two different tokens
            if (req.ledgers[0] == req.ledgers[1]) return #err("Required different ledgers");
            
            // Validate parameters
            if (t.variables.token_ratios.size() != 2) return #err("Must provide exactly 2 token ratios");
            if (t.variables.token_ratios[0] == 0 and t.variables.token_ratios[1] == 0) return #err("At least one token ratio must be non-zero");
            if (t.variables.threshold_percent < 1.0) return #err("Threshold percentage must be at least 1%");
            if (t.variables.swap_amount_usd < 10) return #err("Swap amount must be at least 10 USD");
            if (t.variables.swap_amount_usd > 30) return #err("Swap amount must be at most 30 USD");
            if (t.variables.rebalance_interval_seconds < 20) return #err("Rebalance interval must be at least 20 seconds");
            if (t.variables.remove_interval_seconds < 30) return #err("Remove interval must be at least 30 seconds");
            
            // Validate that we can get prices for both tokens using the price_ledger_id
            let ledger_A = U.onlyICLedger(req.ledgers[0]);
            let ledger_B = U.onlyICLedger(req.ledgers[1]);
            
            let price_A_result = getTokenPriceUSD(ledger_A, t.variables.price_ledger_id);
            let price_B_result = getTokenPriceUSD(ledger_B, t.variables.price_ledger_id);
            
            switch (price_A_result) {
                case (null) return #err("Could not get price for token A using the provided price_ledger_id");
                case (_) {};
            };
            
            switch (price_B_result) {
                case (null) return #err("Could not get price for token B using the provided price_ledger_id");
                case (_) {};
            };
            
            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var token_ratios = t.variables.token_ratios;
                    var threshold_percent = t.variables.threshold_percent;
                    var swap_amount_usd = t.variables.swap_amount_usd;
                    var rebalance_interval_seconds = t.variables.rebalance_interval_seconds;
                    var remove_interval_seconds = t.variables.remove_interval_seconds;
                    var remove_amount_usd = t.variables.remove_amount_usd;
                    var price_ledger_id = t.variables.price_ledger_id;
                };
                internals = {
                    var last_run = 0;
                    var last_rebalance = 0;
                    var last_remove = 0;
                    var last_error = null;
                    var total_value_usd = 0.0;
                    var current_ratios = [0.0, 0.0];
                };
            };
            
            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func defaults() : I.CreateRequest {
            {
                init = {};
                variables = {
                    token_ratios = [8, 2]; // Default 80%/20% ratio
                    threshold_percent = 3.0; // Default 3% threshold
                    swap_amount_usd = 5; // Default $10 swap amount
                    rebalance_interval_seconds = 60; // Default 1 minute
                    remove_interval_seconds = 300; // Default 5 minutes
                    remove_amount_usd = 10; // Default $10 removal amount
                    price_ledger_id = Principal.fromText("cngnf-vqaaa-aaaar-qag4q-cai"); // Default USDT ledger
                };
            };
        };

        public func delete(id : T.NodeId) : T.Delete {
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");
            
            // Validate parameters
            if (m.token_ratios.size() != 2) return #err("Must provide exactly 2 token ratios");
            if (m.token_ratios[0] == 0 and m.token_ratios[1] == 0) return #err("At least one token ratio must be non-zero");
            if (m.threshold_percent < 1.0) return #err("Threshold percentage must be at least 1%");
            if (m.swap_amount_usd < 5) return #err("Swap amount must be at least 5 USD");
            if (m.swap_amount_usd > 40) return #err("Swap amount must be at most 40 USD");
            if (m.rebalance_interval_seconds < 20) return #err("Rebalance interval must be at least 20 seconds");
            if (m.remove_interval_seconds < 30) return #err("Remove interval must be at least 30 seconds");
            
            // Get the node to access its ledgers
            let ?vec = core.getNodeById(id) else return #err("Node not found in core");
            
            // Validate that we can get prices for both tokens using the new price_ledger_id
            let ledger_A = U.onlyICLedger(vec.ledgers[0]);
            let ledger_B = U.onlyICLedger(vec.ledgers[1]);
            
            let price_A_result = getTokenPriceUSD(ledger_A, m.price_ledger_id);
            let price_B_result = getTokenPriceUSD(ledger_B, m.price_ledger_id);
            
            switch (price_A_result) {
                case (null) return #err("Could not get price for token A using the provided price_ledger_id");
                case (_) {};
            };
            
            switch (price_B_result) {
                case (null) return #err("Could not get price for token B using the provided price_ledger_id");
                case (_) {};
            };
            
            t.variables.token_ratios := m.token_ratios;
            t.variables.threshold_percent := m.threshold_percent;
            t.variables.swap_amount_usd := m.swap_amount_usd;
            t.variables.rebalance_interval_seconds := m.rebalance_interval_seconds;
            t.variables.remove_interval_seconds := m.remove_interval_seconds;
            t.variables.remove_amount_usd := m.remove_amount_usd;
            t.variables.price_ledger_id := m.price_ledger_id;
            
            #ok();
        };

        public func get(id : T.NodeId, _vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");
            
            #ok {
                init = t.init;
                variables = {
                    token_ratios = t.variables.token_ratios;
                    threshold_percent = t.variables.threshold_percent;
                    swap_amount_usd = t.variables.swap_amount_usd;
                    rebalance_interval_seconds = t.variables.rebalance_interval_seconds;
                    remove_interval_seconds = t.variables.remove_interval_seconds;
                    remove_amount_usd = t.variables.remove_amount_usd;
                    price_ledger_id = t.variables.price_ledger_id;
                };
                internals = {
                    last_run = t.internals.last_run;
                    last_rebalance = t.internals.last_rebalance;
                    last_remove = t.internals.last_remove;
                    total_value_usd = t.internals.total_value_usd;
                    current_ratios = t.internals.current_ratios;
                    last_error = t.internals.last_error;
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, ""), (1, "")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [(0, "Remove A"), (1, "Remove B")];
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
                
                // Check if it's time to remove tokens
                let remove_interval_ns : Nat64 = parm.variables.remove_interval_seconds * 1_000_000_000;
                if (parm.internals.last_remove + remove_interval_ns <= now and parm.variables.remove_amount_usd > 0) {
                    switch (Run.remove(vid, vec, parm)) {
                        case (#err(e)) {
                            parm.internals.last_error := ?e;
                            if (DEBUG) U.log("Err in balancer remove: " # e);
                        };
                        case (#ok) {
                            parm.internals.last_remove := now;
                            if (Option.isSome(parm.internals.last_error)) parm.internals.last_error := null;
                        };
                        case (#skip) ();
                    };
                };
                
                // Check if it's time to rebalance
                let rebalance_interval_ns : Nat64 = parm.variables.rebalance_interval_seconds * 1_000_000_000;
                if (parm.internals.last_rebalance + rebalance_interval_ns <= now) {
                    switch (Run.rebalance(vid, vec, parm)) {
                        case (#err(e)) {
                            parm.internals.last_error := ?e;
                            if (DEBUG) U.log("Err in balancer rebalance: " # e);
                        };
                        case (#ok) {
                            parm.internals.last_rebalance := now;
                            if (Option.isSome(parm.internals.last_error)) parm.internals.last_error := null;
                        };
                        case (#skip) ();
                    };
                };
            };
        };

        // Helper function to get token price in USD using the price ledger from node memory
        private func getTokenPriceUSD(token_ledger : Principal, price_ledger_id : Principal) : ?Float {
            if (token_ledger == price_ledger_id) {
                return ?1.0; // Price ledger is worth $1
            };
            
            // Direct approach for getting price
            let ?price = swap.Price.get(token_ledger, price_ledger_id, 0) else return null;
            
            // Return adjusted price
            let decimal_adjustment = swap.calculateDecimalAdjustment(token_ledger, price_ledger_id);
            return ?(price * decimal_adjustment);
        };

        // Helper function to convert raw balance to decimal-adjusted balance
        private func adjustBalanceForDecimals(balance : Nat, source : Core.SourceReq) : Float {
            let decimals = core.Source.decimals(source);
            let divisor = Float.pow(10, Float.fromInt(decimals));
            return Float.fromInt(balance) / divisor;
        };

        module Run {
            type RunResult = {
                #ok;
                #skip;
                #err : Text;
            };

            // Function to rebalance tokens based on their USD values
            public func rebalance(vid : T.NodeId, vec : T.NodeCoreMem, bal : VM.NodeMem) : RunResult {
                // Get token information
                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);
                
                // Get source accounts
                let ?source_A = core.getSource(vid, vec, 0) else return #err("No source for token A");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("No source for token B");
                
                // Get source account details
                let ?source_account_A = core.Source.getAccount(source_A) else return #err("No source account A");
                let ?source_account_B = core.Source.getAccount(source_B) else return #err("No source account B");
                
                // Get token balances
                let balance_A = core.Source.balance(source_A);
                let balance_B = core.Source.balance(source_B);
                
                let fee_A = core.Source.fee(source_A);
                let fee_B = core.Source.fee(source_B);
                // Skip if both balances are zero
                if (balance_A < 100 * fee_A and balance_B < 100 * fee_B) return #skip;
                
                // Get token prices in USD
                let ?price_A_usd = getTokenPriceUSD(ledger_A, bal.variables.price_ledger_id) else return #err("Could not get USD price for token A");
                let ?price_B_usd = getTokenPriceUSD(ledger_B, bal.variables.price_ledger_id) else return #err("Could not get USD price for token B");
                
                // Calculate token values in USD
                let adjusted_balance_A = adjustBalanceForDecimals(balance_A, source_A);
                let adjusted_balance_B = adjustBalanceForDecimals(balance_B, source_B);
                let value_A_usd = adjusted_balance_A * price_A_usd;
                let value_B_usd = adjusted_balance_B * price_B_usd;
                let total_value_usd = value_A_usd + value_B_usd;
                
                // Skip if total value is too small
                if (total_value_usd < 1.0) return #skip;
                
                // Calculate current ratio
                let current_ratio_A = if (total_value_usd == 0.0) 0.0 else value_A_usd / total_value_usd;
                let current_ratio_B = 1.0 - current_ratio_A;
                
                // Update internals
                bal.internals.total_value_usd := total_value_usd;
                bal.internals.current_ratios := [current_ratio_A, current_ratio_B];
                
                // Calculate target ratio
                let target_ratios = calculateTargetRatios(bal.variables.token_ratios);
                let target_ratio_A = target_ratios[0];
                
                // Calculate difference from target
                let diff_percent = Float.abs((current_ratio_A - target_ratio_A) / target_ratio_A) * 100.0;
                
                // Skip if difference is below threshold
                if (diff_percent < bal.variables.threshold_percent) return #skip;
                
                // Determine which token to sell
                let is_selling_A = current_ratio_A > target_ratio_A;
                
                // Calculate imbalance amount
                let target_value_A = total_value_usd * target_ratio_A;
                let imbalance_usd = Float.abs(value_A_usd - target_value_A);
                
                // Get configured swap amount
                let max_swap_usd = Float.fromInt(bal.variables.swap_amount_usd);
                
                // Skip if imbalance is too small
                if (imbalance_usd < max_swap_usd) return #skip;
                
                // Cap swap amount at configured maximum
                let swap_amount_usd = max_swap_usd;
                
                // Calculate token amount to swap
                let (from_ledger, to_ledger, from_source, to_account, amount_to_swap) = if (is_selling_A) {
                    // Sell token A
                    let amount = if (price_A_usd == 0.0) 0 else 
                        Nat.max(1, Int.abs(Float.toInt(
                            (swap_amount_usd / price_A_usd) * Float.pow(10, Float.fromInt(core.Source.decimals(source_A)))
                        )));
                    (ledger_A, ledger_B, source_A, source_account_B, amount)
                } else {
                    // Sell token B
                    let amount = if (price_B_usd == 0.0) 0 else 
                        Nat.max(1, Int.abs(Float.toInt(
                            (swap_amount_usd / price_B_usd) * Float.pow(10, Float.fromInt(core.Source.decimals(source_B)))
                        )));
                    (ledger_B, ledger_A, source_B, source_account_A, amount)
                };
                
                // Skip if amount is too small
                if (amount_to_swap == 0) return #skip;
                
                // Check if we have enough balance
                if (core.Source.balance(from_source) < amount_to_swap) return #skip;
                
                // Get source account
                let ?from_account = core.Source.getAccount(from_source) else return #err("No source account");
                
                // Check if amount exceeds minimum fee requirement
                let ledger_fee = core.Source.fee(from_source);
                if (amount_to_swap < 200 * ledger_fee) return #skip;
                
                // Create swap intent
                let intent = swap.Intent.get(
                    from_account, 
                    to_account,
                    from_ledger, 
                    to_ledger, 
                    amount_to_swap, 
                    false
                );
                
                // Execute swap
                return U.performance("Balancer SWAP", func() : R<(), Text> { 
                    switch (intent) {
                        case (#err(e)) #err(e);
                        case (#ok(intent)) {
                            swap.Intent.commit(intent);
                            #ok;
                        };
                    };
                });
            };

            // Function to remove tokens and send to destinations
            public func remove(vid : T.NodeId, vec : T.NodeCoreMem, bal : VM.NodeMem) : RunResult {
                // Get token information
                let ledger_A = U.onlyICLedger(vec.ledgers[0]);
                let ledger_B = U.onlyICLedger(vec.ledgers[1]);
                
                // Get source accounts
                let ?source_A = core.getSource(vid, vec, 0) else return #err("No source for token A");
                let ?source_B = core.getSource(vid, vec, 1) else return #err("No source for token B");
                
                // Get destination accounts
                let ?_destination_A = core.getDestinationAccountIC(vec, 0) else return #err("No destination for token A");
                let ?_destination_B = core.getDestinationAccountIC(vec, 1) else return #err("No destination for token B");
                
                // Get token balances directly from sources
                let balance_A = core.Source.balance(source_A);
                let balance_B = core.Source.balance(source_B);
                
                // Skip if either balance is zero
                if (balance_A == 0 or balance_B == 0) return #skip;
                
                // Get token prices in USD using the price_ledger_id from node memory
                let ?price_A_usd = getTokenPriceUSD(ledger_A, bal.variables.price_ledger_id) else return #err("Could not get USD price for token A");
                let ?price_B_usd = getTokenPriceUSD(ledger_B, bal.variables.price_ledger_id) else return #err("Could not get USD price for token B");
                
                // Calculate token values in USD, adjusting for decimals
                let adjusted_balance_A = adjustBalanceForDecimals(balance_A, source_A);
                let adjusted_balance_B = adjustBalanceForDecimals(balance_B, source_B);
                
                let value_A_usd = adjusted_balance_A * price_A_usd;
                let value_B_usd = adjusted_balance_B * price_B_usd;
                let total_value_usd = value_A_usd + value_B_usd;
                
                // Calculate current ratios - guard against division by zero
                let current_ratio_A = if (total_value_usd == 0.0) 0.0 else value_A_usd / total_value_usd;
                let current_ratio_B = if (total_value_usd == 0.0) 0.0 else value_B_usd / total_value_usd;
                
                // Update internals
                bal.internals.total_value_usd := total_value_usd;
                bal.internals.current_ratios := [current_ratio_A, current_ratio_B];
                
                // Get minimum ledger fees
                let fee_A = core.Source.fee(source_A);
                let fee_B = core.Source.fee(source_B);
                
                // Calculate the target ratios from token_ratios
                let target_ratios = calculateTargetRatios(bal.variables.token_ratios);
                let target_ratio_A = target_ratios[0];
                let target_ratio_B = target_ratios[1];
                
                // Calculate the total USD amount to remove
                let total_remove_usd_amount = Float.fromInt(bal.variables.remove_amount_usd);
                
                // Calculate how much USD value to remove from each token according to the target ratios
                let remove_usd_A = total_remove_usd_amount * target_ratio_A;
                let remove_usd_B = total_remove_usd_amount * target_ratio_B;
                
                // Calculate how many tokens of each type to remove, accounting for decimals
                let decimals_A = core.Source.decimals(source_A);
                let decimals_B = core.Source.decimals(source_B);
                
                // Guard against division by zero in price calculations
                let amount_A_needed = if (price_A_usd == 0.0) 0 else Nat.max(0, Int.abs(Float.toInt(
                    (remove_usd_A / price_A_usd) * Float.pow(10, Float.fromInt(decimals_A))
                )));
                
                let amount_B_needed = if (price_B_usd == 0.0) 0 else Nat.max(0, Int.abs(Float.toInt(
                    (remove_usd_B / price_B_usd) * Float.pow(10, Float.fromInt(decimals_B))
                )));
                
                // Check if we have enough of both tokens
                let has_enough_A = balance_A >= amount_A_needed and amount_A_needed >= 2 * fee_A;
                let has_enough_B = balance_B >= amount_B_needed and amount_B_needed >= 2 * fee_B;
                
                // Only proceed if we have enough of both tokens
                if (not (has_enough_A and has_enough_B)) {
                    if (DEBUG) U.log("Skipping removal: Not enough tokens available. " # 
                        "A: " # debug_show(balance_A) # " of " # debug_show(amount_A_needed) # " needed, " #
                        "B: " # debug_show(balance_B) # " of " # debug_show(amount_B_needed) # " needed");
                    return #skip;
                };
                
                // Transfer token A
                let #ok(intentA) = core.Source.Send.intent(
                    source_A, 
                    #destination({ port = 0 }), 
                    amount_A_needed
                ) else return #err("Failed to create transfer intent for token A");
                
                ignore core.Source.Send.commit(intentA);
                
                // Transfer token B
                let #ok(intentB) = core.Source.Send.intent(
                    source_B, 
                    #destination({ port = 1 }), 
                    amount_B_needed
                ) else return #err("Failed to create transfer intent for token B");
                
                ignore core.Source.Send.commit(intentB);
                
                if (DEBUG) U.log("Removed " # debug_show(amount_A_needed) # " of token A and " # 
                    debug_show(amount_B_needed) # " of token B (approx. $" # 
                    debug_show(Float.toInt(remove_usd_A)) # " and $" # 
                    debug_show(Float.toInt(remove_usd_B)) # " worth, according to ratio " # 
                    debug_show(bal.variables.token_ratios) # ")");
                
                #ok;
            };
        };
    };
}; 