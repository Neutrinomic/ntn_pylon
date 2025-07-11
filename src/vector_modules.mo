import ICRC55 "mo:devefi/ICRC55";
import Core "mo:devefi/core";
import ThrottleVector "./modules/throttle/throttle";
import SwitcherVector "./modules/switcher/switcher";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
// import Lend "./modules/lend/lend";
// import Borrow "./modules/borrow/borrow";
import Exchange "./modules/exchange/exchange";
// import Escrow "./modules/escrow/escrow";
import Split "./modules/split/split";
import ExchangeLiquidity "./modules/exchange_liquidity/exchange_liquidity";
import AutoLiquidity "./modules/auto_liquidity/auto_liquidity";
import Vault "./modules/vault/vault";
import Balancer "./modules/balancer/balancer";

// THIS SHOULD BE AUTO-GENERATED FILE

module {

    public type CreateRequest = {
        #throttle : ThrottleVector.Interface.CreateRequest;
        #switcher : SwitcherVector.Interface.CreateRequest;
        // #lend: Lend.Interface.CreateRequest;
        // #borrow: Borrow.Interface.CreateRequest;
        #exchange: Exchange.Interface.CreateRequest;
        // #escrow: Escrow.Interface.CreateRequest;
        #split: Split.Interface.CreateRequest;
        #exchange_liquidity: ExchangeLiquidity.Interface.CreateRequest;
        #auto_liquidity: AutoLiquidity.Interface.CreateRequest;
        #vault: Vault.Interface.CreateRequest;
        #balancer: Balancer.Interface.CreateRequest;
        //...
    };

    public type Shared = {
        #throttle : ThrottleVector.Interface.Shared;
        #switcher : SwitcherVector.Interface.Shared;
        // #lend: Lend.Interface.Shared;
        // #borrow: Borrow.Interface.Shared;
        #exchange: Exchange.Interface.Shared;
        // #escrow: Escrow.Interface.Shared;
        #split: Split.Interface.Shared;
        #exchange_liquidity: ExchangeLiquidity.Interface.Shared;
        #auto_liquidity: AutoLiquidity.Interface.Shared;
        #vault: Vault.Interface.Shared;
        #balancer: Balancer.Interface.Shared;
        //...
    };
    
    public type ModifyRequest = {
        #throttle : ThrottleVector.Interface.ModifyRequest;
        #switcher : SwitcherVector.Interface.ModifyRequest;
        // #lend: Lend.Interface.ModifyRequest;
        // #borrow: Borrow.Interface.ModifyRequest;
        #exchange: Exchange.Interface.ModifyRequest;
        // #escrow: Escrow.Interface.ModifyRequest;
        #split: Split.Interface.ModifyRequest;
        #exchange_liquidity: ExchangeLiquidity.Interface.ModifyRequest;
        #auto_liquidity: AutoLiquidity.Interface.ModifyRequest;
        #vault: Vault.Interface.ModifyRequest;
        #balancer: Balancer.Interface.ModifyRequest;
        //...
    };


    public class VectorModules(m: {
        vec_throttle : ThrottleVector.Mod;
        vec_switcher : SwitcherVector.Mod;
        // vec_lend : Lend.Mod;
        // vec_borrow : Borrow.Mod;
        vec_exchange : Exchange.Mod;
        // vec_escrow : Escrow.Mod;
        vec_split : Split.Mod;
        vec_exchange_liquidity : ExchangeLiquidity.Mod;
        vec_auto_liquidity : AutoLiquidity.Mod;
        vec_vault : Vault.Mod;
        vec_balancer : Balancer.Mod;
    }) {
    
        public func get(mid :Core.ModuleId, id : Core.NodeId, vec:Core.NodeMem) : Result.Result<Shared, Text> {
            
            if (mid == ThrottleVector.ID) {
                switch(m.vec_throttle.get(id, vec)) {
                    case (#ok(x)) return #ok(#throttle(x));
                    case (#err(x)) return #err(x);
                }
            };
            if (mid == SwitcherVector.ID) {
                switch(m.vec_switcher.get(id, vec)) {
                    case (#ok(x)) return #ok(#switcher(x));
                    case (#err(x)) return #err(x);
                }
            };
            // if (mid == Lend.ID) {
            //     switch(m.vec_lend.get(id, vec)) {
            //         case (#ok(x)) return #ok(#lend(x));
            //         case (#err(x)) return #err(x);
            //     }
            // };
            // if (mid == Borrow.ID) {
            //     switch(m.vec_borrow.get(id, vec)) {
            //         case (#ok(x)) return #ok(#borrow(x));
            //         case (#err(x)) return #err(x);
            //     }
            // };
            if (mid == Exchange.ID) {
                switch(m.vec_exchange.get(id, vec)) {
                    case (#ok(x)) return #ok(#exchange(x));
                    case (#err(x)) return #err(x);
                }
            };
            // if (mid == Escrow.ID) {
            //     switch(m.vec_escrow.get(id, vec)) {
            //         case (#ok(x)) return #ok(#escrow(x));
            //         case (#err(x)) return #err(x);
            //     }
            // };
            if (mid == Split.ID) {
                switch(m.vec_split.get(id, vec)) {
                    case (#ok(x)) return #ok(#split(x));
                    case (#err(x)) return #err(x);
                }
            };
            if (mid == ExchangeLiquidity.ID) {
                switch(m.vec_exchange_liquidity.get(id, vec)) {
                    case (#ok(x)) return #ok(#exchange_liquidity(x));
                    case (#err(x)) return #err(x);
                }
            };
            if (mid == AutoLiquidity.ID) {
                switch(m.vec_auto_liquidity.get(id, vec)) {
                    case (#ok(x)) return #ok(#auto_liquidity(x));
                    case (#err(x)) return #err(x);
                }
            };
            if (mid == Vault.ID) {
                switch(m.vec_vault.get(id, vec)) {
                    case (#ok(x)) return #ok(#vault(x));
                    case (#err(x)) return #err(x);
                }
            };
            if (mid == Balancer.ID) {
                switch(m.vec_balancer.get(id, vec)) {
                    case (#ok(x)) return #ok(#balancer(x));
                    case (#err(x)) return #err(x);
                }
            };

            #err("Unknown variant");
        };

        public func getDefaults(mid:Core.ModuleId) : CreateRequest {
            if (mid == ThrottleVector.ID) return #throttle(m.vec_throttle.defaults());
            if (mid == SwitcherVector.ID) return #switcher(m.vec_switcher.defaults());
            // if (mid == Lend.ID) return #lend(m.vec_lend.defaults());
            // if (mid == Borrow.ID) return #borrow(m.vec_borrow.defaults());
            if (mid == Exchange.ID) return #exchange(m.vec_exchange.defaults());
            // if (mid == Escrow.ID) return #escrow(m.vec_escrow.defaults());
            if (mid == Split.ID) return #split(m.vec_split.defaults());
            if (mid == ExchangeLiquidity.ID) return #exchange_liquidity(m.vec_exchange_liquidity.defaults());
            if (mid == AutoLiquidity.ID) return #auto_liquidity(m.vec_auto_liquidity.defaults());
            if (mid == Vault.ID) return #vault(m.vec_vault.defaults());
            if (mid == Balancer.ID) return #balancer(m.vec_balancer.defaults());
            Debug.trap("Unknown variant");

        };


        public func sources(mid :Core.ModuleId, id : Core.NodeId) : Core.EndpointsDescription {
            if (mid == ThrottleVector.ID) return m.vec_throttle.sources(id);
            if (mid == SwitcherVector.ID) return m.vec_switcher.sources(id);
            // if (mid == Lend.ID) return m.vec_lend.sources(id);
            // if (mid == Borrow.ID) return m.vec_borrow.sources(id);
            if (mid == Exchange.ID) return m.vec_exchange.sources(id);
            // if (mid == Escrow.ID) return m.vec_escrow.sources(id);
            if (mid == Split.ID) return m.vec_split.sources(id);
            if (mid == ExchangeLiquidity.ID) return m.vec_exchange_liquidity.sources(id);
            if (mid == AutoLiquidity.ID) return m.vec_auto_liquidity.sources(id);
            if (mid == Vault.ID) return m.vec_vault.sources(id);
            if (mid == Balancer.ID) return m.vec_balancer.sources(id);
            Debug.trap("Unknown variant");
            
        };

        public func destinations(mid :Core.ModuleId, id : Core.NodeId) : Core.EndpointsDescription {
            if (mid == ThrottleVector.ID) return m.vec_throttle.destinations(id);
            if (mid == SwitcherVector.ID) return m.vec_switcher.destinations(id);
            // if (mid == Lend.ID) return m.vec_lend.destinations(id);
            // if (mid == Borrow.ID) return m.vec_borrow.destinations(id);
            if (mid == Exchange.ID) return m.vec_exchange.destinations(id);
            // if (mid == Escrow.ID) return m.vec_escrow.destinations(id);
            if (mid == Split.ID) return m.vec_split.destinations(id);
            if (mid == ExchangeLiquidity.ID) return m.vec_exchange_liquidity.destinations(id);
            if (mid == AutoLiquidity.ID) return m.vec_auto_liquidity.destinations(id);
            if (mid == Vault.ID) return m.vec_vault.destinations(id);
            if (mid == Balancer.ID) return m.vec_balancer.destinations(id);
            Debug.trap("Unknown variant");
        };



        public func create(id:Core.NodeId, creq:Core.CommonCreateRequest, req : CreateRequest) : Result.Result<Core.ModuleId, Text> {
            
            switch (req) {
                case (#throttle(t)) return m.vec_throttle.create(id, creq, t);
                case (#switcher(t)) return m.vec_switcher.create(id, creq, t);
                // case (#lend(t)) return m.vec_lend.create(id, creq, t);
                // case (#borrow(t)) return m.vec_borrow.create(id, creq, t);
                case (#exchange(t)) return m.vec_exchange.create(id, creq, t);
                // case (#escrow(t)) return m.vec_escrow.create(id, creq, t);
                case (#split(t)) return m.vec_split.create(id, creq, t);
                case (#exchange_liquidity(t)) return m.vec_exchange_liquidity.create(id, creq, t);
                case (#auto_liquidity(t)) return m.vec_auto_liquidity.create(id, creq, t);
                case (#vault(t)) return m.vec_vault.create(id, creq, t);
                case (#balancer(t)) return m.vec_balancer.create(id, creq, t);
                //...
            };
            #err("Unknown variant or mismatch.");
        };

        public func modify(mid :Core.ModuleId, id:Core.NodeId, creq : ModifyRequest) : Result.Result<(), Text> {
            switch (creq) {
                case (#throttle(r)) if (mid == ThrottleVector.ID) return m.vec_throttle.modify(id, r);
                case (#switcher(r)) if (mid == SwitcherVector.ID) return m.vec_switcher.modify(id, r);
                // case (#lend(r)) if (mid == Lend.ID) return m.vec_lend.modify(id, r);
                // case (#borrow(r)) if (mid == Borrow.ID) return m.vec_borrow.modify(id, r);
                case (#exchange(r)) if (mid == Exchange.ID) return m.vec_exchange.modify(id, r);
                // case (#escrow(r)) if (mid == Escrow.ID) return m.vec_escrow.modify(id, r);
                case (#split(r)) if (mid == Split.ID) return m.vec_split.modify(id, r);
                case (#exchange_liquidity(r)) if (mid == ExchangeLiquidity.ID) return m.vec_exchange_liquidity.modify(id, r);
                case (#auto_liquidity(r)) if (mid == AutoLiquidity.ID) return m.vec_auto_liquidity.modify(id, r);
                case (#vault(r)) if (mid == Vault.ID) return m.vec_vault.modify(id, r);
                case (#balancer(r)) if (mid == Balancer.ID) return m.vec_balancer.modify(id, r);
                //...
            };
            #err("Unknown variant or mismatch.");
        };

        public func delete(mid :Core.ModuleId, id:Core.NodeId) : Result.Result<(), Text> {
            if (mid == ThrottleVector.ID) return m.vec_throttle.delete(id);
            if (mid == SwitcherVector.ID) return m.vec_switcher.delete(id);
            // if (mid == Lend.ID) return m.vec_lend.delete(id);
            // if (mid == Borrow.ID) return m.vec_borrow.delete(id);
            if (mid == Exchange.ID) return m.vec_exchange.delete(id);
            // if (mid == Escrow.ID) return m.vec_escrow.delete(id);
            if (mid == Split.ID) return m.vec_split.delete(id);
            if (mid == ExchangeLiquidity.ID) return m.vec_exchange_liquidity.delete(id);
            if (mid == AutoLiquidity.ID) return m.vec_auto_liquidity.delete(id);
            if (mid == Vault.ID) return m.vec_vault.delete(id);
            if (mid == Balancer.ID) return m.vec_balancer.delete(id);
            #err("Unknown variant.");
        };

        public func nodeMeta(mid :Core.ModuleId) : ICRC55.ModuleMeta {
            if (mid == ThrottleVector.ID) return m.vec_throttle.meta();
            if (mid == SwitcherVector.ID) return m.vec_switcher.meta();
            // if (mid == Lend.ID) return m.vec_lend.meta();
            // if (mid == Borrow.ID) return m.vec_borrow.meta();
            if (mid == Exchange.ID) return m.vec_exchange.meta();
            // if (mid == Escrow.ID) return m.vec_escrow.meta();
            if (mid == Split.ID) return m.vec_split.meta();
            if (mid == ExchangeLiquidity.ID) return m.vec_exchange_liquidity.meta();
            if (mid == AutoLiquidity.ID) return m.vec_auto_liquidity.meta();
            if (mid == Vault.ID) return m.vec_vault.meta();
            if (mid == Balancer.ID) return m.vec_balancer.meta();
            Debug.trap("Unknown variant");
        };


        public func meta() : [ICRC55.ModuleMeta] {
            [
                m.vec_throttle.meta(),
                m.vec_switcher.meta(),
                // m.vec_lend.meta(),
                // m.vec_borrow.meta(),
                m.vec_exchange.meta(),
                // m.vec_escrow.meta(),
                m.vec_split.meta(),
                m.vec_exchange_liquidity.meta(),
                m.vec_auto_liquidity.meta(),
                m.vec_vault.meta(),
                m.vec_balancer.meta(),
            //...
            ];
        };

    };
};
