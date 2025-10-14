module {

    public type CreateRequest = {
        init : {
            pool_id : Nat32;
        };
        variables : {
            grid_spacing : Float;
            position_size : Nat64;
            num_grid_levels : Nat8;
            center_price : ?Float;
            auto_rebalance : Bool;
            max_slippage : Float;
            check_interval_sec : Nat64;
        };
    };

    public type ModifyRequest = {
        grid_spacing : ?Float;
        position_size : ?Nat64;
        num_grid_levels : ?Nat8;
        center_price : ?Float;
        auto_rebalance : ?Bool;
        max_slippage : ?Float;
        check_interval_sec : ?Nat64;
    };

    public type GridLevel = {
        price : Float;
        amount : Nat64;
        is_buy_order : Bool;
        is_filled : Bool;
        filled_at : ?Nat64;
    };

    public type Shared = {
        init : {
            pool_id : Nat32;
        };
        variables : {
            grid_spacing : Float;
            position_size : Nat64;
            num_grid_levels : Nat8;
            center_price : ?Float;
            auto_rebalance : Bool;
            max_slippage : Float;
            check_interval_sec : Nat64;
        };
        internals : {
            current_center_price : Float;
            grid_levels : [GridLevel];
            total_buy_orders : Nat8;
            total_sell_orders : Nat8;
            last_check_ts : Nat64;
            next_check_ts : Nat64;
            total_profit : Float;
            orders_executed : Nat32;
            grid_initialized : Bool;
            last_error : ?Text;
        };
    };

};