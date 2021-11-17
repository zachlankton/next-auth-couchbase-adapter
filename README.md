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

1. Install `next-auth` and `next-auth-couchbase-adapter`, as well as `ottoman`.  (Ottoman depends on Couchbase Node SDK, which is included as a dep in ottoman, so no need to install couchbase)

```
npm install next-auth next-auth-couchbase-adapter ottoman
```

2. Add this adapter to your `pages/api/[...nextauth].js` next-auth configuration object.

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
  
});

  // ...
})
```

## Contributing

We're open to all community contributions! If you'd like to contribute in any way, please read our [Contributing Guide](https://github.com/nextauthjs/adapters/blob/main/CONTRIBUTING.md).

## License

ISC
