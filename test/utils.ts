import { Principal } from '@dfinity/principal';
import { resolve } from 'node:path';
import { encodeIcrcAccount } from '@dfinity/ledger-icrc';

import { Actor, PocketIc, createIdentity } from '@dfinity/pic';
import { IDL } from '@dfinity/candid';
import {
    _SERVICE as PylonService, idlFactory as PylonIdlFactory, init as PylonInit,
    LocalNodeId as NodeId,
    CommonCreateRequest,
    CreateRequest,
    GetNodeResponse,
    CommandResponse,
    NodeShared,
    ModifyRequest,
    PylonMetaResp,
    AccountsResponse,
    BatchCommandResponse,
    InputAddress
} from './build/transcendence.idl.js';

import { ICRCLedgerService, ICRCLedger } from "./icrc_ledger/ledgerCanister";
import { ICPLedger } from "./icp_ledger/ledgerCanister";


import { Account, Subaccount} from './icrc_ledger/ledger.idl.js';
//@ts-ignore
import { toState } from "@infu/icblast";
import {AccountIdentifier, SubAccount} from "@dfinity/ledger-icp"
import util from 'util';
const WASM_PYLON_PATH = resolve(__dirname, "./build/transcendence.wasm.gz");

export const LEDGER_TYPE = (process.env['LEDGER_TYPE'] as "icrc" | "icp") ?? "icrc";

export async function PylonCan(pic: PocketIc, start_wasm: string | undefined) {
    
    if (!start_wasm) start_wasm = WASM_PYLON_PATH;
    console.log("Installing ", start_wasm);
    const fixture = await pic.setupCanister<PylonService>({
        idlFactory: PylonIdlFactory,
        wasm: start_wasm,
        arg: IDL.encode(PylonInit({ IDL }), [[]]),
    });

    return fixture;
};

export type Ledger = {can:Actor<ICRCLedgerService>, id:Principal, fee:bigint };

export function DF(start_wasm: string | undefined): any {

    return {
        pic: undefined as PocketIc,
        // ledger: undefined as Actor<ICRCLedgerService>,
        pylon: undefined as Actor<PylonService>,
        userCanisterId: undefined as Principal,
        // ledgerCanisterId: undefined as Principal,
        ledgers : [] as Ledger[],
        pylonCanisterId: undefined as Principal,
        u: undefined as ReturnType<typeof createNodeUtils>,
        jo : undefined as ReturnType<typeof createIdentity>,
        admin : undefined as ReturnType<typeof createIdentity>,

        toState : toState,

        inspect(obj: any) : void {
            console.log(util.inspect(toState(obj), { depth: null, colors: true }));
        },

        async pylonCanUpgrade(wasm:string) : Promise<void> {
            await this.passTime(10);
            console.log("Upgrading to ", wasm);
            return this.pic.upgradeCanister({canisterId:this.pylonCanisterId, wasm, arg: IDL.encode(PylonInit({ IDL }), [[]])});
        },
        async passTime(n: number): Promise<void> {
            n = n * 2;
            if (!this.pic) throw new Error('PocketIc is not initialized');
            for (let i = 0; i < n; i++) {
                await this.pic.advanceTime(3 * 1000);
                await this.pic.tick(6);
                //    await this.pylon.beat();
            }
        },
        async passTimeSkip(n: number): Promise<void> {
            n = n * 2;
            if (!this.pic) throw new Error('PocketIc is not initialized');
            for (let i = 0; i < n; i++) {
                await this.pic.advanceTime(3 * 1000);
                await this.pic.tick(1);
                //    await this.pylon.beat();
            }
        },
        async passTick(n: number): Promise<void> {
             await this.pic.tick(n);
        },
        async passTimeMinute(n: number): Promise<void> {
            if (!this.pic) throw new Error('PocketIc is not initialized');
            await this.pic.advanceTime( n * 60 * 1000);
            await this.pic.tick(3);
            // await this.pylon.beat();
            await this.passTime(3)
        },
        async stopAllLedgers(): Promise<void> {
            for (let lg of this.ledgers) {
               await this.pic.stopCanister({ canisterId: lg.id });
            }
        },
        async startAllLedgers(): Promise<void> {
            for (let lg of this.ledgers) {
               await this.pic.startCanister({ canisterId: lg.id });
            }
        },

        async beforeAll(): Promise<void> {
            this.jo = createIdentity('superSecretAlicePassword');

            // Initialize PocketIc
            this.pic = await PocketIc.create(process.env.PIC_URL);


         
            // Ledger initialization
            let TOTAL_LEDGERS = 5;

            type Token = {
                name: string;
                fee: bigint;
                decimals: number;
            };
            
            const tokens: Token[] = [
                { name: 'tAAA', fee: 10_000n, decimals: 8 },
                { name: 'tBBB', fee: 2_000n, decimals: 8 },
                { name: 'tCCC', fee: 4_500n, decimals: 8 },
                { name: 'tDDD', fee: 15_000n, decimals: 8 },
                { name: 'tEEE', fee: 20_000n, decimals: 7 }
            ];

            for (let i=0 ; i < TOTAL_LEDGERS; i++) {
                let ledgerFixture;
                
                if (LEDGER_TYPE === 'icp') {
                    ledgerFixture = await ICPLedger(this.pic, this.jo.getPrincipal(), undefined, tokens[i].name, tokens[i].fee, tokens[i].decimals); 
                } else {
                    ledgerFixture = await ICRCLedger(this.pic, this.jo.getPrincipal(), undefined, tokens[i].name, tokens[i].fee, tokens[i].decimals);
                }
                
                
      
                this.ledgers.push({
                    can: ledgerFixture.actor, 
                    id: ledgerFixture.canisterId, 
                    fee: await ledgerFixture.actor.icrc1_fee()
                });
            }

            // Pylon canister initialization
            const pylonFixture = await PylonCan(this.pic, start_wasm);
            this.pylon = pylonFixture.actor;
            this.pylonCanisterId = pylonFixture.canisterId;
            await this.pic.addCycles(this.pylonCanisterId, 100_000_000_000_000);
            // Setup interactions between ledger and pylon


            for (let i=0; i < TOTAL_LEDGERS; i++) {
                if (LEDGER_TYPE === 'icp') {
                    await this.pylon.add_supported_ledger(this.ledgers[i].id, { icp: null });
                } else {
                    await this.pylon.add_supported_ledger(this.ledgers[i].id, { icrc: null });
                }
               
                this.ledgers[i].can.setIdentity(this.jo);
            };

   

            // Set the identity for ledger and pylon
            
            this.pylon.setIdentity(this.jo);

            // Initialize node utilities
            this.u = createNodeUtils({
                ledgers: this.ledgers,
                pylon: this.pylon,
                pylonCanisterId: this.pylonCanisterId,
                user: this.jo.getPrincipal()
            });

            if (LEDGER_TYPE == 'icp') {
                await this.pylon.icrc55_account_register(this.u.mainAccount());
            }
            // Advance time to sync with initialization
            await this.passTime(10);
        },

        async afterAll(): Promise<void> {
            if (!this.pic) throw new Error('PocketIc is not initialized');
            await this.pic.tearDown();
        },

        sqrt(x:bigint) : bigint {
            if (x === 0n) return 0n;
        
            let z = (x + 1n) / 2n;
            let y = x;
        
            // Iterate using the Babylonian method until convergence
            while (z < y) {
                y = z;
                z = (x / z + z) / 2n;
            }
        
            return y;
        }
        
    };
}



export function createNodeUtils({
    ledgers,
    pylon,
    pylonCanisterId,
    user
}: {
    ledgers: Ledger[],
    pylon: Actor<PylonService>,
    pylonCanisterId: Principal,
    user: Principal
}) {
    return {
        pylon : pylon,
        async listNodes(): Promise<NodeShared[]> {
            return await pylon.icrc55_get_controller_nodes({ id: {owner:user, subaccount:[]}, start:0, length: 500 });
        },
        mainAccount(): Account {
            return { owner: user, subaccount: [] };
        },
        userSubaccount(id: number): Account {
            return { owner: user, subaccount: [this.subaccountFromId(id)] };
        },
        userBillingAccount() : Account {
            let aid = AccountIdentifier.fromPrincipal({principal: user});
            let sa = aid.toUint8Array();
            return { owner: pylonCanisterId, subaccount: [sa] };
        },
        async getPylonMeta() : Promise<PylonMetaResp> {
            return pylon.icrc55_get_pylon_meta();
        },
        virtual(account: Account): Account {
            let asu = account?.subaccount[0] ? SubAccount.fromBytes(new Uint8Array(account.subaccount[0])) : undefined;
            if (asu instanceof Error) {
                throw asu;
            }
            let aid = AccountIdentifier.fromPrincipal({principal: account.owner, subAccount: asu as SubAccount});
            let sa = aid.toUint8Array();
            return { owner: pylonCanisterId, subaccount: [sa]};
        },
        async sendToAccount(account: Account, amount: bigint, from_subaccount:Subaccount | undefined = undefined, from_ledger:number = 0): Promise<void> {
            let ledger = ledgers[from_ledger].can;
            
            
      
            ledger.setPrincipal(user);
            let txresp = await ledger.icrc1_transfer({
                from_subaccount: from_subaccount?[from_subaccount]:[],
                to: account,
                amount: amount,
                fee: [],
                memo: [],
                created_at_time: [],
            });

            if (!("Ok" in txresp)) {
                throw new Error("Transaction failed");
            }
        },

        async sendToNode(nodeId: NodeId, port: number, amount: bigint, from_ledger:number = 0): Promise<void> {
            let ledger = ledgers[from_ledger].can;

            ledger.setPrincipal(user);
            let node = await this.getNode(nodeId);
            if (node === undefined) return;

            let txresp = await ledger.icrc1_transfer({
                from_subaccount: [],
                //@ts-ignore
                to: node.sources[port].endpoint.ic.account,
                amount: amount,
                fee: [],
                memo: [],
                created_at_time: [],
            });
            // console.log({r:txresp, l:ledgers[from_ledger].id.toText()});
            if (!("Ok" in txresp)) {
                throw new Error("Transaction failed");
            }
        },

        async getLedgerBalance(account: Account, from_ledger:number = 0): Promise<bigint> {
            let ledger = ledgers[from_ledger].can;
            return await ledger.icrc1_balance_of(account);
        },

        async getSourceBalance(nodeId: NodeId, port: number): Promise<bigint> {
            let node = await this.getNode(nodeId);
            if (node === undefined) return 0n;

            return node.sources[port].balance;
        },

        async getDestinationBalance(nodeId: NodeId, port: number): Promise<bigint> {
            let node = await this.getNode(nodeId);
            if (node === undefined) return 0n;
            //@ts-ignore
            return await ledger.icrc1_balance_of(node.destinations[port].ic.account[0]);
        },
        getRefundAccount() : Account {
            return {owner: user, subaccount: [this.subaccountFromId(1000)]};
        },
        getAffiliateAccount() : Account {
            return {owner: user, subaccount: [this.subaccountFromId(100000)]};
        },
        async virtualTransfer(from: Account, to:Account, amount: bigint, from_ledger:number = 0): Promise<BatchCommandResponse> {
            let ledgerCanisterId = ledgers[from_ledger].id
            let controller : Account = {owner:user, subaccount:[]};
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller,
                signature : [],
                commands:[{transfer: {
                    ledger: {ic:ledgers[0].id},
                    from : {
                        account : from,
                    },
                    to : {
                        external_account : {
                            ic: to
                        }
                    },
                    amount,
                    memo: []
                }}]});
            },
        async virtualBalances(acc: Account) : Promise<AccountsResponse> {
            return await pylon.icrc55_accounts(acc);
        },
        async createNode(creq: CreateRequest, ledgers_idx:number[] = [0], {temporary} : {temporary:boolean} = {temporary:true} ): Promise<GetNodeResponse> {
            
            let req: CommonCreateRequest = {
                controllers: [{owner:user, subaccount:[]}],
                destinations: [],
                refund: this.getRefundAccount(),
                ledgers: ledgers_idx.map(idx => ({ic : ledgers[idx].id})),
                sources: [],
                extractors: [],
                billing_option: 0n,
                affiliate: [this.getAffiliateAccount()],
                temporary,
                temp_id: 0,
                initial_billing_amount: []
            };

            let resp = await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller: {owner:user, subaccount:[]},
                signature : [],
                commands:[{create_node:[req, creq]}]});

            //@ts-ignore
            if (resp.ok.commands[0].create_node.err) {
                //@ts-ignore
                throw new Error(resp.ok.commands[0].create_node.err);
            };
            //@ts-ignore
            return resp.ok.commands[0].create_node.ok;
        },

        async getNode(nodeId: NodeId): Promise<GetNodeResponse> {
            let resp = await pylon.icrc55_get_nodes([{ id: nodeId }]);
            if (resp[0][0] === undefined) throw new Error("Node not found");
            return resp[0][0];
        },
        async topUpNode(nodeId: NodeId, amount: bigint): Promise<BatchCommandResponse> {
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{transfer: {
                    ledger: {ic:ledgers[0].id},
                    from : {
                        account : {owner:user, subaccount:[]},
                    },
                    to : {
                        node_billing : nodeId
                    },
                    amount,
                    memo: []
                }}]});
        },
        async setControllers(nodeId: NodeId, controllers: Account[]): Promise<BatchCommandResponse> {
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{
                modify_node: [nodeId, [{ 
                    destinations : [],
                    refund: [],
                    sources: [],
                    extractors: [],
                    controllers : [controllers],
                    active :[]
                }], []]}]});
        },
        async setActive(nodeId: NodeId, active: boolean): Promise<void> {
            await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{
                modify_node: [nodeId, [{ 
                    destinations : [],
                    refund: [],
                    sources: [],
                    extractors: [],
                    controllers : [],
                    active :[active]
                }], []]
            }]});
        },
        async deleteNode(nodeId: NodeId): Promise<BatchCommandResponse> {
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{delete_node: nodeId}]
            });
        },
        async sourceTransfer(nodeId : NodeId, source_idx: number, amount: bigint, to: Account, to_ledger: number = 0): Promise<BatchCommandResponse> {
            let ledgerCanisterId = ledgers[to_ledger].id;
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{transfer: {
                    ledger: {ic:ledgerCanisterId},
                    from : {
                        node : {node_id:nodeId, endpoint_idx:source_idx},
                    },
                    to : {
                        external_account : {ic:to}
                    },
                    amount,
                    memo: []
                }}]});
        },
        async setDestination(nodeId: NodeId, port: number, account: Account, ledger_idx : number = 0): Promise<BatchCommandResponse> {
            let ledgerCanisterId = ledgers[ledger_idx].id;
            let node = await this.getNode(nodeId);
            
            let destinations: ([InputAddress] | [])[] = node.destinations.map(x => {
                if ('ic' in x.endpoint) {
                  const account = x.endpoint.ic.account[0];
                  if (account === undefined) {
                    return []; 
                  }
                  return [{ ic: account }];
                } else {
                  throw new Error("Endpoint not supported");
                }
              });
   
              
            destinations[port] = [{ ic: account }];
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{
                modify_node: [nodeId, [{ 
                    destinations : [destinations],
                    refund: [],
                    sources: [],
                    extractors: [],
                    controllers : [],
                    active :[]
                }], []]
            }]});
        },
        async modifyNodeCustom(nodeId: NodeId, req: ModifyRequest): Promise<BatchCommandResponse> {
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{ modify_node: [nodeId, [], [req]] } ]});
        },
        async setSource(nodeId: NodeId, port: number, account: Account, ledger_idx : number = 0): Promise<BatchCommandResponse> {
            let ledgerCanisterId = ledgers[ledger_idx].id;
            let node = await this.getNode(nodeId);
            
            
            let sources : [InputAddress][] = node.sources.map(x => {
                if ('ic' in x.endpoint) {
                  // Now TypeScript knows that x.endpoint has the type { ic: { account: string } }
                  return [{ ic: x.endpoint.ic.account }];
                } else {
                  // TypeScript knows that x.endpoint has the type { other: EndpointOther }
                  // You can handle the 'other' case here if needed
                  throw new Error("Endpoint not supported");
                }
              });

              sources[port] = [{ ic: account }];
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{
                modify_node: [nodeId, [{
                    destinations : [],
                    refund: [],
                    sources: [sources],
                    extractors: [],
                    controllers : [],
                    active :[]
                }], []]
            }]});
        },

        async addExtractor(from: NodeId, to: NodeId): Promise<BatchCommandResponse> {
            let node = await this.getNode(from);
            let extractors = [...node.extractors, to];
            return await pylon.icrc55_command({
                expire_at : [],
                request_id : [],
                controller : {owner:user, subaccount:[]},
                signature : [],
                commands:[{
                modify_node: [from, [{ 
                    destinations : [],
                    refund: [],
                    sources: [],
                    extractors: [extractors],
                    controllers : [],
                    active :[]
                }], []]
            }]});
        },


        async connectNodes(from: NodeId, fromPort: number, to: NodeId, toPort: number): Promise<CommandResponse[]> {
            let to_node = await this.getNode(to);

            //@ts-ignore
            return await this.setDestination(from, fromPort, to_node.sources[toPort].endpoint.ic.account);
        },


        async connectNodeSource(extractor: NodeId, extractorPort: number, sourceFrom: NodeId, sourcePort: number): Promise<CommandResponse[]> {
            let from_node = await this.getNode(sourceFrom);

            //@ts-ignore
            return await this.setSource(extractor, extractorPort, from_node.sources[sourcePort].endpoint.ic.account);

        },

        subaccountFromId(id: number): Subaccount {
            // create 32 byte uint8array and put the id in the first 4 bytes
            let subaccount = new Uint8Array(32);
            let view = new DataView(subaccount.buffer);
            view.setUint32(0, id, true);
            return subaccount;
        },



        async adminRecoverTokens(d: ReturnType<typeof DF>, req: {ledger: Principal, account: string, send_to: string}): Promise<{ok: null} | {err: string}> {
            let controllers = await d.pic.getControllers(d.pylonCanisterId);
            d.u.pylon.setPrincipal(controllers[0]);
        
            let rez = await pylon.admin_recover_tokens(req);

            d.u.pylon.setPrincipal(d.jo.getPrincipal());

            return rez;
        },

        async adminRecoverUnregisteredIcp(d: ReturnType<typeof DF>, req: {account: string, send_to: string}): Promise<{ok: null} | {err: string}> {
            let controllers = await d.pic.getControllers(d.pylonCanisterId);
            d.u.pylon.setPrincipal(controllers[0]);

            let rez = await pylon.admin_recover_unregistered_icp(req);

            d.u.pylon.setPrincipal(d.jo.getPrincipal());

            return rez;
        },

        accountToText(account: Account): string {
            return encodeIcrcAccount({
                owner: account.owner,
                subaccount: account.subaccount.length > 0 ? account.subaccount[0] : undefined
            });
        },

        canisterId(): Principal {
            return pylonCanisterId;
        }
    };
}

