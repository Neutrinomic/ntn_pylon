import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange xctest', () => {

  let d: ReturnType<typeof DF>

  let EU: ReturnType<typeof EUtil>;
  beforeAll(async () => { d = DF(undefined); EU=EUtil(d); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;

  const PORT_0 = 0;
  const PORT_1 = 1;




  it(`Add initial range liquidity A-B bellow and above price`, async () => {


    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.99,
        to_price: 1.01,
      }
    });

    
    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);


  it(`Make exchange vector A->B`, async () => {
    let a = 2000_000_000n;


    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': a - 1n*d.ledgers[LEDGER_A].fee,
          'buy_interval_seconds': 10n,
        },
      },
    }, [LEDGER_A, LEDGER_B]);


    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] });

    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    
    await d.passTime(10);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] }, LEDGER_B);


    expect(balance_b).toBe(1993978060n);
  });

  it(`Make exchange vector B->A`, async () => {
    let b = 9940354n;

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': b - 1n*d.ledgers[LEDGER_B].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_B,LEDGER_A]);


    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, b, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] });

    await d.passTime(3);


    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(51)] }, LEDGER_A);

    // d.inspect(node_after);

    expect(balance_a).toBe(9896545n);
    
  });


  it(`Make exchange vector B->A`, async () => {
    let b = 994035400n;

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': b - 1n*d.ledgers[LEDGER_B].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_B,LEDGER_A]);


    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, b, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(52)] });

    await d.passTime(3);

    
    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(52)] }, LEDGER_A);


    expect(balance_a).toBe(991039306n);
  });


  it(`Make exchange vector A->B`, async () => {
    let a = 20_000_00000n;

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': a - 1n*d.ledgers[LEDGER_A].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_A,LEDGER_B]);


    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(53)] });

    await d.passTime(3);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(53)] }, LEDGER_B);


    expect(balance_b).toBe(1993978060n);
  });

});

