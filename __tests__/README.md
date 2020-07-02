# rds-data Tests

We use jest-runner-groups to separate tests into `mysql` and `pg` groups. Tests without either `mysql` or `pg` in the filename need to be generic and work with both DBs.

**Requirements:**
* Docker

**Running Tests**
Please see the test phases in `.github/workflows/build-and-test.yml` to see how to setup docker.

Test commands:
```
npm run test-mysql
# or
npm run test-pg
```

**Debugging:**
To debug queries, use this:
```ts
import * as AWS from 'aws-sdk';
AWS.config.logger = console;
```

**Running GitHub Actions Locally**
Use [act](https://github.com/nektos/act) to run GitHub actions locally:

```
act -P ubuntu-latest=nektos/act-environments-ubuntu:18.04
```
