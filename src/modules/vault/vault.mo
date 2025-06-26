import U "mo:devefi/utils";
import Billing "../../billing_all";
import MU "mo:mosup";
import Ver1 "./memory/v1";
import Map "mo:map/Map";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Core "mo:devefi/core";
import I "./interface";
module {
    let T = Core.VectorModule;
    public let Interface = I;

    public module Mem {
        public module Vector {
            public let V1 = Ver1;
        };
    };
    let M = Mem.Vector.V1;

    public let ID = "vault";

    public class Mod({
        xmem : MU.MemShell<M.Mem>;
        core : Core.Mod;
    }) : T.Class<I.CreateRequest, I.ModifyRequest, I.Shared> {

        let mem = MU.access(xmem);

        public func meta() : T.Meta {
            {
                id = ID; // This has to be same as the variant in vec.custom
                name = "Vault";
                author = "Neutrinite";
                description = "Store tokens";
                supported_ledgers = [];
                version = #alpha([0, 0, 1]);
                create_allowed = true;
                ledger_slots = [
                    "Vault"
                ];
                billing = Billing.get();
                sources = sources(0);
                destinations = destinations(0);
                author_account = Billing.authorAccount();
                temporary_allowed = true;
            };
        };

        public func run() : () {
            label vec_loop for ((vid, parm) in Map.entries(mem.main)) {
                let ?vec = core.getNodeById(vid) else continue vec_loop;
                if (not vec.active) continue vec_loop;
                Run.single(vid, vec, parm);
            };
        };

        module Run {
            public func single(vid : T.NodeId, vec : T.NodeCoreMem, vault : M.NodeMem) : () {
                // This vault just stores tokens, it doesn't do any active operations
                // No operations needed
            };
        };

        private func validateDescription(description : Text) : Result.Result<(), Text> {
            if (Text.size(description) > 255) {
                return #err("Description must be 255 characters or less");
            };
            #ok();
        };

        public func create(id : T.NodeId, req : T.CommonCreateRequest, t : I.CreateRequest) : T.Create {
            switch (validateDescription(t.variables.description)) {
                case (#err(e)) return #err(e);
                case _ {};
            };

            let obj : M.NodeMem = {
                init = t.init;
                variables = {
                    var description = t.variables.description;
                };
                internals = {
                    // No internal fields needed
                };
            };
            ignore Map.put(mem.main, Map.n32hash, id, obj);
            #ok(ID);
        };

        public func delete(id : T.NodeId) : T.Delete {
            ignore Map.remove(mem.main, Map.n32hash, id);
            #ok;
        };

        public func modify(id : T.NodeId, m : I.ModifyRequest) : T.Modify {
            switch (validateDescription(m.description)) {
                case (#err(e)) return #err(e);
                case _ {};
            };

            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");
            
            t.variables.description := m.description;

            #ok();
        };

        public func get(id : T.NodeId, vec : T.NodeCoreMem) : T.Get<I.Shared> {
            let ?t = Map.get(mem.main, Map.n32hash, id) else return #err("Not found");

            #ok {
                init = t.init;
                variables = {
                    description = t.variables.description;
                };
                internals = {
                    // No internal fields needed
                };
            };
        };

        public func defaults() : I.CreateRequest {
            {
                init = {};
                variables = {
                    description = "Default Vault";
                };
            };
        };

        public func sources(_id : T.NodeId) : T.Endpoints {
            [(0, "")];
        };

        public func destinations(_id : T.NodeId) : T.Endpoints {
            []; // No destinations for the vault
        };
    };
}; 