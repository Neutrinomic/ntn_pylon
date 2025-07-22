
import { DF } from "../utils";

describe('Throttle', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  it(`Throttle`, async () => {


    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    await d.u.sendToNode(node.id, 0, 99990000n);


    await d.passTime(20);


    expect(await d.u.getSourceBalance(node.id, 0)).toBe(99980000n);

    await d.u.setDestination(node.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    await d.passTime(10);

    expect(await d.u.getSourceBalance(node.id, 0)).not.toBe(99980000n);

    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] })).toBe(9990000n);

  }, 600 * 1000);


  it(`Get controller nodes`, async () => {
    let node2 = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    let my_nodes = await d.u.listNodes();

    expect(my_nodes.length).toBe(2);

    expect(my_nodes[0].active).toBe(true);

  }, 600 * 1000);
});

