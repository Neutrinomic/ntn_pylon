#!/bin/sh



dfx canister --network ic call transcendence dex_pool_delete  "record {
    base = principal \"cngnf-vqaaa-aaaar-qag4q-cai\";
    quote = principal \"f54if-eqaaa-aaaaq-aacea-cai\";
}"