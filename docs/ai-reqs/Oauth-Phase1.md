## Overview

This topic documents a two phase approach to implementing OAuth providers into the My Family Social project, while keeping the existing Credentials login. 

## What's been Configured.

The steps below describe what has been done and what needs to be done.


### Step 1: Choose Account Model

- Auth.js adapter + PostgreSQL (recommended)
  - Add Auth.js adapter tables (user, account, session, verificationTokens) and map/link to your existing user table.
  - Much easier long-term for account linking and multiple OAuth providers.

### Step 2: Register OAuth apps with GitHub