import { resolve } from 'node:path';
import { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';
import { Actor, PocketIc, createIdentity } from '@dfinity/pic';

import { _SERVICE as ICPLedgerService, idlFactory as ICPLedgerIdlFactory, init as icpInit, LedgerCanisterPayload as ICPLedgerCanisterPayload, QueryBlocksResponse, Block as ICPBlock, Transaction as ICPTransaction } from './ledger.idl.js';
import { _SERVICE as ICRCLedgerService, idlFactory as ICRCLedgerIdlFactory, init as icrcInit, LedgerArg as ICRCLedgerArg, GetTransactionsRequest, GetTransactionsResponse, Transaction as ICRCTransaction, Account } from '../icrc_ledger/ledger.idl.js';

import { AccountIdentifier, SubAccount } from '@dfinity/ledger-icp';

export const ICP_WASM_PATH = resolve(__dirname, "./ledger.wasm");

export async function realICPLedger(pic: PocketIc, can_id:Principal) {
    const actor = pic.createActor<ICPLedgerService>(ICPLedgerIdlFactory, can_id);
    return actor;
};

// Helper function to convert AccountIdentifier to map key
function accountIdentifierToKey(accountIdentifier: Uint8Array | number[] | undefined): string | null {
    if (!accountIdentifier) {
        return null;
    }
    if (accountIdentifier instanceof Uint8Array) {
        return Buffer.from(accountIdentifier).toString('hex');
    } else {
        return Buffer.from(accountIdentifier).toString('hex');
    }
}

// Helper function to get account from map or return default
function getAccountFromMap(accountIdentifier: Uint8Array | number[] | undefined): Account {
    if (!accountIdentifier) {
        return { owner: Principal.anonymous(), subaccount: [] };
    }
    const key = accountIdentifierToKey(accountIdentifier);
    if (!key) {
        return { owner: Principal.anonymous(), subaccount: [] };
    }
    return registered_accounts.get(key) || { owner: Principal.anonymous(), subaccount: [] };
}

// Helper function to convert ICP Block to ICRC Transaction
function convertICPBlockToICRCTransaction(block: ICPBlock): ICRCTransaction {
    const icpTx = block.transaction;
    
    // Initialize ICRC transaction with common fields
    const icrcTx: ICRCTransaction = {
        burn: [],
        kind: "",
        mint: [],
        approve: [],
        timestamp: block.timestamp.timestamp_nanos,
        transfer: []
    };

    // Convert operation to appropriate ICRC transaction type
    if (icpTx.operation && icpTx.operation.length > 0) {
        const operation = icpTx.operation[0];
        
        if ('Mint' in operation) {
            icrcTx.kind = "mint";
            icrcTx.mint = [{
                to: getAccountFromMap(operation.Mint.to),
                memo: icpTx.icrc1_memo,
                created_at_time: [icpTx.created_at_time.timestamp_nanos],
                amount: BigInt(operation.Mint.amount.e8s)
            }];
        } else if ('Burn' in operation) {
            icrcTx.kind = "burn";
            icrcTx.burn = [{
                from: getAccountFromMap(operation.Burn.from),
                memo: icpTx.icrc1_memo,
                created_at_time: [icpTx.created_at_time.timestamp_nanos],
                amount: BigInt(operation.Burn.amount.e8s),
                spender: operation.Burn.spender ? [getAccountFromMap(operation.Burn.spender[0])] : []
            }];
        } else if ('Transfer' in operation) {
            icrcTx.kind = "transfer";
            icrcTx.transfer = [{
                to: getAccountFromMap(operation.Transfer.to),
                fee: [BigInt(operation.Transfer.fee.e8s)],
                from: getAccountFromMap(operation.Transfer.from),
                memo: icpTx.icrc1_memo,
                created_at_time: [icpTx.created_at_time.timestamp_nanos],
                amount: BigInt(operation.Transfer.amount.e8s),
                spender: operation.Transfer.spender ? [getAccountFromMap(operation.Transfer.spender[0])] : []
            }];
        } else if ('Approve' in operation) {
            icrcTx.kind = "approve";
            icrcTx.approve = [{
                fee: [BigInt(operation.Approve.fee.e8s)],
                from: getAccountFromMap(operation.Approve.from),
                memo: icpTx.icrc1_memo,
                created_at_time: [icpTx.created_at_time.timestamp_nanos],
                amount: BigInt(operation.Approve.allowance.e8s),
                expected_allowance: operation.Approve.expected_allowance ? [BigInt(operation.Approve.expected_allowance[0].e8s)] : [],
                expires_at: operation.Approve.expires_at ? [operation.Approve.expires_at[0].timestamp_nanos] : [],
                spender: getAccountFromMap(operation.Approve.spender)
            }];
        }
    }

    return icrcTx;
}

let registered_accounts = new Map<string, Account>();

export function account2aid(account: Account) {
    return AccountIdentifier.fromPrincipal({
        principal: account.owner,
        subAccount: account.subaccount.length > 0 ? SubAccount.fromBytes(new Uint8Array(account.subaccount[0])) : undefined 
    });
}

// Function to register account mappings - calculates AccountIdentifier from Account
export function registerAccount(account: Account) {
    const accountIdentifier = account.subaccount.length > 0 
        ? AccountIdentifier.fromPrincipal({
            principal: account.owner,
            subAccount: SubAccount.fromBytes(new Uint8Array(account.subaccount[0]))
        })
        : AccountIdentifier.fromPrincipal({
            principal: account.owner
        });
    const key = accountIdentifier.toHex();
    registered_accounts.set(key, account);
}

export async function ICPLedger(pic: PocketIc, me:Principal, subnet:Principal | undefined, token_symbol: string, transfer_fee: bigint, decimals: number) {
    let me_address = AccountIdentifier.fromPrincipal({
        principal: me,
      }).toHex();
      
    let ledger_args:ICPLedgerCanisterPayload = {
        Init: {
            'send_whitelist' : [],
            'token_symbol' : [token_symbol],
            'transfer_fee' :[{e8s: transfer_fee}],
            'minting_account' : me_address,
            'maximum_number_of_accounts' : [],
            'accounts_overflow_trim_quantity' : [],
            'transaction_window' : [],
            'max_message_size_bytes' : [],
            'icrc1_minting_account' : [{owner: me, subaccount: []}],
            'archive_options' : [],
            'initial_values' : [[me_address, {e8s: 10000000000000n}]],
            'token_name' : [token_symbol],
            'feature_flags' : [],
        },
    };

    const fixture = await pic.setupCanister<ICPLedgerService>({
        idlFactory: ICPLedgerIdlFactory,
        wasm: ICP_WASM_PATH,
        arg: IDL.encode(icpInit({IDL}), [ledger_args]),
        ...subnet?{targetSubnetId: subnet}:{},
    });

    await pic.addCycles(fixture.canisterId, 100_000_000_000_000_000);   



    // Create a proxy that has ICRCLedgerService interface but forwards to ICP ledger
    const proxyActor = new Proxy(fixture.actor, {
        get(target, prop) {
            // If the property exists on the target, return it
            if (prop in target) {
                return target[prop as keyof typeof target];
            }
            
            // Handle custom methods
            if (prop === 'get_transactions') {
                return async function(request: GetTransactionsRequest): Promise<GetTransactionsResponse> {
                    let resp: QueryBlocksResponse = await fixture.actor.query_blocks({start: request.start, length: request.length});

                    // Convert ICP blocks to ICRC transactions
                    const transactions: ICRCTransaction[] = resp.blocks.map((block: ICPBlock) => {
                        return convertICPBlockToICRCTransaction(block);
                    });

                    // Convert archived blocks to archived transactions
                    const archived_transactions = resp.archived_blocks.map(archived => ({
                        start: archived.start,
                        length: archived.length,
                        callback: archived.callback as any // Type conversion for compatibility
                    }));

                    return {
                        first_index: resp.first_block_index,
                        log_length: resp.chain_length,
                        transactions: transactions,
                        archived_transactions: archived_transactions
                    };
                };
            }
            
            // For any other missing method, return undefined or throw an error
            return undefined;
        }
    }) as unknown as Actor<ICRCLedgerService>;
    
    return {
        canisterId: fixture.canisterId,
        actor: proxyActor
    };
};
