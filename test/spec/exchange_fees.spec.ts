import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange looptest', () => {

  let d: ReturnType<typeof DF>

  let EU: ReturnType<typeof EUtil>;
  beforeAll(async () => { d = DF(); EU=EUtil(d); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;

  const PORT_0 = 0;
  const PORT_1 = 1;



  it(`Add initial range liquidity A-B`, async () => {
    let SUBACCOUNT_DEST_ID = 123;

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.30001,
        to_price: 0.30002,
      }
    }, SUBACCOUNT_DEST_ID);


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBe(a - 2n*d.ledgers[LEDGER_A].fee);
    expect(n1.tokenB).toBe(b - 2n*d.ledgers[LEDGER_B].fee);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);


  it(`Make loop from exchange vectors B->A->B->A..`, async () => {
    let b = 500_0000_0000n;

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
    },[LEDGER_B, LEDGER_A]);

    let node2 = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': 10000_000n,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_A, LEDGER_B]);


    // Set destination
    await d.u.connectNodes(node.id, PORT_0, node2.id, PORT_0);
    await d.u.connectNodes(node2.id, PORT_0, node.id, PORT_0);

    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, b, LEDGER_B);

    await d.passTime(3);
    let node_after = await d.u.getNode(node.id);
    let node2_after = await d.u.getNode(node2.id);
    
  });




  it(`Remove liquidity`, async () => {

    let SUBACCOUNT_DEST_ID = 123;

    let a = 200_000_000_000n;
    let b = 100_000_000_000n;
    
    let resp = await d.u.modifyNodeCustom(0, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
          'range' : {'partial' : {
            'from_price': 0.40,
            'to_price': 0.60,
          }}
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(5);


    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(SUBACCOUNT_DEST_ID)] }, LEDGER_A);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(SUBACCOUNT_DEST_ID)] }, LEDGER_B);

    expect(balance_a).toBeApprox(33841624544n, 90000000n);
    expect(balance_b).toBeApprox(149969990002n, 90000000n);



  }, 600 * 1000);



  it(`Add more liquidity A-B while vectors are swapping`, async () => {

    let resp = await d.u.modifyNodeCustom(0, {
      'exchange_liquidity': {
          'flow': { 'add': null },
          'range' : {'partial' : {
            'from_price': 0.20,
            'to_price': 0.80,
          }}
      },
    });
    expect("ok" in resp).toBe(true);

    await d.u.setActive(1, false);

    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

    await d.u.sendToNode(1, PORT_0, 300_0000_0000n, LEDGER_B);
    await d.passTime(2);

    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 20000n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 20000n);

    let node_after = await d.u.getNode(0);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);


  it(`Remove liquidity`, async () => {

    let SUBACCOUNT_DEST_ID = 123;

    let a = 200_000_000_000n;
    let b = 100_000_000_000n;
    
    let resp = await d.u.modifyNodeCustom(0, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
          'range' : {'partial' : {
            'from_price': 0.40,
            'to_price': 0.60,
          }}
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(3);


    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(SUBACCOUNT_DEST_ID)] }, LEDGER_A);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(SUBACCOUNT_DEST_ID)] }, LEDGER_B);


    expect(balance_a).toBeApprox(233861562556n, 10000000n);
    expect(balance_b).toBeApprox(249964007686n, 10000000n);



  }, 600 * 1000);

});