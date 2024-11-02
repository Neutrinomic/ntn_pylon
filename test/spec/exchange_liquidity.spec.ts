
import { DF } from "../utils";

describe('Exchange liquidity', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  async function createNode() : ReturnType<typeof d.u.createNode> {
    
    let node = await d.u.createNode({
      'exchange_liquidity': {
        'init': { },
        'variables': {
          'flow': { 'add': null },
        },
      },
    },[0,1]);


    await d.u.setDestination(node.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    await d.u.setDestination(node.id, 1, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    return node;
  }

  it(`Create liquidity vector`, async () => {

    await createNode();
    await d.passTime(1);

  }, 600 * 1000);


  async function addLiquidity(node_id:number, a: bigint, b: bigint) : Promise<{ balance: bigint, total: bigint }> {
    

    await d.u.sendToNode(node_id, 0, a, 0);
    await d.u.sendToNode(node_id, 1, b, 1);

    await d.passTime(3);

    let node_after = await d.u.getNode(node_id);

    let end = getInternals(node_after);
    return end; 
  }


  it(`Add initial liquidity`, async () => {

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(0, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[1].fee) * (b - 2n*d.ledgers[2].fee));  

    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(expected_lp_balance);

    let node = await d.u.getNode(0);

    expect(node.sources[0].balance).toBe(0n);
    expect(node.sources[1].balance).toBe(0n);

  }, 600 * 1000);
  
  it(`Add same liquidity second time`, async () => {

    let node = await createNode();

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(node.id, a, b);

    let expected_lp_balance = 1414185249n;
    let lp_perc = n1.balance * 100000n / n1.total;
    expect(lp_perc).toBe(49999n);
    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(2828377598n);

  });
  
  it(`Add same liquidity third time`, async () => {

    let node = await createNode();

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(node.id, a, b);

    let expected_lp_balance = 1414181713n;
    let lp_perc = n1.balance * 100000n / n1.total;
    expect(lp_perc).toBe(33333n);
    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(4242559311n);

  });

  it("Remove liquidity of node 0", async () => {


    let resp = await d.u.modifyNodeCustom(0, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(5);

    
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, 0);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, 1);

    expect(balance_a).toBe(1999978360n);
    expect(balance_b).toBe(999970000n);

  });

  it("Remove liquidity of node 1", async () => {


    let resp = await d.u.modifyNodeCustom(1, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(5);

    
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, 0);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, 1);

    expect(balance_a).toBe(3999946680n);
    expect(balance_b).toBe(1999934980n);

  });


  it(`Add same liquidity third time`, async () => {

    await d.u.modifyNodeCustom(1, {
      'exchange_liquidity': {
          'flow': { 'add': null },
      },
    });

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(1, a, b);

    let expected_lp_balance = 1414179337n;
    let lp_perc = n1.balance * 100000n / n1.total;
    expect(lp_perc).toBe(49999n);
    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(2828361050n);

  });

  it(`Make exchange vector`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'interest': 1n,
        },
      },
    },[0,1]);

    let a = 5000_0000n;
    
    // Send funds to source 1
    await d.u.sendToNode(node.id, 0, a, 0);

    // Set destination
    await d.u.setDestination(node.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] });

    await d.passTime(3);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] }, 1);

    expect(balance_b).toBe(2393_0752n);
  });

});






function getInternals(node: any) : { balance: bigint, total: bigint } {
  let inter = node.custom[0].exchange_liquidity.internals;
  return { balance: inter.balance, total: inter.total };
}