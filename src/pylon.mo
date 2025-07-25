import Principal "mo:base/Principal";
import Ledgers "mo:devefi/ledgers";
import ICRC55 "mo:devefi/ICRC55";
import Rechain "mo:rechain";
import RT "./rechain";
import Timer "mo:base/Timer";
import U "mo:devefi/utils";
import T "./vector_modules";
import MU_sys "mo:devefi/sys";

import Result "mo:base/Result";

import VecThrottle "./modules/throttle/throttle";
import VecSwitcher "./modules/switcher/switcher";
// import VecBorrow "./modules/borrow/borrow";
// import VecLend "./modules/lend/lend";
import VecExchange "./modules/exchange/exchange";
import VecExchangeLiquidity "./modules/exchange_liquidity/exchange_liquidity";
import VecAutoLiquidity "./modules/auto_liquidity/auto_liquidity";
// import VecEscrow "./modules/escrow/escrow";
import VecSplit "./modules/split/split";
import VecVault "./modules/vault/vault";
import VecBalancer "./modules/balancer/balancer";
import Core "mo:devefi/core";
import Swap "mo:devefi_swap";
import Option "mo:base/Option";
import Chrono "mo:chronotrinite/client";
import ChronoIF "mo:devefi/chrono";
import Recover "./recover";
import Debug "mo:base/Debug";
actor class (DFV_SETTINGS: ?Core.SETTINGS) = this {
    Debug.print("Installing latest version of pylon");
    let me_can = Principal.fromActor(this);
    stable let chain_mem  = Rechain.Mem.Rechain.V1.new();

    var chain = Rechain.Chain<system, RT.DispatchAction, RT.DispatchActionError>({
        settings = ?{Rechain.DEFAULT_SETTINGS with supportedBlocks = [{block_type = "55vec"; url = "https://github.com/dfinity/ICRC/issues/55"}];};
        xmem = chain_mem;
        encodeBlock = RT.encodeBlock;
        reducers = [];
        me_can;
    });

    stable let chrono_mem_v1 = Chrono.Mem.ChronoClient.V1.new({router = Principal.fromText("hik73-dyaaa-aaaal-qsaqa-cai")});
    let chrono = Chrono.ChronoClient<system>({ xmem = chrono_mem_v1 });

    let admin_id = Principal.fromText("v6ksx-vfv66-dlpks-agv2k-2pafk-yjlow-5fesr-dxigk-rzvzp-xrfbg-tae");


    stable let dvf_mem_1 = Ledgers.Mem.Ledgers.V1.new();
    stable let dvf_mem_2 = Ledgers.Mem.Ledgers.V2.upgrade(dvf_mem_1);

    let dvf = Ledgers.Ledgers<system>({ xmem = dvf_mem_2 ; me_can; chrono;});

    stable let mem_core_1 = Core.Mem.Core.V1.new();

    let core = Core.Mod<system>({
        _chrono = chrono;
        xmem = mem_core_1;
        settings = Option.get(DFV_SETTINGS, {
            PYLON_NAME = "Transcendence";
            PYLON_GOVERNED_BY = "Neutrinite";
            BILLING = {
                ledger = Principal.fromText("lxzze-o7777-77777-aaaaa-cai");
                min_create_balance = 2000_0000;
                operation_cost = 1000;
                freezing_threshold_days = 10;
                split = {
                    platform = 20;
                    pylon = 20; 
                    author = 40;
                    affiliate = 20;
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
        me_can;
    });

    // Shared modules
    stable let mem_swap_1 = Swap.Mem.Swap.V1.new();
    let swap = Swap.Mod({xmem=mem_swap_1; core; dvf; primary_ledger = Principal.fromText("f54if-eqaaa-aaaaq-aacea-cai"); swap_fee_e4s = 30});


    // Vector modules
    stable let mem_vec_throttle_1 = VecThrottle.Mem.Vector.V1.new();
    let vec_throttle = VecThrottle.Mod({xmem=mem_vec_throttle_1; core});

    stable let mem_vec_switcher_1 = VecSwitcher.Mem.Vector.V1.new();
    stable let mem_vec_switcher_2 = VecSwitcher.Mem.Vector.V2.upgrade( mem_vec_switcher_1);
    let vec_switcher = VecSwitcher.Mod({xmem=mem_vec_switcher_2; core});

    // stable let mem_vec_lend_1 = VecLend.Mem.Vector.V1.new();
    // let vec_lend = VecLend.Mod({xmem=mem_vec_lend_1; core});

    // stable let mem_vec_borrow_1 = VecBorrow.Mem.Vector.V1.new();
    // let vec_borrow = VecBorrow.Mod({xmem=mem_vec_borrow_1; core});

    stable let mem_vec_exchange_1 = VecExchange.Mem.Vector.V1.new();
    let vec_exchange = VecExchange.Mod({xmem=mem_vec_exchange_1; core; swap});

    // stable let mem_vec_escrow_1 = VecEscrow.Mem.Vector.V1.new();
    // let vec_escrow = VecEscrow.Mod({xmem=mem_vec_escrow_1; core});

    stable let mem_vec_split_1 = VecSplit.Mem.Vector.V1.new();
    let vec_split = VecSplit.Mod({xmem=mem_vec_split_1; core});

    stable let mem_vec_exchange_liquidity_1 = VecExchangeLiquidity.Mem.Vector.V1.new();
    let vec_exchange_liquidity = VecExchangeLiquidity.Mod({xmem=mem_vec_exchange_liquidity_1; core; swap});

    stable let mem_vec_auto_liquidity_1 = VecAutoLiquidity.Mem.Vector.V1.new();
    let vec_auto_liquidity = VecAutoLiquidity.Mod({xmem=mem_vec_auto_liquidity_1; core; swap});

    stable let mem_vec_vault_1 = VecVault.Mem.Vector.V1.new();
    let vec_vault = VecVault.Mod({xmem=mem_vec_vault_1; core});

    stable let mem_vec_balancer_1 = VecBalancer.Mem.Vector.V1.new();
    let vec_balancer = VecBalancer.Mod({xmem=mem_vec_balancer_1; core; swap});

    let vmod = T.VectorModules({
        vec_throttle;
        vec_switcher;
        // vec_lend;
        // vec_borrow;
        vec_exchange;
        // vec_escrow;
        vec_split;
        vec_exchange_liquidity;
        vec_auto_liquidity;
        vec_vault;
        vec_balancer;
    });

    
    let sys = MU_sys.Mod<system, T.CreateRequest, T.Shared, T.ModifyRequest>({
        xmem = mem_core_1;
        dvf;
        core;
        vmod;
        me_can;
    });

    private func proc() {
        vec_exchange_liquidity.run();
        vec_auto_liquidity.run();
        vec_exchange.run();
        vec_throttle.run();
        vec_switcher.run();
        vec_split.run();
        vec_vault.run();
        vec_balancer.run();
    };

    ignore Timer.recurringTimer<system>(#seconds 2, func () : async () {
        core.heartbeat(proc);
    });

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

    public query func icrc55_command_validate(req : ICRC55.BatchCommandRequest<T.CreateRequest, T.ModifyRequest>) : async ICRC55.ValidationResult {
        #Ok(debug_show(req));
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

    public shared ({caller}) func icrc55_account_register(acc : ICRC55.Account) : async () {
        sys.icrc55_account_register(caller, acc);
    };

    public query ({caller}) func icrc55_accounts(req : ICRC55.AccountsRequest) : async ICRC55.AccountsResponse {
        sys.icrc55_accounts(caller, req);
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

    // DEX

    public query({caller}) func dex_quote(req : swap.Canister.QuoteRequest) : async swap.Canister.QuoteResponse {
        swap.Canister.dex_quote(caller, req);
    };

    public shared({caller}) func dex_swap(req : swap.Canister.SwapRequest) : async swap.Canister.SwapResponse {
        swap.Canister.dex_swap(caller, req);
    };

    public query func dex_ohlcv(req : swap.Canister.OHLCVRequest) : async swap.Canister.OHLCVResponse {
        swap.Canister.dex_ohlcv(req);
    };

    public shared({caller}) func dex_pool_create(req : swap.Pool.PoolRequest) : async swap.Pool.PoolResponse {
        assert((caller == admin_id) or (Principal.isController(caller)));
        swap.Canister.dex_pool_create(req);
    };

    public shared({caller}) func dex_pool_delete(req : swap.Canister.DeletePoolRequest) : async swap.Canister.DeletePoolResponse {
        assert((caller == admin_id) or (Principal.isController(caller)));
        swap.Canister.dex_pool_delete(req);
    };

    // ICRC 45

    public query func icrc45_list_pairs() : async swap.Canister.ListPairsResponse {
        swap.Canister.icrc45_list_pairs();
    };

    public query func icrc45_get_pairs(req : swap.Canister.PairRequest) : async swap.Canister.PairResponse {
        swap.Canister.icrc45_get_pairs(req);
    };

    // Stats

    public query func top_accounts(ledger : Principal) : async [(Blob, Nat)] {
        core.top_accounts(ledger);
    };

    // ---------- Debug functions -----------

    public shared ({caller}) func add_supported_ledger(id : Principal, ltype : {#icp; #icrc}) : () {
        assert((caller == admin_id) or (Principal.isController(caller)));
        dvf.add_ledger<system>(id, ltype);
    };

    public query func get_ledger_errors() : async [[Text]] {
        dvf.getErrors();
    };

    public query func get_ledgers_info() : async [Ledgers.LedgerInfo] {
        dvf.getLedgersInfo();
    };

    public query func get_pending_transactions() : async [Ledgers.PendingTransactions] {
        dvf.getPendingTransactions();
    };

    public shared({caller}) func clear_pending_transactions() : async () {
        assert((caller == admin_id) or (Principal.isController(caller)));
        dvf.clearPendingTransactions();
    };


    public query func chrono_records() : async ?ChronoIF.ChronoRecord {
        null
    };


    let recover = Recover.Recover<system>({dvf; core});

    // ---- Recover ---- 
    public shared({caller}) func admin_recover_tokens({ledger: Principal; account: Text; send_to:Text}) : async Result.Result<(), Text> {
        assert((caller == admin_id) or (Principal.isController(caller)));
        recover.admin_recover_tokens({ledger; account; send_to});
    };

    public shared({caller}) func admin_recover_unregistered_icp({account: Text; send_to:Text}) : async Result.Result<(), Text> {
        assert((caller == admin_id) or (Principal.isController(caller)));
        await recover.admin_recover_unregistered_icp({account; send_to});
    };


};
