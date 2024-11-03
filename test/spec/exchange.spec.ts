
import { DF } from "../utils";

describe('Exchange', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;

  const PORT_0 = 0;
  const PORT_1 = 1;

  async function createLPNode(ledger_one_id: number, ledger_two_id: number ) : ReturnType<typeof d.u.createNode> {
    
    let node = await d.u.createNode({
      'exchange_liquidity': {
        'init': { },
        'variables': {
          'flow': { 'add': null },
        },
      },
    },[ledger_one_id,ledger_two_id]);


    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    await d.u.setDestination(node.id, PORT_1, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    return node;
  }


  async function addLiquidity(node_id:number, ledger_one:number, ledger_two:number, a: bigint, b: bigint) : Promise<{ balance: bigint, total: bigint }> {
    

    await d.u.sendToNode(node_id, PORT_0, a, ledger_one);
    await d.u.sendToNode(node_id, PORT_1, b, ledger_two);

    await d.passTime(3);

    let node_after = await d.u.getNode(node_id);

    let end = getInternals(node_after);
    return end; 
  }

  it(`Create liquidity vector`, async () => {

    await createLPNode(LEDGER_A, LEDGER_B);
    await d.passTime(1);

  }, 600 * 1000);

  it(`Add initial liquidity A-B`, async () => {

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(expected_lp_balance);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBe(0n);
    expect(node.sources[PORT_1].balance).toBe(0n);

  }, 600 * 1000);
  
  it(`Add same liquidity second time A-B`, async () => {

    let node = await createLPNode(LEDGER_A, LEDGER_B);

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = 1414185276n;
    let lp_perc = n1.balance * 100000n / n1.total;
    expect(lp_perc).toBe(49999n);
    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(2828377625n);

  });
  
  it(`Add same liquidity third time A-B`, async () => {

    let node = await createLPNode(LEDGER_A, LEDGER_B);

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = 1414181740n;
    let lp_perc = n1.balance * 100000n / n1.total;
    expect(lp_perc).toBe(33333n);
    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(4242559365n);

  });

  it("Remove liquidity of node 0", async () => {


    let resp = await d.u.modifyNodeCustom(0, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(5);

    
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, LEDGER_A);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, LEDGER_B);

    expect(balance_a).toBe(1999978335n);
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

    
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, LEDGER_A);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, LEDGER_B);

    expect(balance_a).toBe(3999946667n);
    expect(balance_b).toBe(1999934999n);

  });

  it(`Add same liquidity after removing A-B`, async () => {

    await d.u.modifyNodeCustom(1, {
      'exchange_liquidity': {
          'flow': { 'add': null },
      },
    });

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(1, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = 1414179382n;
    let lp_perc = n1.balance * 100000n / n1.total;
    expect(lp_perc).toBe(49999n);
    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(2828361122n);

  });

  it(`Make exchange vector A->B`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 20_000n,
        },
      },
    },[LEDGER_A,LEDGER_B]);

    let a = 5000_0000n;
    
    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] });

    await d.passTime(3);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] }, LEDGER_B);

    expect(balance_b).toBe(2458_7144n);
  });

  it(`Make exchange vector B->A`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 80_000n,
        },
      },
    },[LEDGER_B,LEDGER_A]);

    let a = 5000_0000n;
    
    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(52)] });

    await d.passTime(3);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(52)] }, LEDGER_A);

    expect(balance_b).toBe(9962_2183n);
  });

  it(`Add initial liquidity A-C`, async () => {

    let node = await createLPNode(LEDGER_A, LEDGER_C);

    let a = 10_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(node.id, LEDGER_A, LEDGER_C, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(expected_lp_balance);

    let node_after = await d.u.getNode(0);

    expect(node_after.sources[PORT_0].balance).toBe(0n);
    expect(node_after.sources[PORT_1].balance).toBe(0n);

  });

  it(`Add second liquidity A-C`, async () => {

    let node = await createLPNode(LEDGER_A, LEDGER_C);

    let a = 10_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(node.id, LEDGER_A, LEDGER_C, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_C].fee));  

    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(1999960000n);

    let node_after = await d.u.getNode(0);

    expect(node_after.sources[PORT_0].balance).toBe(0n);
    expect(node_after.sources[PORT_1].balance).toBe(0n);

  });

  it(`Make exchange vector A->C`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 40_000n,
        },
      },
    },[LEDGER_A,LEDGER_C]);

    let a = 5000_0000n;
    
    //@ts-ignore
    let price_e16s = node.custom[0].exchange.internals.price_e16s[0];
    expect(price_e16s).toBe(1_0000_0000_0000_0000n);

    //@ts-ignore
    let swap_fee_e4s = node.custom[0].exchange.internals.swap_fee_e4s;
    
    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(52)] });

    await d.passTime(3);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(52)] }, LEDGER_C);
    let expected_bal = 4859_5143n;
    
    expect(balance_b).toBe(expected_bal);
    let exchange_slippage = ((a - balance_b)*100_0000n)/a;
    expect(exchange_slippage).toBeLessThan(40_000n);
  });

  it(`Make exchange vector with indirect pair B->C`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 80_000n,
        },
      },
    },[LEDGER_B,LEDGER_C]);

    let a = 5000_0000n;
    
    //@ts-ignore
    let price_e16s = node.custom[0].exchange.internals.price_e16s[0];
    expect(price_e16s).toBe(18566647603145920n);

    //@ts-ignore
    let swap_fee_e4s = node.custom[0].exchange.internals.swap_fee_e4s;
    
  
    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(53)] });

    await d.passTime(3);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(53)] }, LEDGER_C);
    let expected_without_slippage = a * price_e16s / 1_0000_0000_0000_0000n;
    let expected_bal = 86000391n;
    expect(balance_b).toBe(expected_bal);

    let calc_slippage = ((expected_without_slippage - expected_bal)*100_0000n)/expected_without_slippage;
    expect(calc_slippage).toBe(73_603n);
    let exchange_slippage = ((a - balance_b)*100_0000n)/a;
    expect(exchange_slippage).toBeLessThan(40_000n);
  });

  it(`Make exchange vector with indirect pair B->C with lower than current slippage`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 20_000n,
        },
      },
    },[LEDGER_B,LEDGER_C]);

    let a = 5000_0000n;
    
    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(54)] });

    await d.passTime(3);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(54)] }, LEDGER_C);
    
    
    expect(balance_b).toBe(0n);
    

    let node_after = await d.u.getNode(node.id);
    let source_balance = node_after.sources[PORT_0].balance;
    expect(source_balance).toBe(a - d.ledgers[LEDGER_B].fee);
  });

});



function getInternals(node: any) : { balance: bigint, total: bigint } {
  let inter = node.custom[0].exchange_liquidity.internals;
  return { balance: inter.balance, total: inter.total };
}