
import { DF } from "../utils";

describe('Exchange liquidity', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  it(`Add liquidity initially`, async () => {


    let node = await d.u.createNode({
      'exchange_liquidity': {
        'init': { },
        'variables': {
          'flow': { 'add': null },
        },
      },
    },[1,2]);

    let a = 99990000n;
    let b = 59990000n;
    let a_fee = d.ledgers[1].fee;
    let b_fee = d.ledgers[2].fee;

    await d.u.sendToNode(node.id, 0, a, 1);
    await d.u.sendToNode(node.id, 1, b, 2);

    await d.passTime(5);

    expect(await d.u.getSourceBalance(node.id, 0)).toBe(a - a_fee);
    expect(await d.u.getSourceBalance(node.id, 1)).toBe(b - b_fee);

    await d.u.setDestination(node.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    await d.u.setDestination(node.id, 1, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });

    await d.passTime(10);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[0].balance).toBe(0n);
    expect(node_after.sources[1].balance).toBe(0n);

    let end = getInternals(node_after);

    let expected_lp_balance = d.sqrt((a - 2n*a_fee) * (b - 2n*b_fee));  
    expect(end.balance).toBe(expected_lp_balance);
    expect(end.total).toBe(expected_lp_balance);
    expect(await d.u.getSourceBalance(node.id, 0)).not.toBe(99980000n);


  }, 600 * 1000);


  
  it(`Add liquidity again to the same vector, same ratio`, async () => {
    let node = await d.u.getNode(0);
   
    let start = getInternals(node);
    
    let a = 99990000n;
    let b = 59990000n;
    let a_fee = d.ledgers[1].fee;
    let b_fee = d.ledgers[2].fee;

    await d.u.sendToNode(node.id, 0, a, 1);
    await d.u.sendToNode(node.id, 1, b, 2);

    await d.passTime(5);
    let node_after = await d.u.getNode(0);

    expect(node_after.sources[0].balance).toBe(0n);
    expect(node_after.sources[1].balance).toBeGreaterThan(0n);

    let end = getInternals(node_after);

    expect(end.balance).toBeGreaterThan(start.balance);
    expect(end.total).toBeGreaterThan(start.total);

    let expected_lp_balance = d.sqrt((a - 2n*a_fee) * (b - 2n*b_fee));  
    expect(end.balance).toBe(start.balance + expected_lp_balance);

  });

  
  // it(`Add liquidity again to the same vector, different ratio, more B`, async () => {
  //   let node = await d.u.getNode(0);
   
  //   let a = 69990000n;
  //   let b = 59990000n;

  //   await d.u.sendToNode(node.id, 0, a, 1);
  //   await d.u.sendToNode(node.id, 1, b, 2);

  //   await d.passTime(5);
  //   let node_after = await d.u.getNode(0);

  //   let end = getInternals(node_after);

  //   expect(end.balance).toBe(77428682n);

  // });

  // it(`Add liquidity again to the same vector, different ratio, more A`, async () => {
  //   let node = await d.u.getNode(0);
   
  //   let a = 99990000n;
  //   let b = 29990000n;

  //   await d.u.sendToNode(node.id, 0, a, 1);
  //   await d.u.sendToNode(node.id, 1, b, 2);

  //   await d.passTime(5);
  //   let node_after = await d.u.getNode(0);

  //   let end = getInternals(node_after);

  //   expect(end.balance).toBe(77428682n);

  // });

});






function getInternals(node: any) : { balance: bigint, total: bigint } {
  let inter = node.custom[0].exchange_liquidity.internals;
  return { balance: inter.balance, total: inter.total };
}