#!/bin/sh

dfx canister --network ic call transcendence dex_pool_create  "record {
    base = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\";
    quote = principal \"f54if-eqaaa-aaaaq-aacea-cai\";
}"

dfx canister --network ic call transcendence dex_pool_create  "record {
    base = principal \"zfcdd-tqaaa-aaaaq-aaaga-cai\";
    quote = principal \"f54if-eqaaa-aaaaq-aacea-cai\";
}"

dfx canister --network ic call transcendence dex_pool_create  "record {
    base = principal \"mxzaz-hqaaa-aaaar-qaada-cai\";
    quote = principal \"f54if-eqaaa-aaaaq-aacea-cai\";
}"