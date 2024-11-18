import { DF } from "../utils";
import { EUtil } from "../utils_exchange";

describe('Exchange 2', () => {

  let d: ReturnType<typeof DF>

  let EU: ReturnType<typeof EUtil>;
  beforeAll(async () => { d = DF(); EU=EUtil(d); await d.beforeAll(); });
  
  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;

  const PORT_0 = 0;
  const PORT_1 = 1;


  it(`Create liquidity vector`, async () => {

    await EU.createLPNode(LEDGER_A, LEDGER_B);
    await d.passTime(1);

  }, 600 * 1000);

  it(`Add initial liquidity A-B`, async () => {

    let a = 20_0000_0000n;
    let b = 10_0000_0000n;
    let n1 = await EU.addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

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
    let n1 = await EU.addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

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
    let n1 = await EU.addLiquidity(0, LEDGER_A, LEDGER_B, a, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBeApprox(expected_lp_balance*3n, 100_000n);
    expect(n1.total).toBeApprox(expected_lp_balance*3n, 100_000n);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBe(0n);
    expect(node.sources[PORT_1].balance).toBe(12502n);

  }, 600 * 1000);

  it(`Add 4th flipped vector sources liquidity A-B`, async () => {

    let node = await EU.createLPNode(LEDGER_B,LEDGER_A);
    await d.passTime(1);

    let a = 10_0000_0000n;
    let b = 20_0000_0000n;
    let n1 = await EU.addLiquidity(node.id, LEDGER_B, LEDGER_A, a, b);

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

    let n1 = await EU.addLiquidity(0, LEDGER_A, LEDGER_B, a + a_imba, b);

    let expected_lp_balance = d.sqrt((a - 2n*d.ledgers[LEDGER_A].fee) * (b - 2n*d.ledgers[LEDGER_B].fee));  

    expect(n1.balance).toBeApprox(4n * expected_lp_balance, 100_000n);
    expect(n1.total).toBeApprox(5n * expected_lp_balance, 100_000n);

    let node = await d.u.getNode(0);

    expect(node.sources[PORT_0].balance).toBeApprox(a_imba, 100_000n);
    expect(node.sources[PORT_1].balance).toBe(0n);

  }, 600 * 1000);

 


});

