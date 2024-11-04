export const idlFactory = ({ IDL }) => {
  const ArchivedTransactionResponse = IDL.Rec();
  const Value = IDL.Rec();
  const Info = IDL.Record({
    'pending' : IDL.Nat,
    'last_indexed_tx' : IDL.Nat,
    'errors' : IDL.Nat,
    'lastTxTime' : IDL.Nat64,
    'accounts' : IDL.Nat,
    'actor_principal' : IDL.Opt(IDL.Principal),
    'reader_instructions_cost' : IDL.Nat64,
    'sender_instructions_cost' : IDL.Nat64,
  });
  const Info__1 = IDL.Record({
    'pending' : IDL.Nat,
    'last_indexed_tx' : IDL.Nat,
    'errors' : IDL.Nat,
    'lastTxTime' : IDL.Nat64,
    'accounts' : IDL.Nat,
    'actor_principal' : IDL.Opt(IDL.Principal),
    'reader_instructions_cost' : IDL.Nat64,
    'sender_instructions_cost' : IDL.Nat64,
  });
  const LedgerInfo = IDL.Record({
    'id' : IDL.Principal,
    'info' : IDL.Variant({ 'icp' : Info, 'icrc' : Info__1 }),
  });
  const GetArchivesArgs = IDL.Record({ 'from' : IDL.Opt(IDL.Principal) });
  const GetArchivesResultItem = IDL.Record({
    'end' : IDL.Nat,
    'canister_id' : IDL.Principal,
    'start' : IDL.Nat,
  });
  const GetArchivesResult = IDL.Vec(GetArchivesResultItem);
  const TransactionRange = IDL.Record({
    'start' : IDL.Nat,
    'length' : IDL.Nat,
  });
  const GetBlocksArgs = IDL.Vec(TransactionRange);
  const ValueMap = IDL.Tuple(IDL.Text, Value);
  Value.fill(
    IDL.Variant({
      'Int' : IDL.Int,
      'Map' : IDL.Vec(ValueMap),
      'Nat' : IDL.Nat,
      'Blob' : IDL.Vec(IDL.Nat8),
      'Text' : IDL.Text,
      'Array' : IDL.Vec(Value),
    })
  );
  const GetTransactionsResult = IDL.Record({
    'log_length' : IDL.Nat,
    'blocks' : IDL.Vec(
      IDL.Record({ 'id' : IDL.Nat, 'block' : IDL.Opt(Value) })
    ),
    'archived_blocks' : IDL.Vec(ArchivedTransactionResponse),
  });
  const GetTransactionsFn = IDL.Func(
      [IDL.Vec(TransactionRange)],
      [GetTransactionsResult],
      ['query'],
    );
  ArchivedTransactionResponse.fill(
    IDL.Record({
      'args' : IDL.Vec(TransactionRange),
      'callback' : GetTransactionsFn,
    })
  );
  const GetBlocksResult = IDL.Record({
    'log_length' : IDL.Nat,
    'blocks' : IDL.Vec(
      IDL.Record({ 'id' : IDL.Nat, 'block' : IDL.Opt(Value) })
    ),
    'archived_blocks' : IDL.Vec(ArchivedTransactionResponse),
  });
  const DataCertificate = IDL.Record({
    'certificate' : IDL.Vec(IDL.Nat8),
    'hash_tree' : IDL.Vec(IDL.Nat8),
  });
  const BlockType = IDL.Record({ 'url' : IDL.Text, 'block_type' : IDL.Text });
  const Controller = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const LocalNodeId = IDL.Nat32;
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const EndpointIdx = IDL.Nat8;
  const InputAddress = IDL.Variant({
    'ic' : Account,
    'other' : IDL.Vec(IDL.Nat8),
    'temp' : IDL.Record({ 'id' : IDL.Nat32, 'source_idx' : EndpointIdx }),
  });
  const CommonModifyRequest = IDL.Record({
    'active' : IDL.Opt(IDL.Bool),
    'controllers' : IDL.Opt(IDL.Vec(Controller)),
    'extractors' : IDL.Opt(IDL.Vec(LocalNodeId)),
    'destinations' : IDL.Opt(IDL.Vec(IDL.Opt(InputAddress))),
    'sources' : IDL.Opt(IDL.Vec(IDL.Opt(InputAddress))),
    'refund' : IDL.Opt(Account),
  });
  const ModifyRequest__5 = IDL.Record({ 'interest' : IDL.Nat });
  const ModifyRequest__1 = IDL.Record({ 'interest' : IDL.Nat });
  const ModifyRequest__6 = IDL.Record({ 'split' : IDL.Vec(IDL.Nat) });
  const NumVariant = IDL.Variant({
    'rnd' : IDL.Record({ 'max' : IDL.Nat64, 'min' : IDL.Nat64 }),
    'fixed' : IDL.Nat64,
  });
  const ModifyRequest__7 = IDL.Record({
    'interval_sec' : NumVariant,
    'max_amount' : NumVariant,
  });
  const ModifyRequest__3 = IDL.Record({ 'max_slippage_e6s' : IDL.Nat });
  const ModifyRequest__2 = IDL.Record({ 'interest' : IDL.Nat });
  const Flow = IDL.Variant({
    'add' : IDL.Null,
    'remove' : IDL.Null,
    'hold' : IDL.Null,
    'pass_through' : IDL.Null,
  });
  const ModifyRequest__4 = IDL.Record({ 'flow' : Flow });
  const ModifyRequest = IDL.Variant({
    'lend' : ModifyRequest__5,
    'borrow' : ModifyRequest__1,
    'split' : ModifyRequest__6,
    'throttle' : ModifyRequest__7,
    'exchange' : ModifyRequest__3,
    'escrow' : ModifyRequest__2,
    'exchange_liquidity' : ModifyRequest__4,
  });
  const ModifyNodeRequest = IDL.Tuple(
    LocalNodeId,
    IDL.Opt(CommonModifyRequest),
    IDL.Opt(ModifyRequest),
  );
  const SupportedLedger = IDL.Variant({
    'ic' : IDL.Principal,
    'other' : IDL.Record({
      'platform' : IDL.Nat64,
      'ledger' : IDL.Vec(IDL.Nat8),
    }),
  });
  const CommonCreateRequest = IDL.Record({
    'controllers' : IDL.Vec(Controller),
    'extractors' : IDL.Vec(LocalNodeId),
    'temp_id' : IDL.Nat32,
    'destinations' : IDL.Vec(IDL.Opt(InputAddress)),
    'sources' : IDL.Vec(IDL.Opt(InputAddress)),
    'affiliate' : IDL.Opt(Account),
    'ledgers' : IDL.Vec(SupportedLedger),
    'temporary' : IDL.Bool,
    'refund' : Account,
  });
  const CreateRequest__5 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'interest' : IDL.Nat }),
  });
  const CreateRequest__1 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'interest' : IDL.Nat }),
  });
  const CreateRequest__6 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'split' : IDL.Vec(IDL.Nat) }),
  });
  const CreateRequest__7 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({
      'interval_sec' : NumVariant,
      'max_amount' : NumVariant,
    }),
  });
  const CreateRequest__3 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'max_slippage_e6s' : IDL.Nat }),
  });
  const CreateRequest__2 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'interest' : IDL.Nat }),
  });
  const CreateRequest__4 = IDL.Record({
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'flow' : Flow }),
  });
  const CreateRequest = IDL.Variant({
    'lend' : CreateRequest__5,
    'borrow' : CreateRequest__1,
    'split' : CreateRequest__6,
    'throttle' : CreateRequest__7,
    'exchange' : CreateRequest__3,
    'escrow' : CreateRequest__2,
    'exchange_liquidity' : CreateRequest__4,
  });
  const CreateNodeRequest = IDL.Tuple(CommonCreateRequest, CreateRequest);
  const TransferRequest = IDL.Record({
    'to' : IDL.Variant({
      'node_billing' : LocalNodeId,
      'node' : IDL.Record({
        'node_id' : LocalNodeId,
        'endpoint_idx' : EndpointIdx,
      }),
      'external_account' : IDL.Variant({
        'ic' : Account,
        'other' : IDL.Vec(IDL.Nat8),
      }),
      'account' : Account,
    }),
    'from' : IDL.Variant({
      'node' : IDL.Record({
        'node_id' : LocalNodeId,
        'endpoint_idx' : EndpointIdx,
      }),
      'account' : Account,
    }),
    'ledger' : SupportedLedger,
    'amount' : IDL.Nat,
  });
  const Command = IDL.Variant({
    'modify_node' : ModifyNodeRequest,
    'create_node' : CreateNodeRequest,
    'transfer' : TransferRequest,
    'delete_node' : LocalNodeId,
  });
  const BatchCommandRequest = IDL.Record({
    'request_id' : IDL.Opt(IDL.Nat32),
    'controller' : Controller,
    'signature' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'expire_at' : IDL.Opt(IDL.Nat64),
    'commands' : IDL.Vec(Command),
  });
  const Shared__5 = IDL.Record({
    'internals' : IDL.Record({}),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'interest' : IDL.Nat }),
  });
  const Shared__1 = IDL.Record({
    'internals' : IDL.Record({}),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'interest' : IDL.Nat }),
  });
  const Shared__6 = IDL.Record({
    'internals' : IDL.Record({}),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'split' : IDL.Vec(IDL.Nat) }),
  });
  const Shared__7 = IDL.Record({
    'internals' : IDL.Record({ 'wait_until_ts' : IDL.Nat64 }),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({
      'interval_sec' : NumVariant,
      'max_amount' : NumVariant,
    }),
  });
  const Shared__3 = IDL.Record({
    'internals' : IDL.Record({
      'swap_fee_e4s' : IDL.Nat,
      'price_e16s' : IDL.Opt(IDL.Nat),
    }),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'max_slippage_e6s' : IDL.Nat }),
  });
  const Shared__2 = IDL.Record({
    'internals' : IDL.Record({}),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'interest' : IDL.Nat }),
  });
  const Shared__4 = IDL.Record({
    'internals' : IDL.Record({ 'total' : IDL.Nat, 'balance' : IDL.Nat }),
    'init' : IDL.Record({}),
    'variables' : IDL.Record({ 'flow' : Flow }),
  });
  const Shared = IDL.Variant({
    'lend' : Shared__5,
    'borrow' : Shared__1,
    'split' : Shared__6,
    'throttle' : Shared__7,
    'exchange' : Shared__3,
    'escrow' : Shared__2,
    'exchange_liquidity' : Shared__4,
  });
  const BillingTransactionFee = IDL.Variant({
    'none' : IDL.Null,
    'flat_fee_multiplier' : IDL.Nat,
    'transaction_percentage_fee' : IDL.Nat,
  });
  const EndpointOptIC = IDL.Record({
    'ledger' : IDL.Principal,
    'account' : IDL.Opt(Account),
  });
  const EndpointOptOther = IDL.Record({
    'platform' : IDL.Nat64,
    'ledger' : IDL.Vec(IDL.Nat8),
    'account' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const EndpointOpt = IDL.Variant({
    'ic' : EndpointOptIC,
    'other' : EndpointOptOther,
  });
  const DestinationEndpointResp = IDL.Record({
    'endpoint' : EndpointOpt,
    'name' : IDL.Text,
  });
  const EndpointIC = IDL.Record({
    'ledger' : IDL.Principal,
    'account' : Account,
  });
  const EndpointOther = IDL.Record({
    'platform' : IDL.Nat64,
    'ledger' : IDL.Vec(IDL.Nat8),
    'account' : IDL.Vec(IDL.Nat8),
  });
  const Endpoint = IDL.Variant({ 'ic' : EndpointIC, 'other' : EndpointOther });
  const SourceEndpointResp = IDL.Record({
    'balance' : IDL.Nat,
    'endpoint' : Endpoint,
    'name' : IDL.Text,
  });
  const GetNodeResponse = IDL.Record({
    'id' : LocalNodeId,
    'created' : IDL.Nat64,
    'active' : IDL.Bool,
    'modified' : IDL.Nat64,
    'controllers' : IDL.Vec(Controller),
    'custom' : IDL.Opt(Shared),
    'extractors' : IDL.Vec(LocalNodeId),
    'billing' : IDL.Record({
      'transaction_fee' : BillingTransactionFee,
      'expires' : IDL.Opt(IDL.Nat64),
      'current_balance' : IDL.Nat,
      'account' : Account,
      'frozen' : IDL.Bool,
      'cost_per_day' : IDL.Nat,
    }),
    'destinations' : IDL.Vec(DestinationEndpointResp),
    'sources' : IDL.Vec(SourceEndpointResp),
    'refund' : Account,
  });
  const ModifyNodeResponse = IDL.Variant({
    'ok' : GetNodeResponse,
    'err' : IDL.Text,
  });
  const CreateNodeResponse = IDL.Variant({
    'ok' : GetNodeResponse,
    'err' : IDL.Text,
  });
  const TransferResponse = IDL.Variant({ 'ok' : IDL.Nat64, 'err' : IDL.Text });
  const DeleteNodeResp = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const CommandResponse = IDL.Variant({
    'modify_node' : ModifyNodeResponse,
    'create_node' : CreateNodeResponse,
    'transfer' : TransferResponse,
    'delete_node' : DeleteNodeResp,
  });
  const BatchCommandResponse = IDL.Variant({
    'ok' : IDL.Record({
      'id' : IDL.Nat,
      'commands' : IDL.Vec(CommandResponse),
    }),
    'err' : IDL.Variant({
      'caller_not_controller' : IDL.Null,
      'expired' : IDL.Null,
      'other' : IDL.Text,
      'duplicate' : IDL.Nat,
      'invalid_signature' : IDL.Null,
    }),
  });
  const GetControllerNodesRequest = IDL.Record({
    'id' : Controller,
    'start' : LocalNodeId,
    'length' : IDL.Nat32,
  });
  const NodeShared = IDL.Record({
    'id' : LocalNodeId,
    'created' : IDL.Nat64,
    'active' : IDL.Bool,
    'modified' : IDL.Nat64,
    'controllers' : IDL.Vec(Controller),
    'custom' : IDL.Opt(Shared),
    'extractors' : IDL.Vec(LocalNodeId),
    'billing' : IDL.Record({
      'transaction_fee' : BillingTransactionFee,
      'expires' : IDL.Opt(IDL.Nat64),
      'current_balance' : IDL.Nat,
      'account' : Account,
      'frozen' : IDL.Bool,
      'cost_per_day' : IDL.Nat,
    }),
    'destinations' : IDL.Vec(DestinationEndpointResp),
    'sources' : IDL.Vec(SourceEndpointResp),
    'refund' : Account,
  });
  const GetNode = IDL.Variant({ 'id' : LocalNodeId, 'endpoint' : Endpoint });
  const BillingFeeSplit = IDL.Record({
    'platform' : IDL.Nat,
    'author' : IDL.Nat,
    'affiliate' : IDL.Nat,
    'pylon' : IDL.Nat,
  });
  const BillingPylon = IDL.Record({
    'operation_cost' : IDL.Nat,
    'freezing_threshold_days' : IDL.Nat,
    'min_create_balance' : IDL.Nat,
    'split' : BillingFeeSplit,
    'ledger' : IDL.Principal,
  });
  const Billing = IDL.Record({
    'transaction_fee' : BillingTransactionFee,
    'cost_per_day' : IDL.Nat,
  });
  const Version = IDL.Variant({
    'alpha' : IDL.Vec(IDL.Nat16),
    'beta' : IDL.Vec(IDL.Nat16),
    'release' : IDL.Vec(IDL.Nat16),
  });
  const LedgerIdx = IDL.Nat;
  const LedgerLabel = IDL.Text;
  const EndpointsDescription = IDL.Vec(IDL.Tuple(LedgerIdx, LedgerLabel));
  const ModuleMeta = IDL.Record({
    'id' : IDL.Text,
    'create_allowed' : IDL.Bool,
    'ledger_slots' : IDL.Vec(IDL.Text),
    'name' : IDL.Text,
    'billing' : Billing,
    'description' : IDL.Text,
    'supported_ledgers' : IDL.Vec(SupportedLedger),
    'author' : IDL.Text,
    'version' : Version,
    'destinations' : EndpointsDescription,
    'sources' : EndpointsDescription,
    'temporary_allowed' : IDL.Bool,
    'author_account' : Account,
  });
  const PylonMetaResp = IDL.Record({
    'name' : IDL.Text,
    'billing' : BillingPylon,
    'supported_ledgers' : IDL.Vec(SupportedLedger),
    'platform_account' : Account,
    'pylon_account' : Account,
    'request_max_expire_sec' : IDL.Nat64,
    'governed_by' : IDL.Text,
    'temporary_nodes' : IDL.Record({
      'allowed' : IDL.Bool,
      'expire_sec' : IDL.Nat64,
    }),
    'modules' : IDL.Vec(ModuleMeta),
  });
  const VirtualBalancesRequest = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const VirtualBalancesResponse = IDL.Vec(IDL.Tuple(SupportedLedger, IDL.Nat));
  const _anon_class_32_1 = IDL.Service({
    'add_supported_ledger' : IDL.Func(
        [IDL.Principal, IDL.Variant({ 'icp' : IDL.Null, 'icrc' : IDL.Null })],
        [],
        ['oneway'],
      ),
    'beat' : IDL.Func([], [], []),
    'get_ledger_errors' : IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Text))], ['query']),
    'get_ledgers_info' : IDL.Func([], [IDL.Vec(LedgerInfo)], ['query']),
    'icrc3_get_archives' : IDL.Func(
        [GetArchivesArgs],
        [GetArchivesResult],
        ['query'],
      ),
    'icrc3_get_blocks' : IDL.Func(
        [GetBlocksArgs],
        [GetBlocksResult],
        ['query'],
      ),
    'icrc3_get_tip_certificate' : IDL.Func(
        [],
        [IDL.Opt(DataCertificate)],
        ['query'],
      ),
    'icrc3_supported_block_types' : IDL.Func(
        [],
        [IDL.Vec(BlockType)],
        ['query'],
      ),
    'icrc55_command' : IDL.Func(
        [BatchCommandRequest],
        [BatchCommandResponse],
        [],
      ),
    'icrc55_get_controller_nodes' : IDL.Func(
        [GetControllerNodesRequest],
        [IDL.Vec(NodeShared)],
        ['query'],
      ),
    'icrc55_get_defaults' : IDL.Func([IDL.Text], [CreateRequest], ['query']),
    'icrc55_get_nodes' : IDL.Func(
        [IDL.Vec(GetNode)],
        [IDL.Vec(IDL.Opt(NodeShared))],
        ['query'],
      ),
    'icrc55_get_pylon_meta' : IDL.Func([], [PylonMetaResp], ['query']),
    'icrc55_virtual_balances' : IDL.Func(
        [VirtualBalancesRequest],
        [VirtualBalancesResponse],
        ['query'],
      ),
    'start' : IDL.Func([], [], ['oneway']),
  });
  return _anon_class_32_1;
};
export const init = ({ IDL }) => { return []; };
