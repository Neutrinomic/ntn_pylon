import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Time "mo:base/Time";
import DeVeFi "mo:devefi";
import Nat "mo:base/Nat";
import ICRC55 "mo:devefi/ICRC55";
import Rechain "mo:rechain";
import RT "./rechain";
import Timer "mo:base/Timer";
import U "mo:devefi/utils";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import I "mo:itertools/Iter";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import T "./vector_modules";
import MU "mo:mosup";
import MU_sys "mo:devefi/sys";

import VecThrottle "./modules/throttle/throttle";
import VecBorrow "./modules/borrow/borrow";
import VecLend "./modules/lend/lend";
import VecExchange "./modules/exchange/exchange";
import VecExchangeLiquidity "./modules/exchange_liquidity/exchange_liquidity";
import VecEscrow "./modules/escrow/escrow";
import VecSplit "./modules/split/split";
import Core "mo:devefi/core";
import Swap "./shared_modules/swap/swap";
import Option "mo:base/Option";

actor class (DFV_SETTINGS: ?Core.SETTINGS) = this {


    stable let chain_mem  = Rechain.Mem();

    var chain = Rechain.Chain<RT.DispatchAction, RT.DispatchActionError>({
        settings = ?{Rechain.DEFAULT_SETTINGS with supportedBlocks = [{block_type = "55vec"; url = "https://github.com/dfinity/ICRC/issues/55"}];};
        mem = chain_mem;
        encodeBlock = RT.encodeBlock;
        reducers = [];
    });
    
    ignore Timer.setTimer<system>(#seconds 0, func () : async () {
        await chain.start_timers<system>();
    });
    
    ignore Timer.setTimer<system>(#seconds 1, func () : async () {
        await chain.upgrade_archives();
    });

    stable let dvf_mem = DeVeFi.Mem();


    let dvf = DeVeFi.DeVeFi<system>({ mem = dvf_mem });

    stable let mem_core_1 = Core.Mem.Core.V1.new();

    let core = Core.Mod<system>({
        xmem = mem_core_1;
        settings = Option.get(DFV_SETTINGS, {
            PYLON_NAME = "Transcendence";
            PYLON_GOVERNED_BY = "Test DAO";
            BILLING = {
                ledger = Principal.fromText("lxzze-o7777-77777-aaaaa-cai");
                min_create_balance = 3000000;
                operation_cost = 1000;
                freezing_threshold_days = 10;
                exempt_daily_cost_balance = null;
                split = {
                    platform = 200;
                    pylon = 200; 
                    author = 400;
                    affiliate = 200;
                };
                pylon_account = { owner = Principal.fromText("eqsml-lyaaa-aaaaq-aacdq-cai"); subaccount = null };
                platform_account = { owner = Principal.fromText("eqsml-lyaaa-aaaaq-aacdq-cai"); subaccount = null };
            };
            TEMP_NODE_EXPIRATION_SEC = 3600;
            MAX_INSTRUCTIONS_PER_HEARTBEAT = 300_000_000;
            REQUEST_MAX_EXPIRE_SEC = 3600;
            ALLOW_TEMP_NODE_CREATION = true;
        }:Core.SETTINGS);
        dvf;
        chain;
    });

    // Shared modules
    let mem_swap_1 = Swap.Mem.Swap.V1.new();
    let swap = Swap.Mod({xmem=mem_swap_1; core; dvf; primary_ledger = Principal.fromText("lxzze-o7777-77777-aaaaa-cai"); swap_fee_e4s = 30});


    // Vector modules
    let mem_vec_throttle_1 = VecThrottle.Mem.Vector.V1.new();
    let vec_throttle = VecThrottle.Mod({xmem=mem_vec_throttle_1; core});

    let mem_vec_lend_1 = VecLend.Mem.Vector.V1.new();
    let vec_lend = VecLend.Mod({xmem=mem_vec_lend_1; core});

    let mem_vec_borrow_1 = VecBorrow.Mem.Vector.V1.new();
    let vec_borrow = VecBorrow.Mod({xmem=mem_vec_borrow_1; core});

    let mem_vec_exchange_1 = VecExchange.Mem.Vector.V1.new();
    let vec_exchange = VecExchange.Mod({xmem=mem_vec_exchange_1; core; swap});

    let mem_vec_escrow_1 = VecEscrow.Mem.Vector.V1.new();
    let vec_escrow = VecEscrow.Mod({xmem=mem_vec_escrow_1; core});

    let mem_vec_split_1 = VecSplit.Mem.Vector.V1.new();
    let vec_split = VecSplit.Mod({xmem=mem_vec_split_1; core});

    let mem_vec_exchange_liquidity_1 = VecExchangeLiquidity.Mem.Vector.V1.new();
    let vec_exchange_liquidity = VecExchangeLiquidity.Mod({xmem=mem_vec_exchange_liquidity_1; core; swap});

    let vmod = T.VectorModules({
        vec_throttle;
        vec_lend;
        vec_borrow;
        vec_exchange;
        vec_escrow;
        vec_split;
        vec_exchange_liquidity;
    });

    
    let sys = MU_sys.Mod<system, T.CreateRequest, T.Shared, T.ModifyRequest>({
        xmem = mem_core_1;
        dvf;
        core;
        vmod;
    });



    private func proc() {
        vec_exchange_liquidity.run();
        vec_exchange.run();
        vec_throttle.run();
        vec_split.run();
    };

    // ignore Timer.recurringTimer<system>(#seconds 2, func () : async () {
    //     core.heartbeat(proc);
    // });

    // ICRC-55

    

    public query func icrc55_get_pylon_meta() : async ICRC55.PylonMetaResp {
        sys.icrc55_get_pylon_meta();
    };

    public shared ({ caller }) func icrc55_command(req : ICRC55.BatchCommandRequest<T.CreateRequest, T.ModifyRequest>) : async ICRC55.BatchCommandResponse<T.Shared> {
        sys.icrc55_command<RT.DispatchActionError>(caller, req, func (r) {
            chain.dispatch({
                caller;
                payload = #vector(r);
                ts = U.now();
            });
        });
    };

    public query func icrc55_get_nodes(req : [ICRC55.GetNode]) : async [?MU_sys.NodeShared<T.Shared>] {
        sys.icrc55_get_nodes(req);
    };

    public query ({ caller }) func icrc55_get_controller_nodes(req : ICRC55.GetControllerNodesRequest) : async [MU_sys.NodeShared<T.Shared>] {
        sys.icrc55_get_controller_nodes(caller, req);
    };

    public query func icrc55_get_defaults(id : Text) : async T.CreateRequest {
        sys.icrc55_get_defaults(id);
    };

    public query ({caller}) func icrc55_virtual_balances(req : ICRC55.VirtualBalancesRequest) : async ICRC55.VirtualBalancesResponse {
        sys.icrc55_virtual_balances(caller, req);
    };

    // ICRC-3 


    public query func icrc3_get_blocks(args: Rechain.GetBlocksArgs): async Rechain.GetBlocksResult {
        return chain.icrc3_get_blocks(args);
    };

    public query func icrc3_get_archives(args: Rechain.GetArchivesArgs): async Rechain.GetArchivesResult {
        return chain.icrc3_get_archives(args);
    };

    public query func icrc3_supported_block_types(): async [Rechain.BlockType] {
        return chain.icrc3_supported_block_types();
    };
    public query func icrc3_get_tip_certificate() : async ?Rechain.DataCertificate {
        return chain.icrc3_get_tip_certificate();
    };

    // We need to start the vector manually once when canister is installed, because we can't init dvf from the body
    // https://github.com/dfinity/motoko/issues/4384
    // Sending tokens before starting the canister for the first time wont get processed
    public shared ({ caller }) func start() {
        assert (Principal.isController(caller));
        dvf.start<system>(Principal.fromActor(this));
        core.start<system>(Principal.fromActor(this));
        chain_mem.canister := ?Principal.fromActor(this);

    };

    // ---------- Debug functions -----------

    public func add_supported_ledger(id : Principal, ltype : {#icp; #icrc}) : () {
        dvf.add_ledger<system>(id, ltype);
    };

    public query func get_ledger_errors() : async [[Text]] {
        dvf.getErrors();
    };

    public query func get_ledgers_info() : async [DeVeFi.LedgerInfo] {
        dvf.getLedgersInfo();
    };

    public shared func beat() : async () {
         core.heartbeat(proc);
    };
};
