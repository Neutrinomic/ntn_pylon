import { Account } from "../build/transcendence.idl";
import { DF , LEDGER_TYPE} from "../utils";
import {match, P } from 'ts-pattern';

describe('Virtual virtest', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });


  it(`Check balances`, async () => {


    let virtual = await d.u.virtualBalances( d.u.mainAccount() );
    let bal = virtual[0].balance;

    expect(bal).toBe(0n);


  });

  it(`Can't open a new virtual account unless amount is 20 * fee` , async () => {
    
    if (LEDGER_TYPE == 'icp') {
          await d.pylon.icrc55_account_register(d.u.mainAccount());
    }

    await d.u.sendToAccount(d.u.virtual(d.u.mainAccount()), d.ledgers[0].fee*17n);
    await d.passTime(5);

    let virtual = await d.u.virtualBalances( d.u.mainAccount() );
    let bal = virtual[0].balance;
    expect(bal).toBe(0n);

  });

  it(`Send to virtual account` , async () => {
    await d.u.sendToAccount(d.u.virtual(d.u.mainAccount()), 1_0000_0000n);
    await d.passTime(5);

    let virtual = await d.u.virtualBalances( d.u.mainAccount() );
    let bal = virtual[0].balance;
    expect(bal).toBe(1_0000_0000n - d.ledgers[0].fee);

  });

  it(`Withdraw from virtual account` , async () => {

    let jo_acc : Account = {
      owner : d.jo.getPrincipal(),
      subaccount : [d.u.subaccountFromId(1232)]
    };

    let resp = await d.u.virtualTransfer(d.u.mainAccount(), jo_acc, 5000_0000n);
    
    //@ts-ignore
    // expect(resp.ok.commands[0].transfer.ok).toBeDefined();

    match(resp).with({
      ok: { id: P.any, commands: [{transfer: {ok: P.any}}] }
    }, (x) => {
      expect(x.ok.commands[0].transfer.ok).toBeDefined();
    }).otherwise(() => {
      d.inspect(resp);
      fail("Should have been ok");
    });



    await d.passTime(5);

    let virtual = await d.u.virtualBalances( d.u.mainAccount() );
    let bal = virtual[0].balance;
    expect(bal).toBe(5000_0000n - d.ledgers[0].fee);

    let acc = await d.u.getLedgerBalance(jo_acc);
    expect(acc).toBe(5000_0000n - d.ledgers[0].fee);

  });


  it(`Withdraw from virtual account - not owner` , async () => {

    let jo_acc : Account = {
      owner : d.jo.getPrincipal(),
      subaccount : [d.u.subaccountFromId(1232)]
    };
    let resp = await d.u.virtualTransfer(jo_acc,  d.u.mainAccount(), 5000_0000n);

    //@ts-ignore
    expect(resp.ok.commands[0].transfer.err).toBe("Not the owner");
    
  });

  it(`Withdraw from virtual account more than it has` , async () => {

    let jo_acc : Account = {
      owner : d.jo.getPrincipal(),
      subaccount : [d.u.subaccountFromId(1232)]
    };

    let resp = await d.u.virtualTransfer(d.u.mainAccount(), jo_acc, 5000_0000_0000n);

    //@ts-ignore
    expect(resp.ok.commands[0].transfer.err).toBe("Insufficient balance");

    //@ts-ignore
    expect(resp.ok.id[0]).toBe(undefined)
    await d.passTime(5);

    let virtual = await d.u.virtualBalances( d.u.mainAccount() );
    let bal = virtual[0].balance;
    expect(bal).toBe(5000_0000n - d.ledgers[0].fee);

  });

  it(`Transfer from one virtual account to virtual another` , async () => {

    let jo_acc : Account = {
      owner : d.jo.getPrincipal(),
      subaccount : [d.u.subaccountFromId(44232323)]
    };
    // if (LEDGER_TYPE == 'icp') {
    //   await d.pylon.icrc55_account_register(jo_acc);
    // }

    let before_virtual2 = await d.u.virtualBalances( jo_acc );
    let before_bal2 = before_virtual2[0].balance;
    expect(before_bal2).toBe(0n);

    d.inspect(d.u.mainAccount());
    d.inspect(d.u.virtual(jo_acc));

    let log_before = await d.ledgers[0].can.get_transactions({start:0n, length:100n});
    expect(log_before.transactions.length).toBe(5);

    let resp = await d.u.virtualTransfer(d.u.mainAccount(), d.u.virtual(jo_acc), 2000_0000n);

    
    await d.passTime(5);

    let virtual = await d.u.virtualBalances( d.u.mainAccount() );
    let bal = virtual[0].balance;
    expect(bal).toBe(3000_0000n - d.ledgers[0].fee);

    let virtual2 = await d.u.virtualBalances( jo_acc );
    let bal2 = virtual2[0].balance;
    expect(bal2).toBe(2000_0000n - d.ledgers[0].fee);


    let log = await d.ledgers[0].can.get_transactions({start:0n, length:100n});
    expect(log.transactions.length).toBe(5);

  });

});

