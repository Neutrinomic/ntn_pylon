import Billing "../../billing_all";
import MU "mo:mosup";
import Ver1 "./memory/v1";
import Map "mo:map/Map";
import Core "mo:devefi/core";
import I "./interface";
import U "mo:devefi/utils";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import Option "mo:base/Option";
import Swap "mo:devefi_swap";

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

    public let ID = "grid_trader";

    public class Mod({
        xmem : MU.MemShell<VM.Mem>;
        core : Core.Mod;
        swap : Swap.Mod;
    }) : T.Class<I.CreateRequest, I.ModifyRequest, I.Shared> {

        let mem = MU.access(xmem);
        let DEBUG = false;

        public func meta() : T.Meta = {
            id = ID;
            name = "Grid Trader";
            author = "Neutrinite";
            description = "Automated grid trading strategy that places buy/sell orders at regular price intervals to profit from price oscillations in ranging markets.";
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
            temporary_allowed = false;
        };

        func validate_min_amount(amount : Nat64) : Result.Result<(), Text> {
            if (amount < 1_000_000) {
                #err("Amount must be at least 1,000,000")
            } else {
                #ok()
            }
        };

        func validate_grid_spacing(spacing : Float) : Result.Result<(), Text> {
            if (spacing <= 0.0 or spacing > 1.0) {
                #err("Grid spacing must be between 0.0 and 1.0 (0% to 100%)")
            } else {
                #ok()
            }
        };

        func validate_num_levels(levels : Nat8) : Result.Result<(), Text> {
            if (levels < 2 or levels > 50) {
                #err("Number of grid levels must be between 2 and 50")
            } else {
                #ok()
            }
        };

        func validate_slippage(slippage : Float) : Result.Result<(), Text> {
            if (slippage < 0.0 or slippage > 0.5) {
                #err("Max slippage must be between 0.0 and 0.5 (0% to 50%)")
            } else {
                #ok()
            }
        };

        public func create(id : T.NodeId, req : T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            if (req.ledgers[0] == req.ledgers[1]) return #err("Required different ledgers");
            
            switch(validate_min_amount(t.variables.position_size)) {
                case (#err(x)) return #err(x);
                case _ {};
            };

            switch(validate_grid_spacing(t.variables.grid_spacing)) {
                case (#err(x)) return #err(x);
                case _ {};
            };

            switch(validate_num_levels(t.variables.num_grid_levels)) {
                case (#err(x)) return #err(x);
                case _ {};
            };

            switch(validate_slippage(t.variables.max_slippage)) {
                case (#err(x)) return #err(x);
                case _ {};
            };

            if (t.variables.check_interval_sec < 60) {
                return #err("Check interval must be at least 60 seconds");
            };
            let now = U.now();

            // Initialize empty grid levels array
            let empty_grid_levels = Array.init<VM.GridLevel>(Nat8.toNat(t.variables.num_grid_levels), {
                price = 0.0;
                amount = 0;
                is_buy_order = false;
                is_filled = false;
                filled_at = null;
            });

            let obj : VM.NodeMem = {
                init = t.init;
                variables = {
                    var grid_spacing = t.variables.grid_spacing;
                    var position_size = t.variables.position_size;
                    var num_grid_levels = t.variables.num_grid_levels;
                    var center_price = t.variables.center_price;
                    var auto_rebalance = t.variables.auto_rebalance;
                    var max_slippage = t.variables.max_slippage;
                    var check_interval_sec = t.variables.check_interval_sec;
                };
                internals = {
                    var current_center_price = 0.0;
                    var grid_levels = empty_grid_levels;
                    var total_buy_orders = 0;
                    var total_sell_orders = 0;
                    var last_check_ts = now;
                    var next_check_ts = now + (t.variables.check_interval_sec * 1_000_000_000);
                    var total_profit = 0.0;
                    var orders_executed = 0;
                    var grid_initialized = false;
                    var last_error = null;
                };
            };

            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func delete(id : T.NodeId) : T.Delete {
            switch(Map.remove(mem.main, Map.n32hash, id)) {
                case null { #err("Not found") };
                case (?_x) { #ok() };
            };
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            switch(m.grid_spacing) {
                case (?spacing) {
                    switch(validate_grid_spacing(spacing)) {
                        case (#err(x)) return #err(x);
                        case _ { t.variables.grid_spacing := spacing; };
                    };
                };
                case null {};
            };

            switch(m.position_size) {
                case (?size) {
                    switch(validate_min_amount(size)) {
                        case (#err(x)) return #err(x);
                        case _ { t.variables.position_size := size; };
                    };
                };
                case null {};
            };

            switch(m.num_grid_levels) {
                case (?levels) {
                    switch(validate_num_levels(levels)) {
                        case (#err(x)) return #err(x);
                        case _ { 
                            t.variables.num_grid_levels := levels;
                            t.internals.grid_initialized := false; // Force grid rebuild
                        };
                    };
                };
                case null {};
            };

            switch(m.center_price) {
                case (?price) { t.variables.center_price := ?price; };
                case null {};
            };

            switch(m.auto_rebalance) {
                case (?rebalance) { t.variables.auto_rebalance := rebalance; };
                case null {};
            };

            switch(m.max_slippage) {
                case (?slippage) {
                    switch(validate_slippage(slippage)) {
                        case (#err(x)) return #err(x);
                        case _ { t.variables.max_slippage := slippage; };
                    };
                };
                case null {};
            };

            switch(m.check_interval_sec) {
                case (?interval) {
                    if (interval < 60) {
                        return #err("Check interval must be at least 60 seconds");
                    };
                    t.variables.check_interval_sec := interval;
                };
                case null {};
            };

            #ok();
        };

        public func get(id : T.NodeId, _vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            // Convert mutable array to immutable array
            let grid_levels_immutable = Array.map<VM.GridLevel, I.GridLevel>(
                Array.freeze(t.internals.grid_levels),
                func(level: VM.GridLevel) : I.GridLevel {
                    {
                        price = level.price;
                        amount = level.amount;
                        is_buy_order = level.is_buy_order;
                        is_filled = level.is_filled;
                        filled_at = level.filled_at;
                    }
                }
            );

            #ok({
                init = t.init;
                variables = {
                    grid_spacing = t.variables.grid_spacing;
                    position_size = t.variables.position_size;
                    num_grid_levels = t.variables.num_grid_levels;
                    center_price = t.variables.center_price;
                    auto_rebalance = t.variables.auto_rebalance;
                    max_slippage = t.variables.max_slippage;
                    check_interval_sec = t.variables.check_interval_sec;
                };
                internals = {
                    current_center_price = t.internals.current_center_price;
                    grid_levels = grid_levels_immutable;
                    total_buy_orders = t.internals.total_buy_orders;
                    total_sell_orders = t.internals.total_sell_orders;
                    last_check_ts = t.internals.last_check_ts;
                    next_check_ts = t.internals.next_check_ts;
                    total_profit = t.internals.total_profit;
                    orders_executed = t.internals.orders_executed;
                    grid_initialized = t.internals.grid_initialized;
                    last_error = t.internals.last_error;
                };
            });
        };

        public func defaults() : I.CreateRequest = {
            init = {
                pool_id = 0;
            };
            variables = {
                grid_spacing = 0.02; // 2% spacing between grid levels
                position_size = 10_000_000; // 10 tokens default
                num_grid_levels = 10; // 10 grid levels total
                center_price = null; // Auto-detect from current market price
                auto_rebalance = true; // Automatically rebalance grid when orders fill
                max_slippage = 0.01; // 1% maximum slippage
                check_interval_sec = 300; // Check every 5 minutes
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [
                (0, "TokenA"),
                (1, "TokenB"),
            ];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            [
                (0, "TokenA"),
                (1, "TokenB"),
            ];
        };

        let RUN_ONCE_EVERY : Nat64 = 6 * 1_000_000_000; // 6 seconds in nanoseconds

        public func run() : () {
            let now = U.now();
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;
                
                // Skip if there was an error and not enough time has passed
                if (Option.isSome(parm.internals.last_error) and (parm.internals.last_check_ts + (RUN_ONCE_EVERY*5)) > now) continue vec_loop;
                
                // Check if it's time to run
                if (now < parm.internals.next_check_ts) continue vec_loop;
                
                parm.internals.last_check_ts := now;
                parm.internals.next_check_ts := now + (parm.variables.check_interval_sec * 1_000_000_000);
                
                switch (Run.single(vid, vec, parm)) {
                    case (#err(e)) {
                        parm.internals.last_error := ?e;
                        if (DEBUG) U.log("Err in grid_trader: " # e);
                    };
                    case (#ok) {
                        if (Option.isSome(parm.internals.last_error)) parm.internals.last_error := null;
                    };
                };
            };
        };

        module Run {
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, th : VM.NodeMem) : R<(), Text> {
                if (vec.ledgers.size() < 2) return #err("Two ledgers required");
                
                // Initialize grid if not done yet
                if (not th.internals.grid_initialized) {
                    switch(initialize_grid(vid, vec, th)) {
                        case (#err(e)) return #err(e);
                        case (#ok) {};
                    };
                };
                
                // Execute grid trading logic
                execute_grid_orders(vid, vec, th);
                
                #ok;
            };

            func initialize_grid(vid : T.NodeId, vec : T.NodeCoreMem, th : VM.NodeMem) : R<(), Text> {
                // Get current market price from swap
                let ?current_price = swap.Price.get(U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), Nat8.fromNat(Nat32.toNat(th.init.pool_id))) else return #err("Cannot get market price");
                
                let levels = Nat8.toNat(th.variables.num_grid_levels);
                let center = switch(th.variables.center_price) {
                    case (?price) price;
                    case null current_price;
                };

                let spacing = th.variables.grid_spacing;
                let half_levels = levels / 2;

                // Create new grid levels array
                let new_grid = Array.init<VM.GridLevel>(levels, {
                    price = 0.0;
                    amount = 0;
                    is_buy_order = false;
                    is_filled = false;
                    filled_at = null;
                });

                var buy_orders = 0 : Nat8;
                var sell_orders = 0 : Nat8;

                // Initialize grid levels
                for (i in Array.keys(Array.freeze(new_grid))) {
                    let level_offset = Int.abs(i - half_levels);
                    let price_multiplier = if (i < half_levels) {
                        1.0 - (Float.fromInt(level_offset) * spacing)
                    } else {
                        1.0 + (Float.fromInt(level_offset) * spacing)
                    };

                    let level_price = center * price_multiplier;
                    let is_buy = i < half_levels;

                    new_grid[i] := {
                        price = level_price;
                        amount = th.variables.position_size;
                        is_buy_order = is_buy;
                        is_filled = false;
                        filled_at = null;
                    };

                    if (is_buy) {
                        buy_orders += 1;
                    } else {
                        sell_orders += 1;
                    };
                };

                th.internals.grid_levels := new_grid;
                th.internals.total_buy_orders := buy_orders;
                th.internals.total_sell_orders := sell_orders;
                th.internals.current_center_price := center;
                th.internals.grid_initialized := true;

                if (DEBUG) {
                    U.log("Grid initialized with " # Nat8.toText(buy_orders) # " buy orders and " # Nat8.toText(sell_orders) # " sell orders at center price " # Float.toText(center));
                };
                
                #ok;
            };

            func execute_grid_orders(vid : T.NodeId, vec : T.NodeCoreMem, th : VM.NodeMem) : () {
                // Get current market price
                let ?current_price = swap.Price.get(U.onlyICLedger(vec.ledgers[0]), U.onlyICLedger(vec.ledgers[1]), Nat8.fromNat(Nat32.toNat(th.init.pool_id))) else return;

                // Check for orders that should be executed
                let grid_levels = th.internals.grid_levels;
                for (i in Array.keys(Array.freeze(grid_levels))) {
                    let level = grid_levels[i];
                    
                    if (not level.is_filled) {
                        let should_execute = if (level.is_buy_order) {
                            current_price <= level.price // Execute buy order when price drops to level
                        } else {
                            current_price >= level.price // Execute sell order when price rises to level
                        };

                        if (should_execute) {
                            // Execute the order
                            let success = execute_order(vid, vec, th, level, i);
                            if (success) {
                                th.internals.orders_executed += 1;
                                
                                // Mark as filled
                                let updated_level = {
                                    price = level.price;
                                    amount = level.amount;
                                    is_buy_order = level.is_buy_order;
                                    is_filled = true;
                                    filled_at = ?U.now();
                                };
                                grid_levels[i] := updated_level;

                                if (DEBUG) {
                                    let orderType = if (level.is_buy_order) "buy" else "sell";
                                    U.log("Executed " # orderType # " order at price " # Float.toText(level.price));
                                };
                            };
                        };
                    };
                };

                // Auto-rebalance if enabled and orders have been filled
                if (th.variables.auto_rebalance) {
                    rebalance_grid(vid, vec, th, current_price);
                };
            };

            func execute_order(vid : T.NodeId, vec : T.NodeCoreMem, th : VM.NodeMem, level : VM.GridLevel, _level_index : Nat) : Bool {
                if (level.is_buy_order) {
                    // Execute buy order: swap TokenB for TokenA
                    let ?source_b = core.getSource(vid, vec, 1) else return false; // TokenB source
                    let balance_b = core.Source.balance(source_b);
                    
                    if (Nat64.fromNat(balance_b) >= level.amount) {
                        // Create swap transaction
                        let #ok(intent) = core.Source.Send.intent(source_b, #destination({ port = 0 }), Nat64.toNat(level.amount), null) else return false;
                        ignore core.Source.Send.commit(intent);
                        th.internals.total_profit += Float.fromInt64(Int64.fromNat64(level.amount)) * 0.001; // Estimate profit
                        return true;
                    };
                } else {
                    // Execute sell order: swap TokenA for TokenB  
                    let ?source_a = core.getSource(vid, vec, 0) else return false; // TokenA source
                    let balance_a = core.Source.balance(source_a);
                    
                    if (Nat64.fromNat(balance_a) >= level.amount) {
                        // Create swap transaction
                        let #ok(intent) = core.Source.Send.intent(source_a, #destination({ port = 1 }), Nat64.toNat(level.amount), null) else return false;
                        ignore core.Source.Send.commit(intent);
                        th.internals.total_profit += Float.fromInt64(Int64.fromNat64(level.amount)) * 0.001; // Estimate profit
                        return true;
                    };
                };
                false;
            };

            func rebalance_grid(_vid : T.NodeId, _vec : T.NodeCoreMem, th : VM.NodeMem, current_price : Float) : () {
                // Check if significant price movement warrants rebalancing
                let price_change = Float.abs(current_price - th.internals.current_center_price) / th.internals.current_center_price;
                
                if (price_change > th.variables.grid_spacing * 2.0) {
                    // Reset grid initialization to force rebuild
                    th.internals.grid_initialized := false;
                    
                    if (DEBUG) {
                        U.log("Grid rebalanced around new center price: " # Float.toText(current_price));
                    };
                };
            };
        };
    };
};