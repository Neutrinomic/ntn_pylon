import Map "mo:map/Map";
import MU "mo:mosup";

module {

    public type Mem = {
        main : Map.Map<Nat32, NodeMem>;
    };

    public func new() : MU.MemShell<Mem> = MU.new<Mem>({
        main = Map.new<Nat32, NodeMem>();
    });

    public type GridLevel = {
        price : Float;
        amount : Nat64;
        is_buy_order : Bool;
        is_filled : Bool;
        filled_at : ?Nat64;
    };

    public type NodeMem = {
        init : {
            pool_id : Nat32;
        };
        variables : {
            var grid_spacing : Float;
            var position_size : Nat64;
            var num_grid_levels : Nat8;
            var center_price : ?Float;
            var auto_rebalance : Bool;
            var max_slippage : Float;
            var check_interval_sec : Nat64;
        };
        internals : {
            var current_center_price : Float;
            var grid_levels : [var GridLevel];
            var total_buy_orders : Nat8;
            var total_sell_orders : Nat8;
            var last_check_ts : Nat64;
            var next_check_ts : Nat64;
            var total_profit : Float;
            var orders_executed : Nat32;
            var grid_initialized : Bool;
            var last_error : ?Text;
        };
    };

};