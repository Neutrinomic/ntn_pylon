import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
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
    'ok' : { 'id' : bigint, 'commands' : Array<CommandResponse> }
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
export type CreateRequest = { 'lend' : CreateRequest__5 } |
  { 'borrow' : CreateRequest__1 } |
  { 'split' : CreateRequest__6 } |
  { 'throttle' : CreateRequest__7 } |
  { 'exchange' : CreateRequest__3 } |
  { 'escrow' : CreateRequest__2 } |
  { 'exchange_liquidity' : CreateRequest__4 };
export interface CreateRequest__1 {
  'init' : {},
  'variables' : { 'interest' : bigint },
}
export interface CreateRequest__2 {
  'init' : {},
  'variables' : { 'interest' : bigint },
}
export interface CreateRequest__3 {
  'init' : {},
  'variables' : { 'max_slippage' : number },
}
export interface CreateRequest__4 {
  'init' : {},
  'variables' : { 'flow' : Flow, 'range' : Range },
}
export interface CreateRequest__5 {
  'init' : {},
  'variables' : { 'interest' : bigint },
}
export interface CreateRequest__6 {
  'init' : {},
  'variables' : { 'split' : Array<bigint> },
}
export interface CreateRequest__7 {
  'init' : {},
  'variables' : { 'interval_sec' : NumVariant, 'max_amount' : NumVariant },
}
export interface DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
export type DeleteNodeResp = { 'ok' : null } |
  { 'err' : string };
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
  { 'remove' : null } |
  { 'hold' : null } |
  { 'pass_through' : null };
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
  'id' : Principal,
  'info' : { 'icp' : Info } |
    { 'icrc' : Info__1 },
}
export type LedgerLabel = string;
export type LocalNodeId = number;
export type ModifyNodeRequest = [
  LocalNodeId,
  [] | [CommonModifyRequest],
  [] | [ModifyRequest],
];
export type ModifyNodeResponse = { 'ok' : GetNodeResponse } |
  { 'err' : string };
export type ModifyRequest = { 'lend' : ModifyRequest__5 } |
  { 'borrow' : ModifyRequest__1 } |
  { 'split' : ModifyRequest__6 } |
  { 'throttle' : ModifyRequest__7 } |
  { 'exchange' : ModifyRequest__3 } |
  { 'escrow' : ModifyRequest__2 } |
  { 'exchange_liquidity' : ModifyRequest__4 };
export interface ModifyRequest__1 { 'interest' : bigint }
export interface ModifyRequest__2 { 'interest' : bigint }
export interface ModifyRequest__3 { 'max_slippage' : number }
export interface ModifyRequest__4 { 'flow' : Flow, 'range' : Range }
export interface ModifyRequest__5 { 'interest' : bigint }
export interface ModifyRequest__6 { 'split' : Array<bigint> }
export interface ModifyRequest__7 {
  'interval_sec' : NumVariant,
  'max_amount' : NumVariant,
}
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
export interface PylonMetaResp {
  'name' : string,
  'billing' : BillingPylon,
  'supported_ledgers' : Array<SupportedLedger>,
  'request_max_expire_sec' : bigint,
  'governed_by' : string,
  'temporary_nodes' : { 'allowed' : boolean, 'expire_sec' : bigint },
  'modules' : Array<ModuleMeta>,
}
export type Range = { 'full' : null } |
  { 'partial' : { 'to_price' : number, 'from_price' : number } };
export interface SETTINGS {
  'PYLON_NAME' : string,
  'TEMP_NODE_EXPIRATION_SEC' : bigint,
  'ALLOW_TEMP_NODE_CREATION' : boolean,
  'MAX_INSTRUCTIONS_PER_HEARTBEAT' : bigint,
  'BILLING' : BillingPylon,
  'PYLON_GOVERNED_BY' : string,
  'REQUEST_MAX_EXPIRE_SEC' : bigint,
}
export type Shared = { 'lend' : Shared__5 } |
  { 'borrow' : Shared__1 } |
  { 'split' : Shared__6 } |
  { 'throttle' : Shared__7 } |
  { 'exchange' : Shared__3 } |
  { 'escrow' : Shared__2 } |
  { 'exchange_liquidity' : Shared__4 };
export interface Shared__1 {
  'internals' : {},
  'init' : {},
  'variables' : { 'interest' : bigint },
}
export interface Shared__2 {
  'internals' : {},
  'init' : {},
  'variables' : { 'interest' : bigint },
}
export interface Shared__3 {
  'internals' : { 'swap_fee_e4s' : bigint, 'price' : [] | [number] },
  'init' : {},
  'variables' : { 'max_slippage' : number },
}
export interface Shared__4 {
  'internals' : { 'tokenA' : bigint, 'tokenB' : bigint },
  'init' : {},
  'variables' : { 'flow' : Flow, 'range' : Range },
}
export interface Shared__5 {
  'internals' : {},
  'init' : {},
  'variables' : { 'interest' : bigint },
}
export interface Shared__6 {
  'internals' : {},
  'init' : {},
  'variables' : { 'split' : Array<bigint> },
}
export interface Shared__7 {
  'internals' : { 'wait_until_ts' : bigint },
  'init' : {},
  'variables' : { 'interval_sec' : NumVariant, 'max_amount' : NumVariant },
}
export interface SourceEndpointResp {
  'balance' : bigint,
  'endpoint' : Endpoint,
  'name' : string,
}
export type SupportedLedger = { 'ic' : Principal } |
  { 'other' : { 'platform' : bigint, 'ledger' : Uint8Array | number[] } };
export interface TransactionRange { 'start' : bigint, 'length' : bigint }
export interface TransferRequest {
  'to' : { 'node_billing' : LocalNodeId } |
    { 'node' : { 'node_id' : LocalNodeId, 'endpoint_idx' : EndpointIdx } } |
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
export interface VirtualBalancesRequest {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export type VirtualBalancesResponse = Array<[SupportedLedger, bigint]>;
export interface _anon_class_32_1 {
  'add_supported_ledger' : ActorMethod<
    [Principal, { 'icp' : null } | { 'icrc' : null }],
    undefined
  >,
  'beat' : ActorMethod<[], undefined>,
  'get_ledger_errors' : ActorMethod<[], Array<Array<string>>>,
  'get_ledgers_info' : ActorMethod<[], Array<LedgerInfo>>,
  'icrc3_get_archives' : ActorMethod<[GetArchivesArgs], GetArchivesResult>,
  'icrc3_get_blocks' : ActorMethod<[GetBlocksArgs], GetBlocksResult>,
  'icrc3_get_tip_certificate' : ActorMethod<[], [] | [DataCertificate]>,
  'icrc3_supported_block_types' : ActorMethod<[], Array<BlockType>>,
  'icrc55_command' : ActorMethod<[BatchCommandRequest], BatchCommandResponse>,
  'icrc55_get_controller_nodes' : ActorMethod<
    [GetControllerNodesRequest],
    Array<NodeShared>
  >,
  'icrc55_get_defaults' : ActorMethod<[string], CreateRequest>,
  'icrc55_get_nodes' : ActorMethod<[Array<GetNode>], Array<[] | [NodeShared]>>,
  'icrc55_get_pylon_meta' : ActorMethod<[], PylonMetaResp>,
  'icrc55_virtual_balances' : ActorMethod<
    [VirtualBalancesRequest],
    VirtualBalancesResponse
  >,
}
export interface _SERVICE extends _anon_class_32_1 {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
