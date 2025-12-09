
import { DF } from "../utils";

describe('Chained vectors', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  it(`throttle->split`, async () => {


    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    let node2 = await d.u.createNode({
      'split' : {
          'init' : {},
          'variables' : {
              'split' : [50n,50n], 
            },
        }
    });

    await d.u.connectNodes(node.id, 0, node2.id, 0);
    await d.u.setDestination(node2.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] });
    await d.u.setDestination(node2.id, 1, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(2)] });

    await d.u.sendToNode(node.id, 0, 99990000n);

    await d.passTime(4);


    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(1)] })).toBe(4985000n);
    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(2)] })).toBe(4985000n);

  }, 600 * 1000);



  it(`throttle->throttle->split`, async () => {


    let node = await d.u.createNode({
      'throttle': {
        'init': { d },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });


    let node2 = await d.u.createNode({
      'throttle': {
        'init': {  },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });


    let node3 = await d.u.createNode({
      'split' : {
          'init' : {},
          'variables' : {
              'split' : [50n,50n], 
            },
        }
    });

    await d.u.connectNodes(node.id, 0, node2.id, 0);
    await d.u.connectNodes(node2.id, 0, node3.id, 0);
    await d.u.setDestination(node3.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(10)] });
    await d.u.setDestination(node3.id, 1, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(11)] });


    await d.u.sendToNode(node.id, 0, 99990000n);

    await d.passTime(4);


    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(10)] })).toBe(4980000n);
    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(11)] })).toBe(4980000n);

  }, 600 * 1000);

});

