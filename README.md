<p align="center">
   <br/>
   <a href="https://next-auth.js.org" target="_blank"><img height="64px" src="https://next-auth.js.org/img/logo/logo-sm.png" /></a>&nbsp;&nbsp;&nbsp;&nbsp;<img height="64px" src="https://www.couchbase.com/webfiles/1636734595522/images/couchbase_logo_black.svg" />
   <h3 align="center"><b>Couchbase Adapter</b> - NextAuth.js</h3>
</p>

## Overview

This is the Couchbase Adapter for [`next-auth`](https://next-auth.js.org). This package can only be used in conjunction with the primary `next-auth` package. It is not a standalone package.

This adapter uses Ottoman ODM to connect `next-auth` to Couchbase.

## Getting Started

1. Install `next-auth@4.0.0-beta.6` and `next-auth-couchbase-adapter`, as well as `ottoman`. (Ottoman depends on Couchbase Node SDK, which is included as a dep in ottoman, so no need to install couchbase)

```
npm install next-auth@4.0.0-beta.6 next-auth-couchbase-adapter ottoman
```

2. Add this adapter to your `pages/api/[...nextauth].ts` next-auth configuration object.

```js
import NextAuth, { Profile } from "next-auth";
import { OAuthConfig } from "next-auth/providers";
import Google from "next-auth/providers/google";
import CouchbaseAdapter, { adapterOptions } from "next-auth-couchbase-adapter";

const options: adapterOptions = {
  connectionString: "couchbase://localhost",
  bucketName: "connext",
  username: "Administrator",
  password: "1234567890",
  // ensure collections and indexes for quick setup in development (DON'T DO THIS IN PRODUCTION)
  ensureCollections: true,
  ensureIndexes: true,
};

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }) as OAuthConfig<Profile>,
  ],
  jwt: {
    secret: process.env.SECRET as string,
  },
  adapter: CouchbaseAdapter(options),

  // ...
})
```

## Custom Collection Names

In the options objection you can add a `collectionNames` property to name the next-auth collections (models) whatever you would like:

```js
const options: adapterOptions = {
  connectionString: "couchbase://localhost",
  // ...
  collectionNames: {
    User: "WhateverUser", // default is User
    Account: "WhateverAccount", // default is UserAccount
    Session: "WhateverSession", // default is UserSession
    VerificationToken: "WhateverToken", // default is UserVerificationToken
  },
}
```

## Using your own ottoman instance

You can use your own ottoman instance if you already have a module setup that you would like to reuse, just need a reference to the Ottoman instance and make sure you export your connection settings so the couchbase adapter can connect if needed.

```js
// somewhere.ts <--- your module file

const ottoman = new Ottoman()

const connectionOptions = {
  connectionString: "couchbase://localhost",
  bucketName: "connext",
  username: "Administrator",
  password: "1234567890",
}

export { connectionOptions }
export default ottoman
```

and then in the nextauth route:

```js
// [...nextauth].ts file
import yourOttomanInstance, { connectionOptions } from "somewhere"

const options: adapterOptions = {
  instance: yourOttomanInstance,
  ...connectionOptions,
}
```

## Contributing

We're open to all community contributions! If you'd like to contribute in any way, please read our [Contributing Guide](https://github.com/nextauthjs/adapters/blob/main/CONTRIBUTING.md).

## License

ISC
