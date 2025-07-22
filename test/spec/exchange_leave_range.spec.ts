import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange swap leave range ltest', () => {

  let d: ReturnType<typeof DF>

  let EU: ReturnType<typeof EUtil>;
  beforeAll(async () => { d = DF(undefined); EU=EUtil(d); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;

  const PORT_0 = 0;
  const PORT_1 = 1;


  it(`Add initial range liquidity A-B`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.40,
        to_price: 0.60,
      }
    }, 123);


    let a = 200_000_000_000n;
    let b = 100_000_000_000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);



  it(`Make exchange vector B->A`, async () => {
    let b = 50000_000_000n;

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


    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, b, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(12)] });

    await d.passTime(3);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(12)] }, LEDGER_A);


    expect(balance_a).toBeApprox(95428890274n, 50_000000n);
  });




  it(`Remove liquidity`, async () => {

    let SUBACCOUNT_DEST_ID = 123;

    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    
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


    expect(balance_a).toBeApprox(104552656864n, 100000n);
    expect(balance_b).toBeApprox(149970059428n, 100000n);



  }, 600 * 1000);


  it(`Add more liquidity A-B`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.40,
        to_price: 0.60,
      }
    }, 123);


    let a = 200_000_000_000n;
    let b = 100_000_000_000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100n);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);



});