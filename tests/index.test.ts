import { Ottoman, SearchConsistency } from "ottoman"
import CouchbaseAdapter, {
  adapterOptions,
  UserModel,
  AccountModel,
  SessionModel,
  VerificationTokenModel,
  doc_not_found,
} from "../src"
import { runBasicTests } from "../../../basic-tests"

const ottoman = new Ottoman({
  consistency: SearchConsistency.LOCAL,
})

const adapteropts: adapterOptions = {
  connectionString: "couchbase://localhost",
  bucketName: "connext",
  username: "Administrator",
  password: "1234567890",
  ensureCollections: true,
  ensureIndexes: true,
  //optionally specify collection names
  collectionNames: {
    User: "TestUser",
    Account: "TestAccount",
    Session: "TestSession",
  },
}

test(
  "Setup Couchbase Auth Models",
  async () => {
    await ottoman.connect(adapteropts)
    await CouchbaseAdapter(adapteropts).createUser({
      email: "test@example.com",
      emailVerified: Date.now(),
      name: "Test User",
      image: "https://www.fillmurray.com/460/300",
    })
  },
  30 * 1000
)

runBasicTests({
  adapter: CouchbaseAdapter(adapteropts),
  db: {
    disconnect: async () => await ottoman.close(),
    connect: async () => await ottoman.connect(adapteropts),
    session: async (sessionToken: string) => {
      return await SessionModel.findOne({ sessionToken }).catch(doc_not_found)
    },
    user: async (id: string) => {
      const user = await UserModel.findById(id).catch(doc_not_found)
      if (!user) return null
      delete user._type
      delete user.accounts
      user.id = user.email
      return user
    },
    account: async (Provider: {
      provider: string
      providerAccountId: string
    }) => {
      return await AccountModel.findOne(Provider).catch(doc_not_found)
    },
    verificationToken: async (params: {
      identifier: string
      token: string
    }) => {
      return await VerificationTokenModel.findOne(params).catch(doc_not_found)
    },
  },
})
