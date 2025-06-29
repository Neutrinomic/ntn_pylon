#!/bin/sh
dfx canister --network ic stop transcendence
dfx canister --network ic snapshot create transcendence
dfx deploy --network ic transcendence --argument "(opt 
record {
     PYLON_NAME = \"Transcendence\";
     PYLON_GOVERNED_BY = \"Neutrinite DAO\";
     BILLING = record {
         ledger = principal \"f54if-eqaaa-aaaaq-aacea-cai\";
         min_create_balance = 200000000;
         operation_cost = 20000;
         freezing_threshold_days = 10;
         exempt_daily_cost_balance = null;
         split = record {
             platform = 20;
             pylon = 20;
             author = 40;
             affiliate = 20;
         };
         pylon_account = record {
             owner = principal \"eqsml-lyaaa-aaaaq-aacdq-cai\";
             subaccount = null;
         };
         platform_account = record {
             owner = principal \"eqsml-lyaaa-aaaaq-aacdq-cai\";
             subaccount = null;
         };
     };
     TEMP_NODE_EXPIRATION_SEC = 3600;
     MAX_INSTRUCTIONS_PER_HEARTBEAT = 300_000_000;
     REQUEST_MAX_EXPIRE_SEC = 3600;
     ALLOW_TEMP_NODE_CREATION = false;
 }
)"

dfx canister --network ic start transcendence
