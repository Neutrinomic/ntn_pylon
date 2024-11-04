import { DF } from "../utils";
import { EUtil } from "../utils_exchange";


describe('Exchange Swap without LP', () => {

  let d: ReturnType<typeof DF>;
  let EU: ReturnType<typeof EUtil>;
  beforeAll(async () => { d = DF(); EU=EUtil(d); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;

  const PORT_0 = 0;
  const PORT_1 = 1;


  it(`Create swap vectors`, async () => {

    let node = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 80_000n,
        },
      },
    },[LEDGER_A, LEDGER_B]);

    let node2 = await d.u.createNode({
      'exchange': {
        'init': { },
        'variables': {
          'max_slippage_e6s': 80_000n,
        },
      },
    },[LEDGER_B, LEDGER_A]);


    let a = 5_0000_0000n;
    await d.u.sendToNode(node.id, PORT_0, a, LEDGER_A);
    await d.u.sendToNode(node2.id, PORT_0, a, LEDGER_B);

    await d.passTime(2);

    let node_after = await d.u.getNode(node.id);
    let node2_after = await d.u.getNode(node2.id);

    expect(node_after.sources[PORT_0].balance).toBe(a - d.ledgers[LEDGER_A].fee);
    expect(node2_after.sources[PORT_0].balance).toBe(a - d.ledgers[LEDGER_B].fee);

  });



});

