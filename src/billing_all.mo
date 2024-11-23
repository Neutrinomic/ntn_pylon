import ICRC55 "mo:devefi/ICRC55";
import Principal "mo:base/Principal";

module {

    // These should be defined in each vector module, these are for example

    public func get() : [ICRC55.Billing] {
           [{
                cost_per_day = 50_0000;
                transaction_fee = #none;
           },{
                cost_per_day = 10_0000;
                transaction_fee = #none;
           }];
          
    };

    public func authorAccount() : ICRC55.Account {
        {
            owner = Principal.fromText("w5lsv-wwgbv-k3xoh-k7htd-s4nqy-eswyt-hjphb-rnhvv-zx2rm-st2h3-zae");
            subaccount = null;
        }
    }
}