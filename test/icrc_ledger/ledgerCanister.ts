import { resolve } from 'node:path';
import { PocketIc } from '@dfinity/pic';
import { _SERVICE as ICRCLedgerService, idlFactory, init, LedgerArg } from './ledger.idl';
import { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';

let WASM_PATH = resolve(__dirname, "../icrc_ledger/ledger.wasm");
if (process.env['LEDGER'] === "motoko") {
    console.log("🚀🦀 USING MOTOKO LEDGER - BRACE FOR IMPACT! 💥🦑");
    WASM_PATH = resolve(__dirname, "../icrc_ledger/motoko_ledger.wasm");
}

export async function ICRCLedger(pic: PocketIc, me:Principal, subnet:Principal | undefined, symbol:string, fee: bigint = 10000n, decimals:number = 8) {
   
    let ledger_args:LedgerArg = {
        Init: {
            minting_account: {
                owner: me,
                subaccount: []
            },
            fee_collector_account: [],
            transfer_fee: fee,
            decimals: [decimals],
            token_symbol: symbol,
            token_name: symbol + " Coin",
            metadata: [],
            initial_balances: [[{ owner: me, subaccount:[] }, 10000000000000n]],
            archive_options: {
                num_blocks_to_archive: 1000n,
                trigger_threshold: 9000n,
                controller_id: me,
                max_transactions_per_response: [],
                max_message_size_bytes: [],
                cycles_for_archive_creation: [],
                node_max_memory_size_bytes: [],
            },
            maximum_number_of_accounts: [],
            accounts_overflow_trim_quantity: [],
            max_memo_length: [],
            feature_flags: [{ icrc2: true }],            
        },
    };

    const fixture = await pic.setupCanister<ICRCLedgerService>({
        idlFactory,
        wasm: WASM_PATH,
        arg: IDL.encode(init({IDL}), [ledger_args]),
        ...subnet?{targetSubnetId: subnet}:{},
    });

    await pic.addCycles(fixture.canisterId, 100_000_000_000_000);


    return fixture;
};


export { ICRCLedgerService };