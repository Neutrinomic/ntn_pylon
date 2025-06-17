#!/bin/sh
rm message.json
export PEM_FILE="$HOME/.config/dfx/identity/$(dfx identity whoami)/identity.pem"

./utils/build.sh
quill sns make-upgrade-canister-proposal 824f1a1df2652fb26c0fe1c03ab5ce69f2561570fb4d042cdc32dcb4604a4f03 --pem-file $PEM_FILE --target-canister-id togwv-zqaaa-aaaal-qr7aa-cai --canister-ids-file sns_canister_ids.json --summary-path proposal_summary.md --mode upgrade --wasm-path ./.dfx/ic/canisters/transcendence/transcendence.wasm.gz --canister-upgrade-arg "(opt 
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
)" > message.json 
