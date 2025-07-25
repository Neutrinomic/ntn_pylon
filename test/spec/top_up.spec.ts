
import { DF, LEDGER_TYPE } from "../utils";

describe('Top-up vector', () => {

    let d: ReturnType<typeof DF>
  
    beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });
  
    afterAll(async () => { await d.afterAll(); });
  
  
    it(`Temporary vector`, async () => {
  
  
      let node = await d.u.createNode({
        'throttle': {
          'init': {  },
          'variables': {
            'interval_sec': { 'fixed': 61n },
            'max_amount': { 'fixed': 10000000n }
          },
        },
      });
  
  
      expect(node.billing.expires[0]).toBeDefined();
      expect(node.billing.current_balance).toBe(0n);
    });
    

    it(`Top-up vector`, async () => {

            
        if (LEDGER_TYPE == 'icp') {
            await d.pylon.icrc55_account_register(d.u.mainAccount());
        }
        let billing_account = d.u.userBillingAccount();
        await d.u.sendToAccount(billing_account,  10_0000_0000n);
        await d.passTime(3);


        await d.u.topUpNode(0, 1_0000_0000n);

        let node = await d.u.getNode(0);

        expect(node.billing.current_balance).toBe(99990000n);
    });
});