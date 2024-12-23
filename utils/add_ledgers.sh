#!/bin/sh

dfx canister --network ic call transcendence add_supported_ledger  "(
    principal \"f54if-eqaaa-aaaaq-aacea-cai\",
    variant {icrc}
)"

dfx canister --network ic call transcendence add_supported_ledger  "(
    principal \"zfcdd-tqaaa-aaaaq-aaaga-cai\",
    variant {icrc}
)"

dfx canister --network ic call transcendence add_supported_ledger  "(
    principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\",
    variant {icp}
)"


dfx canister --network ic call transcendence add_supported_ledger  "(
    principal \"mxzaz-hqaaa-aaaar-qaada-cai\",
    variant {icrc}
)"
