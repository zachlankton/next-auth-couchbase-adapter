import {
  getDefaultInstance,
  Ottoman,
  model,
  Schema,
  ModelTypes,
  SearchConsistency,
} from "ottoman"
import { Adapter, AdapterUser } from "next-auth/adapters"
import { ConnectOptions } from "ottoman/lib/types/ottoman/ottoman"

export interface collectionNames {
  User?: string
  Account?: string
  Session?: string
  VerificationToken?: string
}

export interface adapterOptions extends ConnectOptions {
  instance?: Ottoman
  ensureCollections?: boolean
  ensureIndexes?: boolean
  collectionNames?: collectionNames
}

interface sessionProps {
  sessionToken: string
  userId?: string
  expires?: Date
}

const doc_not_found = (reason: any) => {
  if (reason.message === "document not found") return null
  throw new Error(reason)
}
export { doc_not_found }

const UserSchema = new Schema({
  name: String,
  email: { type: String, required: true },
  emailVerified: Schema.Types.Date,
  image: String,
})

UserSchema.index.findByEmail = {
  by: "email",
  type: "n1ql",
}

const AccountSchema = new Schema({
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
})

const SessionSchema = new Schema({
  expires: Schema.Types.Date,
  sessionToken: String,
})
SessionSchema.index.findBySessionToken = {
  by: "sessionToken",
  type: "n1ql",
}

const UserVerifcationSchema = new Schema({
  token: String,
  expires: Schema.Types.Date,
  identifier: String,
})

let modelsNeedSetup = true
let UserModel: ModelTypes
let AccountModel: ModelTypes
let SessionModel: ModelTypes
let VerificationTokenModel: ModelTypes
export { UserModel, AccountModel, SessionModel, VerificationTokenModel }

/** @return { import("next-auth/adapters").Adapter } */
export default function MyAdapter(options: adapterOptions): Adapter {
  const collectionNames = {
    User: "User",
    Account: "UserAccount",
    Session: "UserSession",
    VerificationToken: "UserVerificationToken",
    ...options.collectionNames,
  }

  async function getInstance() {
    const ot_opts = { consistency: SearchConsistency.LOCAL }
    const db: Ottoman =
      options.instance ?? getDefaultInstance() ?? new Ottoman(ot_opts)
    if (!db.bucket) await db.connect(options)
    modelsNeedSetup && (await setupModels(db))
    return db
  }

  async function setupModels(db: Ottoman) {
    console.log("Setting up Next Auth Couchbase/Ottoman Models")
    const models: { [key: string]: any } = getDefaultInstance().models
    const { User, Account, Session, VerificationToken } = collectionNames
    const { ensureCollections, ensureIndexes } = options

    // Add Model Relationships
    UserSchema.add({
      accounts: [{ type: AccountSchema, ref: Account }],
    })
    AccountSchema.add({ userId: { type: UserSchema, ref: User } })
    SessionSchema.add({ userId: { type: UserSchema, ref: User } })

    AccountModel = models[Account] || model(Account, AccountSchema)
    UserModel = models[User] || model(User, UserSchema, { idKey: "email" })
    SessionModel = models[Session] || model(Session, SessionSchema)
    VerificationTokenModel =
      models[VerificationToken] ||
      model(VerificationToken, UserVerifcationSchema, {
        idKey: "token",
      })

    ensureCollections && (await db.ensureCollections())
    ensureIndexes && (await db.ensureIndexes())
    const warning =
      "WARNING: Do not use `ensureCollections` or `ensureIndexes` in production"
    ensureCollections && ensureIndexes && console.warn(warning)
    modelsNeedSetup = false
    console.log("Next Auth Model Setup Completed Successfully!")
  }

  return {
    async createUser(user) {
      await getInstance()
      const newUser = new UserModel(user)
      const res = await newUser.save()
      res.id = res.email
      return res
    },

    async getUser(id: string) {
      await getInstance()
      const res = await UserModel.findById(id).catch(doc_not_found)
      if (!res) return null
      res.id = res.email
      delete res._type
      return res
    },

    async getUserByEmail(email) {
      await getInstance()
      const user = (await UserModel.findByEmail(email)).rows[0] || null
      if (!user) return null
      return { ...user, id: user.email }
    },

    async getUserByAccount(provider) {
      await getInstance()
      const opts = { populate: "userId" }
      const resProm = AccountModel.findOne(provider, opts)
      const res = await resProm.catch(doc_not_found)
      if (!res) return null
      res.userId.id = res.userId.email
      delete res.userId._type
      delete res.userId.accounts
      return res.userId
    },

    async updateUser(user: any) {
      await getInstance()
      const res = await UserModel.findById(user.id)
      const updatedUser = new UserModel({ ...res, ...user })
      const saved = await updatedUser.save()
      return saved
    },

    async deleteUser(userId) {
      await AccountModel.removeMany({ userId })
      await SessionModel.removeMany({ userId })
      const deleted = await UserModel.findOneAndRemove({ email: userId })
      if (!deleted) return null
      delete deleted.accounts
      return deleted as AdapterUser
    },

    async linkAccount(account: any) {
      await getInstance()
      const user = await UserModel.findById(account.userId)
      const newAcc = new AccountModel({ ...account })
      const res = await newAcc.save()
      user.accounts = user.accounts ? [...user.accounts, account] : [account]
      await user.save()
      return res
    },

    async unlinkAccount(Provider) {
      const unlinked = await AccountModel.findOneAndRemove(Provider)
      return unlinked
    },

    async createSession(Session: sessionProps) {
      await getInstance()
      const newSess = new SessionModel(Session)
      const res = await newSess.save()
      return { ...res }
    },

    async getSessionAndUser(sessionToken: string) {
      await getInstance()
      const sessProm = SessionModel.findOne({ sessionToken })
      const session = await sessProm.catch(doc_not_found)
      if (!session) return null
      const userProm = UserModel.findOne({ email: session.userId })
      const user = await userProm.catch(doc_not_found)
      if (!user) return null
      return { session, user: { ...user, id: user.email } }
    },

    async updateSession({ sessionToken, expires }: sessionProps) {
      await getInstance()
      const query = { sessionToken }
      const newDoc = { sessionToken, expires }
      const sessProm = SessionModel.findOneAndUpdate(query, newDoc)
      const session = await sessProm.catch(doc_not_found)
      return session
    },

    async deleteSession(sessionToken: string) {
      await getInstance()
      const sessProm = SessionModel.findOneAndRemove({ sessionToken })
      const session = await sessProm.catch(doc_not_found)
      return session
    },

    async createVerificationToken(verifyToken) {
      const tokenDoc = new VerificationTokenModel(verifyToken)
      await tokenDoc.save()
      return tokenDoc
    },

    async useVerificationToken(verification) {
      const tokenProm = VerificationTokenModel.findOne(verification)
      const tokenDoc = await tokenProm.catch(doc_not_found)
      if (tokenDoc) await VerificationTokenModel.removeById(tokenDoc.token)
      return tokenDoc
    },
  }
}
