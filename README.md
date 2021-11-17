<p align="center">
   <br/>
   <a href="https://next-auth.js.org" target="_blank"><img height="64px" src="https://next-auth.js.org/img/logo/logo-sm.png" /></a>&nbsp;&nbsp;&nbsp;&nbsp;<img height="64px" src="https://www.couchbase.com/webfiles/1636734595522/images/couchbase_logo_black.svg" />
   <h3 align="center"><b>Couchbase Adapter</b> - NextAuth.js</h3>
   <p align="center">
   Open Source. Full Stack. Own Your Data.
   </p>
   <p align="center" style="align: center;">
      <img src="https://github.com/nextauthjs/adapters/actions/workflows/release.yml/badge.svg" alt="CI Test" />
   </p>
</p>

## Overview

This is the Couchbase Adapter for [`next-auth`](https://next-auth.js.org). This package can only be used in conjunction with the primary `next-auth` package. It is not a standalone package.

This adapter uses Ottoman ODM to connect `next-auth` to Couchbase.

## Getting Started

1. Install `next-auth` and `@next-auth/couchbase-adapter`, as well as `ottoman`.  (Ottoman depends on Couchbase Node SDK, which is included as a dep in ottoman, so no need to install couchbase)

```
npm install next-auth @next-auth/couchbase-adapter ottoman
```

2. Add this adapter to your `pages/api/[...nextauth].js` next-auth configuration object.

```js
import NextAuth from "next-auth"
import Providers from "next-auth/providers"
import { PouchDBAdapter } from "@next-auth/pouchdb-adapter"
import PouchDB from "pouchdb"

// Setup your PouchDB instance and database
PouchDB.plugin(require("pouchdb-adapter-leveldb")) // Or any other PouchDB-compliant adapter
  .plugin(require("pouchdb-find")) // Don't forget the `pouchdb-find` plugin

const pouchdb = new PouchDB("auth_db", { adapter: "leveldb" })

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth({
  // https://next-auth.js.org/configuration/providers
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  adapter: PouchDBAdapter(pouchdb),
  // ...
})
```

## Advanced

### Memory-First Caching Strategy

If you need to boost your authentication layer performance, you may use PouchDB's powerful sync features and various adapters, to build a memory-first caching strategy.

Use an in-memory PouchDB as your main authentication database, and synchronize it with any other persisted PouchDB. You may do a one way, one-off replication at startup from the persisted PouchDB into the in-memory PouchDB, then two-way, continuous, retriable sync.

This will probably not improve performance much in a serverless environment for various reasons such as concurrency, function startup time increases, etc.

For more details, please see https://pouchdb.com/api.html#sync

## Contributing

We're open to all community contributions! If you'd like to contribute in any way, please read our [Contributing Guide](https://github.com/nextauthjs/adapters/blob/main/CONTRIBUTING.md).

## License

ISC
