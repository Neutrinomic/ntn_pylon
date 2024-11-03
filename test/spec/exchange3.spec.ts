import { DF } from "../utils";

describe('Exchange 3', () => {

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



  it(`Create liquidity vector (1) A-B`, async () => {

    await createLPNode(LEDGER_A, LEDGER_B);
    await d.passTime(1);


    let a = 2000_0000_0000n;
    let b = 1000_0000_0000n;
    let n1 = await addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBe(expected_lp_balance);
    expect(n1.total).toBe(expected_lp_balance);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBe(0n);
    expect(node.sources[PORT_1].balance).toBe(0n);

  });


  it(`Swap a lot and generate fees`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 80_000n,
        },
      },
    },[LEDGER_A,LEDGER_B]);

    let node2 = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 80_000n,
        },
      },
    },[LEDGER_B,LEDGER_A]);

    await d.u.connectNodes(node.id, 0, node2.id, 0);
    await d.u.connectNodes(node2.id, 0, node.id, 0);


    let a = 5_0000_0000n;
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);

    await d.passTime(30);

  });

  it(`Remove liquidity A-B check fees collected`, async () => {

    let resp = await d.u.modifyNodeCustom(0, {
      'exchange_liquidity': {
          'flow': { 'remove': null },
      },
    });

    expect("ok" in resp).toBe(true);
    
    await d.passTime(5);

    let balance_a = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, LEDGER_A);
    let balance_b = await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] }, LEDGER_B);

    let init_a = 2000_0000_0000n;
    let init_b = 1000_0000_0000n;
    let init_value = d.sqrt((init_a - 2n*d.ledgers[LEDGER_A].fee) * (init_b - 2n*d.ledgers[LEDGER_B].fee));
    let after_value = d.sqrt((balance_a - 2n*d.ledgers[LEDGER_A].fee) * (balance_b - 2n*d.ledgers[LEDGER_B].fee));
    let value_perc_increase = (after_value - init_value) * 100000n / init_value;
    expect(value_perc_increase).toBeGreaterThan(114); //1.14% increase in value

  });

  async function addLiquidity(node_id:number, ledger_one:number, ledger_two:number, a: bigint, b: bigint) : Promise<{ balance: bigint, total: bigint }> {
    

    await d.u.sendToNode(node_id, PORT_0, a, ledger_one);
    await d.u.sendToNode(node_id, PORT_1, b, ledger_two);

    await d.passTime(3);

    let node_after = await d.u.getNode(node_id);

    let end = getInternals(node_after);
    return end; 
  }



    function getInternals(node: any) : { balance: bigint, total: bigint } {
        let inter = node.custom[0].exchange_liquidity.internals;
        return { balance: inter.balance, total: inter.total };
    }

});


expect.extend({
    toBeApprox(received, expected, tolerance = 10n) {
      if (typeof received !== 'bigint' || typeof expected !== 'bigint') {
        return {
          message: () => `expected ${received} and ${expected} to be of type BigInt`,
          pass: false,
        };
      }
      const pass = received >= expected - tolerance && received <= expected + tolerance;
      if (pass) {
        return {
          message: () => `expected ${received} not to be approximately ${expected} within tolerance ${tolerance}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be approximately ${expected} within tolerance ${tolerance}`,
          pass: false,
        };
      }
    },
  });
  