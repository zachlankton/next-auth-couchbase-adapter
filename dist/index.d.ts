import { ModelTypes } from "ottoman";
import { Adapter } from "next-auth/adapters";
import { ConnectOptions } from "ottoman/lib/types/ottoman/ottoman";
export interface collectionNames {
    User?: string;
    Account?: string;
    Session?: string;
    VerificationToken?: string;
}
export interface adapterOptions extends ConnectOptions {
    ensureCollections?: boolean;
    ensureIndexes?: boolean;
    collectionNames?: collectionNames;
}
declare const doc_not_found: (reason: any) => null;
export { doc_not_found };
declare let UserModel: ModelTypes;
declare let AccountModel: ModelTypes;
declare let SessionModel: ModelTypes;
declare let VerificationTokenModel: ModelTypes;
export { UserModel, AccountModel, SessionModel, VerificationTokenModel };
/** @return { import("next-auth/adapters").Adapter } */
export default function MyAdapter(options: adapterOptions): Adapter;
