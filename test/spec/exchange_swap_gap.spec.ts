import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange swap gap xtest', () => {

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

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.30,
        to_price: 0.31,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);


  it(`Add more range liquidity A-B `, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.35,
        to_price: 0.36,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100000n);
    expect(n1.tokenB).toBeApprox(0n, 100000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(b, 10000n);

  }, 600 * 1000);



  it(`Make exchange vector B->A`, async () => {
    let b = 500_000_000_000n;

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
    expect(node_after.sources[PORT_0].balance).toBe(367174267126n);

    // Check balance of destination
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(12)] }, LEDGER_A);


    expect(balance_a).toBeApprox(399999760000n, 50_0000n);
  });

});