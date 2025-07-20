import Account "mo:account";
import Core "mo:devefi/core";
import Ledgers "mo:devefi/ledgers";
import U "mo:devefi/utils";
import Result "mo:base/Result";
import Principal "mo:base/Principal";


module {


    public class Recover<system>({
        dvf : Ledgers.Ledgers;
        core : Core.Mod;
    }) {

      
    public func admin_recover_tokens({ledger: Principal; account: Text; send_to:Text}) : Result.Result<(), Text> {

            // This function will only be able to withdraw tokens sent to vectors 
            // with ledger sources they don't have, which results in stuck tokens

            let #ok(acc) = Account.fromText(account) else return #err("Invalid account");
            
            
            if (acc.subaccount == null) return #err("Subaccount is null");
            
            let ?(_vid, vec) = core.getNode(#endpoint(#ic({ledger; account = acc}))) else return #err("Node not found");
            
            let balance = dvf.balance(ledger, acc.subaccount);
            if (balance == 0) return #err("Balance is 0");
            
            var found = false;
            for (source in vec.sources.vals()) {
                let s = U.onlyIC(source.endpoint);
                if (s.ledger == ledger) found :=true;
            };

            if (found) return #err("Source doesn't need recovery"); // Make sure tokens aren't in a usable source

            let #ok(send_to_acc) = Account.fromText(send_to) else return #err("Invalid send account");

            switch(dvf.send({
                ledger = ledger;
                to = #icrc(send_to_acc);
                amount = balance;
                memo = null;
                from_subaccount = acc.subaccount;
            })) {
                case (#err(e)) return #err("Error: " # debug_show(e));
                case (#ok(_id)) ();
            };
            
            #ok();

    };


    public func admin_recover_unregistered_icp({account: Text; send_to:Text}) : async Result.Result<(), Text> {

        // This function will only be able to recover ICP that the canister doesn't know about
        // This happens when sending to unregistered addresses or making a mistake when entering subaccounts
        // Shouldn't be able to take tokens from a registered account
        
        let ledger = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
        let #ok(acc) = Account.fromText(account) else return #err("Invalid account");
        let #ok(send_to_acc) = Account.fromText(send_to) else return #err("Invalid send account");

        let balance = dvf.balance(ledger, acc.subaccount);
        if (balance != 0) return #err("Balance is not 0");
        if (acc.subaccount == null) return #err("Subaccount is null");
        if (dvf.isRegisteredSubaccount(acc.subaccount)) return #err("Subaccount is already registered");

        let icrc1_ledger = actor(Principal.toText(ledger)) : actor {
                icrc1_balance_of : shared query { owner: Principal; subaccount: ?Blob } -> async Nat;
                icrc1_fee : shared query () -> async Nat;
                icrc1_transfer : shared {
                    to: { owner: Principal; subaccount: ?Blob };
                    amount: Nat;
                    fee: ?Nat;
                    memo: ?Blob;
                    from_subaccount: ?Blob;
                    created_at_time: ?Nat64;
                } -> async { #Ok: Nat; #Err: { #BadFee: { expected_fee: Nat }; #BadBurn: { min_burn_amount: Nat }; #InsufficientFunds: { balance: Nat }; #TooOld: { allowed_window_nanos: Nat64 }; #CreatedInFuture: { ledger_time: Nat64 }; #Duplicate: { duplicate_of: Nat }; #TemporarilyUnavailable; #GenericError: { error_code: Nat; message: Text } } 
                };
        };
            
        let actual_balance = try {
            await icrc1_ledger.icrc1_balance_of(acc);
        } catch (_e) {
            0 // If error, assume balance is 0
        };

        if (actual_balance == 0) return #err("Unregistered balance is 0");

        let transfer_result = await icrc1_ledger.icrc1_transfer({
                to = send_to_acc;
                amount = actual_balance - 10_000; // 10k ICP fee
                fee = null;
                memo = null;
                from_subaccount = acc.subaccount;
                created_at_time = null;
            });

        switch (transfer_result) {
            case (#Ok(_id)) ();
            case (#Err(e)) return #err("Error: " # debug_show(e));
        };

        #ok();
    }
};

};