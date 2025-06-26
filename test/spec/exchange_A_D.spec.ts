import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange adtest', () => {

  let d: ReturnType<typeof DF>

  let EU: ReturnType<typeof EUtil>;
  beforeAll(async () => { d = DF(); EU=EUtil(d); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;
  const LEDGER_D = 3;

  const PORT_0 = 0;
  const PORT_1 = 1;


  it(`Add initial range liquidity A-B`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_B, {
      partial : {
        from_price: 0.9,
        to_price: 1.1,
      }
    });

  
    let a = 200_000_000_000n;
    let b = 100_000_000_000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_B, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 12n*d.ledgers[LEDGER_A].fee, 100000n);
    expect(n1.tokenB).toBeApprox(b - 12n*d.ledgers[LEDGER_B].fee, 100000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);

  it(`Add initial range liquidity B-C`, async () => {

    let node = await EU.createLPNode(LEDGER_B, LEDGER_C, {
      partial : {
        from_price: 0.9,
        to_price: 1.1,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_B, LEDGER_C, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 12n*d.ledgers[LEDGER_B].fee, 100000n);
    expect(n1.tokenB).toBeApprox(b - 12n*d.ledgers[LEDGER_C].fee, 100000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);


  it(`Add initial range liquidity C-D`, async () => {

    let node = await EU.createLPNode(LEDGER_C, LEDGER_D, {
      partial : {
        from_price: 0.9,
        to_price: 1.1,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_C, LEDGER_D, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    expect(n1.tokenA).toBeApprox(a - 12n*d.ledgers[LEDGER_C].fee, 1000000n);
    expect(n1.tokenB).toBeApprox(b - 12n*d.ledgers[LEDGER_D].fee, 1000000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);





  it(`Make exchange vector A->D`, async () => {
    let a = 100000_000_000n;

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 22.0,
          'max_rate': [],
          'buy_for_amount': a - 1n*d.ledgers[LEDGER_A].fee,
          'buy_interval_seconds': 5n,
        },
      },
    },[LEDGER_A, LEDGER_D]);


    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(12)] });

    await d.passTime(50);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);
    d.inspect(node_after);
    // Check balance of destination
    let balance_out = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(12)] }, LEDGER_D);

    
    expect(balance_out).toBeApprox(85889939755n, 50_0000n);
  });



  it(`Add initial range liquidity A-D`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_D, {
      partial : {
        from_price: 0.6,
        to_price: 1.1,
      }
    });


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_D, a, b);


    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);
    let node_afterb = await d.u.getNode(node.id);
    d.inspect(node_afterb);
    expect(n1.tokenA).toBeApprox(a - 2n*d.ledgers[LEDGER_A].fee, 100n);
    expect(n1.tokenB).toBeApprox(b - 2n*d.ledgers[LEDGER_D].fee, 100n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 100n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 100n);

  }, 600 * 1000);


  it(`Add more range liquidity A-D`, async () => {

    let node = await EU.createLPNode(LEDGER_A, LEDGER_D, {
      partial : {
        from_price: 0.6,
        to_price: 1.1,
      }
    });


    let a = 200_0000_0000n;
    let b = 200_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_A, LEDGER_D, a, b);

    let node_after = await d.u.getNode(node.id);


    expect(node_after.sources[PORT_0].balance).toBeApprox(0n, 10n);
    expect(node_after.sources[PORT_1].balance).toBeApprox(0n, 10n);

    expect(n1.tokenA).toBeLessThan(a);
    expect(n1.tokenB).toBeLessThan(b);

    let diff_a = (a - 12n*d.ledgers[LEDGER_A].fee) - n1.tokenA;
    let diff_b = (b - 12n*d.ledgers[LEDGER_D].fee) - n1.tokenB;
   
    expect(diff_a).toBeLessThan(2000n); // Depends on the range from and to, each tick a may loose 1 because of rounding errors
    expect(diff_b).toBeLessThan(2000n);



  }, 600 * 1000);

  it(`Make exchange vector A->D`, async () => {
    let a = 20000_000_000n;
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
    },[LEDGER_A, LEDGER_D]);

 

    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(14)] });

    await d.passTime(3);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_out = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(14)] }, LEDGER_D);
    
    expect(balance_out).toBeApprox(14779847371n, 50_0000n);
  });


  it(`Make exchange vector D->A`, async () => {
    let a = 900_654_4621n;
    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': a - 1n*d.ledgers[LEDGER_D].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_D, LEDGER_A]);



    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_D);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(987)] });

    await d.passTime(3);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_out = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(987)] }, LEDGER_A);
    
    expect(balance_out).toBeApprox(12180971533n, 1000n);
  });










  it(`Make exchange vector D->B`, async () => {

    let a = 100_000_000n;

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': a - 1n*d.ledgers[LEDGER_D].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_D, LEDGER_B]);



    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_D);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(332)] });

    await d.passTime(3);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_out = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(332)] }, LEDGER_B);
    
    expect(balance_out).toBeApprox(119595224n, 50_0000n);
  });


  it(`Make exchange vector B->D`, async () => {

    let a = 100_000_000n;

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_impact': 8.0,
          'max_rate': [],
          'buy_for_amount': a - 1n*d.ledgers[LEDGER_B].fee,
          'buy_interval_seconds': 10n,
        },
      },
    },[LEDGER_B, LEDGER_D]);



    // Send funds to source 1
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_B);

    // Set destination
    await d.u.setDestination(node.id, PORT_0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(4123)] });

    await d.passTime(3);

    let node_after = await d.u.getNode(node.id);
    expect(node_after.sources[PORT_0].balance).toBe(0n);

    // Check balance of destination
    let balance_out = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(4123)] }, LEDGER_D);
    
    expect(balance_out).toBeApprox(81609448n, 50_0000n);
  });

});