import { DF, LEDGER_TYPE } from "../utils";

describe('Burn', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  it(`Throttle burn`, async () => {


    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 1000000000n }
        },
      },
    }); 

    await d.u.sendToNode(node.id, 0, 99990000n);

    await d.passTime(10);

    expect(await d.u.getSourceBalance(node.id, 0)).toBe(99980000n);

    await d.u.setDestination(node.id, 0, { owner: d.jo.getPrincipal(), subaccount: [] });
    await d.passTime(40);

    let linfo = await d.u.pylon.get_ledgers_info();
    let my = linfo.find((x:any) => x.id.toText() == "lxzze-o7777-77777-aaaaa-cai")

    expect(await d.u.getSourceBalance(node.id, 0)).not.toBe(99980000n);

    //@ts-ignore
    expect(my.info[LEDGER_TYPE].pending).toBe(0n);

  }, 600 * 1000);

});

