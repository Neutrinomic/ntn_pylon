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
    InputAddress,
    Range,
} from './build/transcendence.idl.js';
import { DF } from "./utils";

export function EUtil(d: ReturnType<typeof DF>) {
    return {
        async createLPNode(ledger_one_id: number, ledger_two_id: number, range : Range , subaccountId : number = 1): Promise<ReturnType<typeof d.u.createNode>> {
            if (!("partial" in range)) return;
            let middle = range.partial.from_price + (range.partial.to_price - range.partial.from_price) / 2;
            let controllers = await d.pic.getControllers(d.pylonCanisterId);
            d.u.pylon.setPrincipal(controllers[0]);
            await d.u.pylon.dex_pool_create({
                base: d.ledgers[ledger_one_id].id,
                quote: d.ledgers[ledger_two_id].id,
            });
            d.u.pylon.setPrincipal(d.jo.getPrincipal());
            let node = await d.u.createNode({
                'exchange_liquidity': {
                    'init': {},
                    'variables': {
                        'flow': { 'add': null },
                        'range': range,
                    },
                },
            }, [ledger_one_id, ledger_two_id]);

            await d.u.setDestination(node.id, 0, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(subaccountId)] });
            await d.u.setDestination(node.id, 1, { owner: d.jo.getPrincipal(), subaccount: [d.u.subaccountFromId(subaccountId)] });
            return node;
        },

        async addLiquidity(node_id: number, ledger_one: number, ledger_two: number, a: bigint, b: bigint): Promise<{ tokenA: bigint, tokenB: bigint }> {

            await d.u.sendToNode(node_id, 0, a, ledger_one);
            await d.u.sendToNode(node_id, 1, b, ledger_two);

            await d.passTime(5);

            let node_after = await d.u.getNode(node_id);
            let end = this.getInternals(node_after);
            return end;
        },

        getInternals(node: any): { tokenA: bigint, tokenB: bigint } {
            let inter = node.custom[0].exchange_liquidity.internals;
            return { tokenA: inter.tokenA, tokenB: inter.tokenB };
        }
    }
}