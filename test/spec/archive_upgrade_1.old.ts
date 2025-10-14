import { DF, LEDGER_TYPE } from "../utils";
import { resolve } from "path";

const WASM_OLD = resolve(__dirname, "../archive/transcendence_before_july_10.wasm.gz");
const WASM_NEW = resolve(__dirname, "../build/transcendence.wasm.gz");

describe('Archive upgrade 1', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => {
    d = DF(WASM_OLD); 
    await d.beforeAll();
    
   });

  afterAll(async () => { await d.afterAll(); });

  it(`Send to canister to make sure we have enough to doublespend`, async () => {
    await d.u.sendToAccount(d.u.userBillingAccount(), 999900000n);
  });

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

  it(`Create node`, async () => {

    let node2 = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });


  });


  it(`Get controller nodes`, async () => {
   

    let my_nodes = await d.u.listNodes();

    expect(my_nodes.length).toBe(2);

    expect(my_nodes[0].active).toBe(true);

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

    await d.passTime(2);
    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(10)] })).toBe(4980000n);
    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(11)] })).toBe(4980000n);
    // console.log("Stopping ledgers");
    await d.stopAllLedgers();

    await d.passTimeSkip(150);
    // let info = await d.pylon.get_ledgers_info();
    // let pending = info.reduce((acc:any, curr:any) => acc + curr.info[LEDGER_TYPE].pending, 0n);
  
    // expect(pending).toBe(27n);

  }, 600 * 1000);


  it(`Upgrade`, async () => {
     await d.pylonCanUpgrade(WASM_NEW);

    await d.startAllLedgers();

    await d.passTime(120)
  });

  it(`Get controller nodes again`, async () => {

    let my_nodes = await d.u.listNodes();

    expect(my_nodes.length).toBe(5);

    expect(my_nodes[0].active).toBe(true);

  }, 600 * 1000);

  it(`Check balances again to make sure pending transactions arrived`, async () => {

    let info = await d.pylon.get_ledgers_info();
    let pending = info.reduce((acc:any, curr:any) => acc + curr.info[LEDGER_TYPE].pending, 0n);
    
    expect(pending).toBe(0n);

    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(10)] })).toBe(49790000n);
    expect(await d.u.getLedgerBalance({ owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(11)] })).toBe(49790000n);

  }, 600 * 1000);


});

