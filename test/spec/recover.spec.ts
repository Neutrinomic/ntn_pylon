import { Account } from "../build/transcendence.idl";
import { DF } from "../utils";
import { match, P } from 'ts-pattern';

describe('Recovery Functions', () => {

  let d: ReturnType<typeof DF>

  beforeAll(async () => { d = DF(undefined); await d.beforeAll(); });

  afterAll(async () => { await d.afterAll(); });

  const LEDGER_A = 0;
  const LEDGER_B = 1;
  const LEDGER_C = 2;
  it(`Recover stuck tokens - legitimate recovery`, async () => {
    
    // Create a throttle node with only ledger[0] as source
    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    // Send funds from ledger[1] to this node's account (this should get stuck since the node expects only ledger[0] funds in this account)
    let node_full = await d.u.getNode(node.id);
    //@ts-ignore
    let node_account = node_full.sources[0].endpoint.ic.account;
    
    // Send ledger[1] tokens to the node's account that expects ledger[0] tokens
    // console.log("Node account:", d.u.accountToText(node_account));
    await d.u.sendToNode(node.id, 0, 50000000n, LEDGER_B);

    await d.passTime(5);

    // Verify the funds are stuck (balance should be 0 on source 0, but positive on the stuck subaccount for ledger[1])
    expect(await d.u.getSourceBalance(node.id, 0)).toBe(0n);
    
 

    // Create a recovery destination account
    let recovery_account: Account = {
      owner: d.jo.getPrincipal(),
      subaccount: [d.u.subaccountFromId(9999)]
    };

    // Attempt to recover the stuck tokens
    let recovery_result = await d.u.adminRecoverTokens(d, {
      ledger: d.ledgers[LEDGER_B].id,
      account: d.u.accountToText(node_account),
      send_to: d.u.accountToText(recovery_account)
    });

    // Should succeed
    expect(recovery_result).toEqual({ ok: null });
    
    await d.passTime(5);

    // Verify the tokens were recovered
    let recovered_balance = await d.u.getLedgerBalance(recovery_account, 1);
    expect(recovered_balance).toBe(50000000n - d.ledgers[1].fee * 2n); // Two fees: original send + recovery send

    // Verify the stuck account is now empty
    let remaining_stuck_balance = await d.u.getLedgerBalance(node_account, 1);
    expect(remaining_stuck_balance).toBe(0n);

  }, 600 * 1000);

  it(`Cannot recover legitimate funds - security check`, async () => {
    
    // Create a throttle node with ledger[0] as source
    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    // Send funds from ledger[0] to this node (this is legitimate since the node has ledger[0] as source)
    await d.u.sendToNode(node.id, 0, 30000000n);
    await d.passTime(5);

    // Verify the funds are properly managed by the node
    expect(await d.u.getSourceBalance(node.id, 0)).toBe(30000000n - d.ledgers[0].fee);
    
    // Get the node's IC endpoint account for ledger[0]
    let node_full = await d.u.getNode(node.id);
    //@ts-ignore
    let node_account = node_full.sources[0].endpoint.ic.account;
    
    // Create a recovery destination account
    let recovery_account: Account = {
      owner: d.jo.getPrincipal(),
      subaccount: [d.u.subaccountFromId(8888)]
    };

    // Attempt to recover the legitimate funds (this should fail)
    let recovery_result = await d.u.adminRecoverTokens(d, {
      ledger: d.ledgers[0].id,
      account: d.u.accountToText(node_account),
      send_to: d.u.accountToText(recovery_account)
    });

    // Should fail with "Source doesn't need recovery"
    match(recovery_result).with({
      err: P.string.includes("Source doesn't need recovery")
    }, (x) => {
      expect(x.err).toContain("Source doesn't need recovery");
    }).otherwise(() => {
      d.inspect(recovery_result);
      throw new Error("Should have failed with 'Source doesn't need recovery'");
    });

    // Verify the legitimate funds remain in the node
    expect(await d.u.getSourceBalance(node.id, 0)).toBe(30000000n - d.ledgers[0].fee);

  }, 600 * 1000);

  it(`Cannot recover from non-existent node`, async () => {
    
    // Create a fake account that doesn't correspond to any node
    let fake_account: Account = {
      owner: d.u.canisterId(),
      subaccount: [d.u.subaccountFromId(99999)]
    };
    
    let recovery_account: Account = {
      owner: d.jo.getPrincipal(),
      subaccount: [d.u.subaccountFromId(7777)]
    };
    // d.inspect({
    //     ledger: d.ledgers[0].id,
    //     account: d.u.accountToText(fake_account),
    //     send_to: d.u.accountToText(recovery_account)
    //   });
    // Attempt to recover from non-existent node
    let recovery_result = await d.u.adminRecoverTokens(d, {
      ledger: d.ledgers[0].id,
      account: d.u.accountToText(fake_account),
      send_to: d.u.accountToText(recovery_account)
    });

    // d.inspect(recovery_result);

    // Should fail with "Node not found"
    match(recovery_result).with({
      err: P.string.includes("Node not found")
    }, (x) => {
      expect(x.err).toContain("Node not found");
    }).otherwise(() => {
      d.inspect(recovery_result);
      throw new Error("Should have failed with 'Node not found'");
    });

  }, 600 * 1000);

  it(`Cannot recover zero balance`, async () => {
    
    // Create a throttle node
    let node = await d.u.createNode({
      'throttle': {
        'init': { },
        'variables': {
          'interval_sec': { 'fixed': 61n },
          'max_amount': { 'fixed': 10000000n }
        },
      },
    });

    // Don't send any funds to ledger[1] (so balance is 0)
    let node_full = await d.u.getNode(node.id);
    //@ts-ignore
    let node_account = node_full.sources[0].endpoint.ic.account;
    
    let recovery_account: Account = {
      owner: d.jo.getPrincipal(),
      subaccount: [d.u.subaccountFromId(6666)]
    };

    // Attempt to recover from zero balance
    let recovery_result = await d.u.adminRecoverTokens(d, {
      ledger: d.ledgers[1].id,
      account: d.u.accountToText(node_account),
      send_to: d.u.accountToText(recovery_account)
    });

    // Should fail with "Balance is 0"
    match(recovery_result).with({
      err: P.string.includes("Balance is 0")
    }, (x) => {
      expect(x.err).toContain("Balance is 0");
    }).otherwise(() => {
      d.inspect(recovery_result);
      throw new Error("Should have failed with 'Balance is 0'");
    });

  }, 600 * 1000);



}); 