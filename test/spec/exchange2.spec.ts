import { DF } from "../utils";

describe('Exchange 2', () => {

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
  it(`Add 2nd liquidity A-B`, async () => {

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBeApprox(expected_lp_balance*2n, 100_000n);
    expect(n1.total).toBeApprox(expected_lp_balance*2n, 100_000n);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBe(0n);
    expect(node.sources[PORT_1].balance).toBe(5001n);

  }, 600 * 1000);

  it(`Add 3rd liquidity A-B`, async () => {

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBeApprox(expected_lp_balance*3n, 100_000n);
    expect(n1.total).toBeApprox(expected_lp_balance*3n, 100_000n);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBe(0n);
    expect(node.sources[PORT_1].balance).toBe(12502n);

  }, 600 * 1000);

  it(`Add 4th flipped vector sources liquidity A-B`, async () => {

    let node = await createLPNode(LEDGER_B,LEDGER_A);
    await d.passTime(1);

    let a = 10_0000_0000n;
    let b = 20_0000_0000n;
    let n1 = await addLiquidity(node.id, LEDGER_B, LEDGER_A, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_B].fee) * (b - 2n*d.ledgers[LEDGER_A].fee));  

    expect(n1.balance).toBeApprox(expected_lp_balance, 100_000n);
    expect(n1.total).toBeApprox(expected_lp_balance*4n, 100_000n);

    let node_after = await d.u.getNode(node.id);

    expect(node_after.sources[PORT_0].balance).toBe(9168n);
    expect(node_after.sources[PORT_1].balance).toBe(0n);

  }, 600 * 1000);


  it(`Add 5th imbalanced liquidity A-B`, async () => {

    let a = 20_0000_0000n;
    let a_imba = 180_0000_0000n;
    let b = 10_0000_0000n;

    let n1 = await addLiquidity(0, LEDGER_A, LEDGER_B, a + a_imba, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBeApprox(4n * expected_lp_balance, 100_000n);
    expect(n1.total).toBeApprox(5n * expected_lp_balance, 100_000n);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBeApprox(a_imba, 100_000n);
    expect(node.sources[PORT_1].balance).toBe(0n);

  }, 600 * 1000);

 


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
  