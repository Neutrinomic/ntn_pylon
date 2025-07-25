import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange btest', () => {

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
        from_price: 0.49,
        to_price: 0.51,
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
        from_price: 0.3,
        to_price: 0.7,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100000n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);

  it(`Add more range liquidity A-B only above price with gap`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.9,
        to_price: 1.0,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 300n);
    expect(n1.tokenB).toBeApprox(0n, 300n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(b - 1n*d.ledgers[LEDGER_B].fee, 100n);

  }, 600 * 1000);

  it(`Add more range liquidity A-B only above price without gap`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.6,
        to_price: 0.7,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);

    await d.passTime(30);

    // create exchange vector
    let nodex = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': b - 1n*d.ledgers[LEDGER_B].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_A, LEDGER_B]);

    //@ts-ignore
    expect(nodex.custom[0].exchange.internals.price[0]).toBe(0.5);


  

    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    d.inspect(n1);

    let nafter = await d.u.getNode(node.id);

    d.inspect(nafter.custom[0]);

    expect(n1.tokenA).toBeApprox(a - 11n*d.ledgers[LEDGER_A].fee, 1000000n);
    expect(n1.tokenB).toBeApprox(0n, 300n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(b - 1n*d.ledgers[LEDGER_B].fee, 100n);

  }, 600 * 1000);

  it(`Add more range liquidity A-B only bellow price with gap`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.1,
        to_price: 0.2,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(0n, 300n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 300n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(a - 1n*d.ledgers[LEDGER_A].fee, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);
    

  }, 600 * 1000);


  it(`Add more range liquidity A-B only bellow price without gap`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.3,
        to_price: 0.4,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(0n, 2000n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 10000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(a - 1n*d.ledgers[LEDGER_A].fee, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);

  it(`Add and remove range liquidity A-B`, async () => {

    let SUBACCOUNT_DEST_ID = 5;
    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.4,
        to_price: 0.6,
      }
    }, SUBACCOUNT_DEST_ID);


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100000n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100000n);

    let node_after = await d.u.getNode(node.id);

    //@ts-ignore
    let internal = node_after.custom[0].exchange_liquidity.internals;

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

    let resp = await d.u.modifyNodeCustom(node.id, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
          'range' : { "partial" : {
            'from_price': 0.40,
            'to_price': 0.60,
          } } 
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(5);

    
    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(SUBACCOUNT_DEST_ID)] }, LEDGER_A);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(SUBACCOUNT_DEST_ID)] }, LEDGER_B);


    expect(balance_a).toBeLessThan(a);
    expect(balance_b).toBeLessThan(b);

    expect(balance_a).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100000n);
    expect(balance_b).toBeApprox(b - 2n*d.ledgers[LEDGER_B].fee, 100000n);

    expect(balance_a).toBeApprox(a, 200000n);
    expect(balance_b).toBeApprox(b, 200000n);


  }, 600 * 1000);


});