"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationTokenModel = exports.SessionModel = exports.AccountModel = exports.UserModel = exports.doc_not_found = void 0;
const ottoman_1 = require("ottoman");
const doc_not_found = (reason) => {
    if (reason.message === "document not found")
        return null;
    throw new Error(reason);
};
exports.doc_not_found = doc_not_found;
const UserSchema = new ottoman_1.Schema({
    name: String,
    email: { type: String, required: true },
    emailVerified: ottoman_1.Schema.Types.Date,
    image: String,
});
UserSchema.index.findByEmail = {
    by: "email",
    type: "n1ql",
};
const AccountSchema = new ottoman_1.Schema({
    type: String,
    provider: String,
    providerAccountId: String,
    refresh_token: String,
    access_token: String,
    expires_at: Number,
    token_type: String,
    scope: String,
    id_token: String,
    oauth_token_secret: String,
    oauth_token: String,
    session_state: String,
});
const SessionSchema = new ottoman_1.Schema({
    expires: ottoman_1.Schema.Types.Date,
    sessionToken: String,
});
SessionSchema.index.findBySessionToken = {
    by: "sessionToken",
    type: "n1ql",
};
const UserVerifcationSchema = new ottoman_1.Schema({
    token: String,
    expires: ottoman_1.Schema.Types.Date,
    identifier: String,
});
let modelsNeedSetup = true;
let UserModel;
exports.UserModel = UserModel;
let AccountModel;
exports.AccountModel = AccountModel;
let SessionModel;
exports.SessionModel = SessionModel;
let VerificationTokenModel;
exports.VerificationTokenModel = VerificationTokenModel;
/** @return { import("next-auth/adapters").Adapter } */
function MyAdapter(options) {
    const collectionNames = {
        User: "User",
        Account: "UserAccount",
        Session: "UserSession",
        VerificationToken: "UserVerificationToken",
        ...options.collectionNames,
    };
    async function getInstance() {
        var _a, _b;
        const ot_opts = { consistency: ottoman_1.SearchConsistency.LOCAL };
        const db = (_b = (_a = options.instance) !== null && _a !== void 0 ? _a : (0, ottoman_1.getDefaultInstance)()) !== null && _b !== void 0 ? _b : new ottoman_1.Ottoman(ot_opts);
        if (!db.bucket)
            await db.connect(options);
        modelsNeedSetup && (await setupModels(db));
        return db;
    }
    async function setupModels(db) {
        console.log("Setting up Next Auth Couchbase/Ottoman Models");
        const models = (0, ottoman_1.getDefaultInstance)().models;
        const { User, Account, Session, VerificationToken } = collectionNames;
        const { ensureCollections, ensureIndexes } = options;
        // Add Model Relationships
        UserSchema.add({
            accounts: [{ type: AccountSchema, ref: Account }],
        });
        AccountSchema.add({ userId: { type: UserSchema, ref: User } });
        SessionSchema.add({ userId: { type: UserSchema, ref: User } });
        exports.AccountModel = AccountModel = models[Account] || (0, ottoman_1.model)(Account, AccountSchema);
        exports.UserModel = UserModel = models[User] || (0, ottoman_1.model)(User, UserSchema, { idKey: "email" });
        exports.SessionModel = SessionModel = models[Session] || (0, ottoman_1.model)(Session, SessionSchema);
        exports.VerificationTokenModel = VerificationTokenModel =
            models[VerificationToken] ||
                (0, ottoman_1.model)(VerificationToken, UserVerifcationSchema, {
                    idKey: "token",
                });
        ensureCollections && (await db.ensureCollections());
        ensureIndexes && (await db.ensureIndexes());
        const warning = "WARNING: Do not use `ensureCollections` or `ensureIndexes` in production";
        ensureCollections && ensureIndexes && console.warn(warning);
        modelsNeedSetup = false;
        console.log("Next Auth Model Setup Completed Successfully!");
    }
    return {
        async createUser(user) {
            await getInstance();
            const newUser = new UserModel(user);
            const res = await newUser.save();
            res.id = res.email;
            return res;
        },
        async getUser(id) {
            await getInstance();
            const res = await UserModel.findById(id).catch(doc_not_found);
            if (!res)
                return null;
            res.id = res.email;
            delete res._type;
            return res;
        },
        async getUserByEmail(email) {
            await getInstance();
            const user = (await UserModel.findByEmail(email)).rows[0] || null;
            if (!user)
                return null;
            return { ...user, id: user.email };
        },
        async getUserByAccount(provider) {
            await getInstance();
            const opts = { populate: "userId" };
            const resProm = AccountModel.findOne(provider, opts);
            const res = await resProm.catch(doc_not_found);
            if (!res)
                return null;
            res.userId.id = res.userId.email;
            delete res.userId._type;
            delete res.userId.accounts;
            return res.userId;
        },
        async updateUser(user) {
            await getInstance();
            const res = await UserModel.findById(user.id);
            const updatedUser = new UserModel({ ...res, ...user });
            const saved = await updatedUser.save();
            return saved;
        },
        async deleteUser(userId) {
            await AccountModel.removeMany({ userId });
            await SessionModel.removeMany({ userId });
            const deleted = await UserModel.findOneAndRemove({ email: userId });
            if (!deleted)
                return null;
            delete deleted.accounts;
            return deleted;
        },
        async linkAccount(account) {
            await getInstance();
            const user = await UserModel.findById(account.userId);
            const newAcc = new AccountModel({ ...account });
            const res = await newAcc.save();
            user.accounts = user.accounts ? [...user.accounts, account] : [account];
            await user.save();
            return res;
        },
        async unlinkAccount(Provider) {
            const unlinked = await AccountModel.findOneAndRemove(Provider);
            return unlinked;
        },
        async createSession(Session) {
            await getInstance();
            const newSess = new SessionModel(Session);
            const res = await newSess.save();
            return { ...res };
        },
        async getSessionAndUser(sessionToken) {
            await getInstance();
            const sessProm = SessionModel.findOne({ sessionToken });
            const session = await sessProm.catch(doc_not_found);
            if (!session)
                return null;
            const userProm = UserModel.findOne({ email: session.userId });
            const user = await userProm.catch(doc_not_found);
            if (!user)
                return null;
            return { session, user: { ...user, id: user.email } };
        },
        async updateSession({ sessionToken, expires }) {
            await getInstance();
            const query = { sessionToken };
            const newDoc = { sessionToken, expires };
            const sessProm = SessionModel.findOneAndUpdate(query, newDoc);
            const session = await sessProm.catch(doc_not_found);
            return session;
        },
        async deleteSession(sessionToken) {
            await getInstance();
            const sessProm = SessionModel.findOneAndRemove({ sessionToken });
            const session = await sessProm.catch(doc_not_found);
            return session;
        },
        async createVerificationToken(verifyToken) {
            const tokenDoc = new VerificationTokenModel(verifyToken);
            await tokenDoc.save();
            return tokenDoc;
        },
        async useVerificationToken(verification) {
            const tokenProm = VerificationTokenModel.findOne(verification);
            const tokenDoc = await tokenProm.catch(doc_not_found);
            if (tokenDoc)
                await VerificationTokenModel.removeById(tokenDoc.token);
            return tokenDoc;
        },
    };
}
exports.default = MyAdapter;
