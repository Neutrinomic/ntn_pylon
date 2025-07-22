
import { DF } from "../utils";

describe('Delete', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  it(`Create and delete`, async () => {


    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    await d.u.deleteNode(node.id)

    await expect(d.u.getNode(node.id)).rejects.toThrow('Node not found');


  }, 600 * 1000);

  
  it(`Check refunding of sources after deletion`, async () => {

    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    await d.u.sendToNode(node.id, 0, 1_0000_0000n);
    await d.passTime(5);


    await d.u.deleteNode(node.id)

    await expect(d.u.getNode(node.id)).rejects.toThrow('Node not found');
    await d.passTime(10);
    let refund_account = d.u.getRefundAccount();

    let refund = await d.u.getLedgerBalance(refund_account);

    expect(refund).toBe(1_0000_0000n - d.ledgers[0].fee*2n);

  
  }, 600 * 1000);



  it(`Check refunding of node billing account after deletion`, async () => {

    let billing_account = d.u.userBillingAccount();
    await d.u.sendToAccount(billing_account,  10_0000_0000n);
    
    await d.passTime(5);

    let node = await d.u.createNode({
      'throttle': {
        'init': {  },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 30000000n }
        },
      },
    },[0],{temporary:false});

    await d.u.sendToNode(node.id, 0, 1_0000_0000n);
    await d.passTime(5);


    await d.u.deleteNode(node.id)

    await expect(d.u.getNode(node.id)).rejects.toThrow('Node not found');
    await d.passTime(2);
    
    let refund_account = d.u.getRefundAccount();

    let refund = await d.u.getLedgerBalance(refund_account);


    let pmeta = await d.u.getPylonMeta();
    expect(refund).toBe(219940000n);

  }, 600 * 1000);

});

