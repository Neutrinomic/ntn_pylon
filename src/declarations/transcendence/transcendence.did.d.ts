import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface AccountEndpoint { 'balance' : bigint, 'endpoint' : Endpoint }
export interface AccountsRequest {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export type AccountsResponse = Array<AccountEndpoint>;
export type Amount = bigint;
export interface ArchivedTransactionResponse {
  'args' : Array<TransactionRange>,
  'callback' : GetTransactionsFn,
}
export interface BatchCommandRequest {
  'request_id' : [] | [number],
  'controller' : Controller,
  'signature' : [] | [Uint8Array | number[]],
  'expire_at' : [] | [bigint],
  'commands' : Array<Command>,
}
export type BatchCommandResponse = {
    'ok' : { 'id' : [] | [bigint], 'commands' : Array<CommandResponse> }
  } |
  {
    'err' : { 'caller_not_controller' : null } |
      { 'expired' : null } |
      { 'other' : string } |
      { 'duplicate' : bigint } |
      { 'invalid_signature' : null }
  };
export interface Billing {
  'transaction_fee' : BillingTransactionFee,
  'cost_per_day' : bigint,
}
export interface BillingFeeSplit {
  'platform' : bigint,
  'author' : bigint,
  'affiliate' : bigint,
  'pylon' : bigint,
}
export interface BillingPylon {
  'operation_cost' : bigint,
  'freezing_threshold_days' : bigint,
  'min_create_balance' : bigint,
  'split' : BillingFeeSplit,
  'ledger' : Principal,
  'platform_account' : Account,
  'pylon_account' : Account,
}
export type BillingTransactionFee = { 'none' : null } |
  { 'transaction_percentage_fee_e8s' : bigint } |
  { 'flat_fee_multiplier' : bigint };
export interface BlockType { 'url' : string, 'block_type' : string }
export type C100_Account = { 'sent' : Sent } |
  { 'received' : Received };
export type C200_Dex = { 'swap' : Swap } |
  { 'liquidityAdd' : LiquidityAdd } |
  { 'liquidityRemove' : LiquidityRemove };
export type ChronoRecord = { 'dex' : C200_Dex } |
  { 'account' : C100_Account };
export type Command = { 'modify_node' : ModifyNodeRequest } |
  { 'create_node' : CreateNodeRequest } |
  { 'transfer' : TransferRequest } |
  { 'delete_node' : LocalNodeId };
export type CommandResponse = { 'modify_node' : ModifyNodeResponse } |
  { 'create_node' : CreateNodeResponse } |
  { 'transfer' : TransferResponse } |
  { 'delete_node' : DeleteNodeResp };
export interface CommonCreateRequest {
  'controllers' : Array<Controller>,
  'initial_billing_amount' : [] | [bigint],
  'extractors' : Uint32Array | number[],
  'temp_id' : number,
  'billing_option' : bigint,
  'destinations' : Array<[] | [InputAddress]>,
  'sources' : Array<[] | [InputAddress]>,
  'affiliate' : [] | [Account],
  'ledgers' : Array<SupportedLedger>,
  'temporary' : boolean,
  'refund' : Account,
}
export interface CommonModifyRequest {
  'active' : [] | [boolean],
  'controllers' : [] | [Array<Controller>],
  'extractors' : [] | [Uint32Array | number[]],
  'destinations' : [] | [Array<[] | [InputAddress]>],
  'sources' : [] | [Array<[] | [InputAddress]>],
  'refund' : [] | [Account],
}
export interface Controller {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export type CreateNodeRequest = [CommonCreateRequest, CreateRequest];
export type CreateNodeResponse = { 'ok' : GetNodeResponse } |
  { 'err' : string };
export type CreateRequest = { 'switcher' : CreateRequest__5 } |
  { 'vault' : CreateRequest__7 } |
  { 'split' : CreateRequest__4 } |
  { 'throttle' : CreateRequest__6 } |
  { 'exchange' : CreateRequest__2 } |
  { 'exchange_liquidity' : CreateRequest__3 } |
  { 'auto_liquidity' : CreateRequest__1 };
export interface CreateRequest__1 {
  'init' : {},
  'variables' : {
    'mode' : Mode,
    'interval_seconds' : bigint,
    'range_percent' : number,
    'remove_percent' : number,
  },
}
export interface CreateRequest__2 {
  'init' : {},
  'variables' : {
    'max_impact' : number,
    'max_rate' : [] | [number],
    'buy_for_amount' : bigint,
    'buy_interval_seconds' : bigint,
  },
}
export interface CreateRequest__3 {
  'init' : {},
  'variables' : { 'flow' : Flow, 'range' : Range },
}
export interface CreateRequest__4 {
  'init' : {},
  'variables' : { 'split' : Array<bigint> },
}
export interface CreateRequest__5 {
  'init' : {},
  'variables' : {
    'throttle_interval' : NumVariant,
    'switch_interval' : NumVariant,
    'amount_a' : NumVariant,
    'amount_b' : NumVariant,
    'switch_chance' : bigint,
  },
}
export interface CreateRequest__6 {
  'init' : {},
  'variables' : { 'interval_sec' : NumVariant, 'max_amount' : NumVariant },
}
export interface CreateRequest__7 {
  'init' : {},
  'variables' : { 'description' : string },
}
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export type DataSource = Principal;
export type DeleteNodeResp = { 'ok' : null } |
  { 'err' : string };
export interface DeletePoolRequest { 'base' : Principal, 'quote' : Principal }
export type DeletePoolResponse = { 'ok' : null } |
  { 'err' : string };
export interface DepthRequest { 'level' : Level, 'limit' : number }
export interface DestinationEndpointResp {
  'endpoint' : EndpointOpt,
  'name' : string,
}
export type Endpoint = { 'ic' : EndpointIC } |
  { 'other' : EndpointOther };
export interface EndpointIC { 'ledger' : Principal, 'account' : Account }
export type EndpointIdx = number;
export type EndpointOpt = { 'ic' : EndpointOptIC } |
  { 'other' : EndpointOptOther };
export interface EndpointOptIC {
  'ledger' : Principal,
  'account' : [] | [Account],
}
export interface EndpointOptOther {
  'platform' : bigint,
  'ledger' : Uint8Array | number[],
  'account' : [] | [Uint8Array | number[]],
}
export interface EndpointOther {
  'platform' : bigint,
  'ledger' : Uint8Array | number[],
  'account' : Uint8Array | number[],
}
export type EndpointsDescription = Array<[LedgerIdx, LedgerLabel]>;
export type Flow = { 'add' : null } |
  { 'remove' : null };
export interface GetArchivesArgs { 'from' : [] | [Principal] }
export type GetArchivesResult = Array<GetArchivesResultItem>;
export interface GetArchivesResultItem {
  'end' : bigint,
  'canister_id' : Principal,
  'start' : bigint,
}
export type GetBlocksArgs = Array<TransactionRange>;
export interface GetBlocksResult {
  'log_length' : bigint,
  'blocks' : Array<{ 'id' : bigint, 'block' : [] | [Value] }>,
  'archived_blocks' : Array<ArchivedTransactionResponse>,
}
export interface GetControllerNodesRequest {
  'id' : Controller,
  'start' : LocalNodeId,
  'length' : number,
}
export type GetNode = { 'id' : LocalNodeId } |
  { 'endpoint' : Endpoint };
export interface GetNodeResponse {
  'id' : LocalNodeId,
  'created' : bigint,
  'active' : boolean,
  'modified' : bigint,
  'controllers' : Array<Controller>,
  'custom' : [] | [Shared],
  'extractors' : Uint32Array | number[],
  'billing' : {
    'transaction_fee' : BillingTransactionFee,
    'expires' : [] | [bigint],
    'current_balance' : bigint,
    'billing_option' : bigint,
    'account' : Account,
    'frozen' : boolean,
    'cost_per_day' : bigint,
  },
  'destinations' : Array<DestinationEndpointResp>,
  'sources' : Array<SourceEndpointResp>,
  'refund' : Account,
}
export type GetTransactionsFn = ActorMethod<
  [Array<TransactionRange>],
  GetTransactionsResult
>;
export interface GetTransactionsResult {
  'log_length' : bigint,
  'blocks' : Array<{ 'id' : bigint, 'block' : [] | [Value] }>,
  'archived_blocks' : Array<ArchivedTransactionResponse>,
}
export interface Info {
  'pending' : bigint,
  'last_indexed_tx' : bigint,
  'errors' : bigint,
  'lastTxTime' : bigint,
  'accounts' : bigint,
  'actor_principal' : [] | [Principal],
  'reader_instructions_cost' : bigint,
  'sender_instructions_cost' : bigint,
}
export interface Info__1 {
  'pending' : bigint,
  'last_indexed_tx' : bigint,
  'errors' : bigint,
  'lastTxTime' : bigint,
  'accounts' : bigint,
  'actor_principal' : Principal,
  'reader_instructions_cost' : bigint,
  'sender_instructions_cost' : bigint,
}
export type InputAddress = { 'ic' : Account } |
  { 'other' : Uint8Array | number[] } |
  { 'temp' : { 'id' : number, 'source_idx' : EndpointIdx } };
export type LedgerIdx = bigint;
export interface LedgerInfo {
  'fee' : bigint,
  'decimals' : number,
  'name' : string,
  'ledger' : SupportedLedger,
  'symbol' : string,
}
export interface LedgerInfo__1 {
  'id' : Principal,
  'info' : { 'icp' : Info } |
    { 'icrc' : Info__1 },
}
export type LedgerLabel = string;
export type Level = number;
export interface LiquidityAdd {
  'to' : Account,
  'fromA' : Account,
  'fromB' : Account,
  'amountA' : bigint,
  'amountB' : bigint,
}
export interface LiquidityRemove {
  'toA' : Account,
  'toB' : Account,
  'from' : Account,
  'amountA' : bigint,
  'amountB' : bigint,
}
export type ListPairsResponse = Array<PairInfo>;
export type LocalNodeId = number;
export type MarketTickInner = [number, number, number, number, number, bigint];
export type Mode = { 'remove' : null } |
  { 'auto' : null };
export type ModifyNodeRequest = [
  LocalNodeId,
  [] | [CommonModifyRequest],
  [] | [ModifyRequest],
];
export type ModifyNodeResponse = { 'ok' : GetNodeResponse } |
  { 'err' : string };
export type ModifyRequest = { 'switcher' : ModifyRequest__5 } |
  { 'vault' : ModifyRequest__7 } |
  { 'split' : ModifyRequest__4 } |
  { 'throttle' : ModifyRequest__6 } |
  { 'exchange' : ModifyRequest__2 } |
  { 'exchange_liquidity' : ModifyRequest__3 } |
  { 'auto_liquidity' : ModifyRequest__1 };
export interface ModifyRequest__1 {
  'mode' : Mode,
  'interval_seconds' : bigint,
  'range_percent' : number,
  'remove_percent' : number,
}
export interface ModifyRequest__2 {
  'max_impact' : number,
  'max_rate' : [] | [number],
  'buy_for_amount' : bigint,
  'buy_interval_seconds' : bigint,
}
export interface ModifyRequest__3 { 'flow' : Flow, 'range' : Range }
export interface ModifyRequest__4 { 'split' : Array<bigint> }
export interface ModifyRequest__5 {
  'throttle_interval' : NumVariant,
  'switch_interval' : NumVariant,
  'amount_a' : NumVariant,
  'amount_b' : NumVariant,
  'switch_chance' : bigint,
}
export interface ModifyRequest__6 {
  'interval_sec' : NumVariant,
  'max_amount' : NumVariant,
}
export interface ModifyRequest__7 { 'description' : string }
export interface ModuleMeta {
  'id' : string,
  'create_allowed' : boolean,
  'ledger_slots' : Array<string>,
  'name' : string,
  'billing' : Array<Billing>,
  'description' : string,
  'supported_ledgers' : Array<SupportedLedger>,
  'author' : string,
  'version' : Version,
  'destinations' : EndpointsDescription,
  'sources' : EndpointsDescription,
  'temporary_allowed' : boolean,
  'author_account' : Account,
}
export interface NodeShared {
  'id' : LocalNodeId,
  'created' : bigint,
  'active' : boolean,
  'modified' : bigint,
  'controllers' : Array<Controller>,
  'custom' : [] | [Shared],
  'extractors' : Uint32Array | number[],
  'billing' : {
    'transaction_fee' : BillingTransactionFee,
    'expires' : [] | [bigint],
    'current_balance' : bigint,
    'billing_option' : bigint,
    'account' : Account,
    'frozen' : boolean,
    'cost_per_day' : bigint,
  },
  'destinations' : Array<DestinationEndpointResp>,
  'sources' : Array<SourceEndpointResp>,
  'refund' : Account,
}
export type NumVariant = { 'rnd' : { 'max' : bigint, 'min' : bigint } } |
  { 'fixed' : bigint };
export interface OHLCVRequest {
  'l1' : SupportedLedger,
  'l2' : SupportedLedger,
  'period' : { 't1d' : null } |
    { 't1h' : null } |
    { 't1m' : null } |
    { 't1s' : null },
}
export type OHLCVResponse = {
    'ok' : {
      'l1' : SupportedLedger,
      'l2' : SupportedLedger,
      'data' : Array<MarketTickInner>,
    }
  } |
  { 'err' : string };
export interface PairData {
  'id' : PairId,
  'volume_total_USD' : [] | [Amount],
  'asks' : Array<[Rate, Amount]>,
  'base' : TokenData,
  'bids' : Array<[Rate, Amount]>,
  'last' : Rate,
  'quote' : TokenData,
  'last_timestamp' : bigint,
  'volume24_USD' : [] | [Amount],
  'updated_timestamp' : bigint,
}
export interface PairId { 'base' : TokenId, 'quote' : TokenId }
export interface PairInfo { 'id' : PairId, 'data' : DataSource }
export interface PairRequest {
  'pairs' : Array<PairId>,
  'depth' : [] | [DepthRequest],
}
export type PairResponse = { 'Ok' : PairResponseOk } |
  { 'Err' : PairResponseErr };
export type PairResponseErr = { 'NotFound' : PairId } |
  { 'InvalidDepthLevel' : Level } |
  { 'InvalidDepthLimit' : number };
export type PairResponseOk = Array<PairData>;
export type PlatformId = bigint;
export type PlatformPath = Uint8Array | number[];
export interface PoolRequest { 'base' : Principal, 'quote' : Principal }
export type PoolResponse = { 'ok' : null } |
  { 'err' : string };
export interface PylonMetaResp {
  'name' : string,
  'billing' : BillingPylon,
  'supported_ledgers' : Array<LedgerInfo>,
  'request_max_expire_sec' : bigint,
  'governed_by' : string,
  'temporary_nodes' : { 'allowed' : boolean, 'expire_sec' : bigint },
  'modules' : Array<ModuleMeta>,
}
export interface QuoteRequest {
  'ledger_to' : SupportedLedger,
  'ledger_from' : SupportedLedger,
  'amount' : bigint,
}
export type QuoteResponse = {
    'ok' : {
      'fees' : Array<[string, SupportedLedger, bigint]>,
      'path' : Array<[SupportedLedger, number]>,
      'amount_out' : bigint,
      'before_price' : number,
      'amount_in_max' : bigint,
      'after_price' : number,
    }
  } |
  { 'err' : string };
export type Range = {
    'partial' : { 'to_price' : number, 'from_price' : number }
  };
export type Rate = number;
export interface Received {
  'from' : { 'icp' : Uint8Array | number[] } |
    { 'icrc' : Account },
  'ledger' : Principal,
  'amount' : bigint,
}
export interface SETTINGS {
  'PYLON_NAME' : string,
  'TEMP_NODE_EXPIRATION_SEC' : bigint,
  'ALLOW_TEMP_NODE_CREATION' : boolean,
  'MAX_INSTRUCTIONS_PER_HEARTBEAT' : bigint,
  'BILLING' : BillingPylon,
  'PYLON_GOVERNED_BY' : string,
  'REQUEST_MAX_EXPIRE_SEC' : bigint,
}
export interface Sent {
  'to' : { 'icp' : Uint8Array | number[] } |
    { 'icrc' : Account },
  'ledger' : Principal,
  'amount' : bigint,
}
export type Shared = { 'switcher' : Shared__5 } |
  { 'vault' : Shared__7 } |
  { 'split' : Shared__4 } |
  { 'throttle' : Shared__6 } |
  { 'exchange' : Shared__2 } |
  { 'exchange_liquidity' : Shared__3 } |
  { 'auto_liquidity' : Shared__1 };
export interface Shared__1 {
  'internals' : {
    'last_error' : [] | [string],
    'current_price' : [] | [number],
    'tokenA' : bigint,
    'tokenB' : bigint,
    'last_run' : bigint,
    'addedTokenA' : bigint,
    'addedTokenB' : bigint,
  },
  'init' : {},
  'variables' : {
    'mode' : Mode,
    'interval_seconds' : bigint,
    'range_percent' : number,
    'remove_percent' : number,
  },
}
export interface Shared__2 {
  'internals' : {
    'next_buy' : bigint,
    'last_error' : [] | [string],
    'swap_fee_e4s' : bigint,
    'current_rate' : [] | [number],
    'price' : [] | [number],
    'last_buy' : bigint,
    'last_run' : bigint,
  },
  'init' : {},
  'variables' : {
    'max_impact' : number,
    'max_rate' : [] | [number],
    'buy_for_amount' : bigint,
    'buy_interval_seconds' : bigint,
  },
}
export interface Shared__3 {
  'internals' : {
    'last_error' : [] | [string],
    'tokenA' : bigint,
    'tokenB' : bigint,
    'last_run' : bigint,
    'addedTokenA' : bigint,
    'addedTokenB' : bigint,
  },
  'init' : {},
  'variables' : { 'flow' : Flow, 'range' : Range },
}
export interface Shared__4 {
  'internals' : {},
  'init' : {},
  'variables' : { 'split' : Array<bigint> },
}
export interface Shared__5 {
  'internals' : {
    'next_send_ts' : bigint,
    'next_switch_ts' : bigint,
    'current_source' : bigint,
  },
  'init' : {},
  'variables' : {
    'throttle_interval' : NumVariant,
    'switch_interval' : NumVariant,
    'amount_a' : NumVariant,
    'amount_b' : NumVariant,
    'switch_chance' : bigint,
  },
}
export interface Shared__6 {
  'internals' : { 'wait_until_ts' : bigint },
  'init' : {},
  'variables' : { 'interval_sec' : NumVariant, 'max_amount' : NumVariant },
}
export interface Shared__7 {
  'internals' : {},
  'init' : {},
  'variables' : { 'description' : string },
}
export interface SourceEndpointResp {
  'balance' : bigint,
  'endpoint' : Endpoint,
  'name' : string,
}
export type SupportedLedger = { 'ic' : Principal } |
  { 'other' : { 'platform' : bigint, 'ledger' : Uint8Array | number[] } };
export interface Swap {
  'to' : Account,
  'from' : Account,
  'amountIn' : bigint,
  'zeroForOne' : boolean,
  'amountOut' : bigint,
  'newPrice' : number,
}
export interface SwapRequest {
  'min_amount_out' : bigint,
  'ledger_to' : SupportedLedger,
  'ledger_from' : SupportedLedger,
  'account' : Account,
  'amount' : bigint,
}
export type SwapResponse = { 'ok' : null } |
  { 'err' : string };
export interface TokenData { 'volume24' : Amount, 'volume_total' : Amount }
export interface TokenId { 'path' : PlatformPath, 'platform' : PlatformId }
export interface TransactionRange { 'start' : bigint, 'length' : bigint }
export interface TransferRequest {
  'to' : { 'node_billing' : LocalNodeId } |
    { 'node' : { 'node_id' : LocalNodeId, 'endpoint_idx' : EndpointIdx } } |
    { 'temp' : { 'id' : number, 'source_idx' : EndpointIdx } } |
    {
      'external_account' : { 'ic' : Account } |
        { 'other' : Uint8Array | number[] }
    } |
    { 'account' : Account },
  'from' : {
      'node' : { 'node_id' : LocalNodeId, 'endpoint_idx' : EndpointIdx }
    } |
    { 'account' : Account },
  'ledger' : SupportedLedger,
  'amount' : bigint,
}
export type TransferResponse = { 'ok' : bigint } |
  { 'err' : string };
export type ValidationResult = { 'Ok' : string } |
  { 'Err' : string };
export type Value = { 'Int' : bigint } |
  { 'Map' : Array<ValueMap> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<Value> };
export type ValueMap = [string, Value];
export type Version = { 'alpha' : Uint16Array | number[] } |
  { 'beta' : Uint16Array | number[] } |
  { 'release' : Uint16Array | number[] };
export interface _anon_class_31_1 {
  'add_supported_ledger' : ActorMethod<
    [Principal, { 'icp' : null } | { 'icrc' : null }],
    undefined
  >,
  'chrono_records' : ActorMethod<[], [] | [ChronoRecord]>,
  'dex_ohlcv' : ActorMethod<[OHLCVRequest], OHLCVResponse>,
  'dex_pool_create' : ActorMethod<[PoolRequest], PoolResponse>,
  'dex_pool_delete' : ActorMethod<[DeletePoolRequest], DeletePoolResponse>,
  'dex_quote' : ActorMethod<[QuoteRequest], QuoteResponse>,
  'dex_swap' : ActorMethod<[SwapRequest], SwapResponse>,
  'get_ledger_errors' : ActorMethod<[], Array<Array<string>>>,
  'get_ledgers_info' : ActorMethod<[], Array<LedgerInfo__1>>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'icrc45_get_pairs' : ActorMethod<[PairRequest], PairResponse>,
  'icrc45_list_pairs' : ActorMethod<[], ListPairsResponse>,
  'icrc55_account_register' : ActorMethod<[Account], undefined>,
  'icrc55_accounts' : ActorMethod<[AccountsRequest], AccountsResponse>,
  'icrc55_command' : ActorMethod<[BatchCommandRequest], BatchCommandResponse>,
  'icrc55_command_validate' : ActorMethod<
    [BatchCommandRequest],
    ValidationResult
  >,
  'icrc55_get_controller_nodes' : ActorMethod<
    [GetControllerNodesRequest],
    Array<NodeShared>
  >,
  'icrc55_get_defaults' : ActorMethod<[string], CreateRequest>,
  'icrc55_get_nodes' : ActorMethod<[Array<GetNode>], Array<[] | [NodeShared]>>,
  'icrc55_get_pylon_meta' : ActorMethod<[], PylonMetaResp>,
  'top_accounts' : ActorMethod<
    [Principal],
    Array<[Uint8Array | number[], bigint]>
  >,
}
export interface _SERVICE extends _anon_class_31_1 {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
