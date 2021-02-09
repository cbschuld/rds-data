# AWS Aurora Data API Client

<p>
  <img alt="npm" src="https://img.shields.io/npm/dw/rds-data?style=flat-square">
  <img alt="NPM" src="https://img.shields.io/npm/l/rds-data?style=flat-square">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square">
</p>

A decorator for the AWS Data API for Aurora Serverless.  It decorates and abstracts the Amazon SDK's implementation to make it feel more like a traditional MySQL wrapper than an HTTP based web service.  It is written in Typescript and provides type-aware return objects which allows for better support in Typescript-based solutions.

## Installation

```sh
npm install rds-data
```

## Example Usage

The decoration allows you to query, insert and update information like you would traditionally do with MySQL.

### Selecting information
```js
import { RDSDatabase } from "rds-data";

const params = {
    region: "us-east-1",
    secretArn: arn:aws:secretsmanager:us-east-1:xxxx:secret:yyyy,
    resourceArn: arn:aws:rds:us-east-1:xxxx:cluster:yyyy,
    database: dbname
};

const db = new RDSDatabase(params).getInstance();
const results = db.query( "SELECT id, name FROM NameTable WHERE name = :name", { name: "Chris Schuld" });
```
```js
assert( results.data.length === 1);
assert( results.data[0].name.string === "Chris Schuld" );
```

### Inserting Information

```js
const results = db.query( "INSERT INTO Name (id, name) VALUES(null, :name)", { name: "Chris Schuld" });
```
```js
assert( results.insertId === X); // the id of the insert (MySQL only, for PostgreSQL, use RETURNING in your SQL statement)
assert( results.numberOfRecordsUpdated === 1 ); // note that this is always 0 when using the RETURNING clause in PostgreSQL
```

### Updating Information

```js
const results = db.query( "UPDATE Name SET name = :name WHERE id = :id LIMIT 1", { id: 10, name: "Chris Schuld" });
```
```js
assert( results.numberOfRecordsUpdated === 1 );
```

### Transaction Examples

```js
await rds.transaction().then(async (transactionId) => {
    await rds.query("INSERT INTO Name (name) VALUES(:name)",{ name: "Jules Winnfield" }, transactionId);
    await rds.query("INSERT INTO Name (name) VALUES(:name)", { name: "Vincent Vega" }, transactionId);
    await rds.query("INSERT INTO Name (name) VALUES(:name)", { name: "Marsellus Wallace" }, transactionId);
    await rds.commit(transactionId);
});
```
```js
    // can do a rollback easily
    await rds.rollback(transactionId);
```

## Typed Results

When a response comes back from the decorator it is stored in an instance of `ColumnValue` which provides typed results.  Here is an example of pulling a **date**, a **string** and a **number**

```js
const db = new RDSDatabase(params).getInstance();
const results = db.query( "SELECT born, name, age FROM Names WHERE name = :name", { name: "Scarlett Johansson" });

for(const result of results.data) {
  const born = result.date; // Date() instance === 1984-11-22
  const name = result.string; // string instance === "Scarlett Johansson"
  const age = result.number; // integer primitive === 35
}
```

## Types

When a response comes in the RDSData returns it already typed for you.  Depending on the column type it also may coerce or represent the value in another "type."

Results are managed from the following database types into result types:

| Database Type | RDSData Type | Description |
| ------------- | ------------ | ----------- |
| BINARY | *row*.buffer | converts the blob value into a new Buffer |
| BINARY | *row*.string | converts the binary value into a string |
| BIT | *row*.boolean | converts the bit into boolean |
| BIT | *row*.number | converts the bit to either a 1 or a 0 |
| TIMESTAMP, DATETIME and DATE | *row*.date | a parsed instance of `new Date()` |
| TIMESTAMP, DATETIME and DATE | *row*.string | the string value of the date/time ISO8601 |
| TIMESTAMP, DATETIME and DATE | *row*.number | timestamp value of the column |
| INT, INT UNSIGNED, TINYINT, BIGINT, BIGINT UNSIGNED | *row*.number | numeric value |
| TEXT, MEDIUMTEXT, CHAR, VARCHAR | *row*.string | string value |


## Overview
Amazon AWS produces a Data API for Aurora Serverless which is a great API if you are building serverless solutions.  One of the consistent challenges with serverless lambda in a VPC has extended cold start times and does not have access to the outside world unless you stand up a NAT Gateway.  Thus, inside the VPC you can see your Aurora instances but you cannot see the outside world.  The API provides a nice way to exist in the traditional lambda pool but still access your private LAN Aurora instance.  The API also helps with connection pooling and other challenges with building serverless applications that may end up with aggressive concurrency.

<img style="zoom:50%;text-align:center;" src="https://user-images.githubusercontent.com/231867/79626919-018d6380-80e9-11ea-9b8b-9891e39a0107.png"/>

## Setup and Configuration

The following are the options for setting up the `RDSDatabase`.

| Property | Type | Description |
| -------- | ---- | ----------- |
| resourceArn | `string` | **required** - the ARN of your Aurora Serverless Cluster. |
| secretArn | `string` | **required** - the ARN of the secret associated with your database credentials. |
| database | `string` | **required** - the name of the database. |
| region | `string`  | **optional** - AWS region to use (defaults to the AWS-SDK default. |


## Enabling Data API
In order to use the Data API, you must enable it on your Aurora Serverless Cluster and create a Secret. You also must grant your execution environment a number of permission (see below):

### Enable Data API on your Aurora Serverless Cluster

![Enable Data API in Network & Security settings of your cluster](https://user-images.githubusercontent.com/2053544/58768968-79ee4300-8570-11e9-9266-1433182e0db2.png)

You need to modify your Aurora Serverless cluster by clicking "ACTIONS" and then "Modify Cluster". Just check the Data API box in the *Network & Security* section and you are done. Your Aurora Serverless cluster still runs in a VPC, even though you do not need to run your Lambdas in a VPC to access it via the Data API.

### Setup a secret in the Secrets Manager

Next you need to setup a secret in the Secrets Manager. Username, password, encryption key (*the default encryption key is probably fine for you*), and select the database you want to access with the secret.

![Enter database credentials and select database to access](https://user-images.githubusercontent.com/2053544/58768974-912d3080-8570-11e9-8878-636dfb742b00.png)


Next we give it a name, this is important, because this will be part of the arn when we set up permissions.

![Give your secret a name and add a description](https://user-images.githubusercontent.com/2053544/58768984-a7d38780-8570-11e9-8b21-199db5548c73.png)

You can then configure your rotation settings, if you want, and then you review and create your secret. Then you can click on your newly created secret and grab the arn, we’re gonna need that next.

![Click on your secret to get the arn.](https://user-images.githubusercontent.com/2053544/58768989-bae65780-8570-11e9-94fb-51f6fa7d34bf.png)

### Required Permissions for Serverless

In order to use the Data API, your execution environment requires several IAM permissions. Below are the minimum permissions required.

**YAML:**
```yaml
Statement:
  - Effect: "Allow"
    Action:
      - "rds-data:ExecuteSql"
      - "rds-data:ExecuteStatement"
      - "rds-data:BatchExecuteStatement"
      - "rds-data:BeginTransaction"
      - "rds-data:RollbackTransaction"
      - "rds-data:CommitTransaction"
    Resource: "arn:aws:rds:{REGION}:{ACCOUNT-ID}:cluster:{YOUR-CLUSTER-NAME}"
  - Effect: "Allow"
    Action:
      - "secretsmanager:GetSecretValue"
    Resource: "arn:aws:secretsmanager:{REGION}:{ACCOUNT-ID}:secret:{PATH-TO-SECRET}/*"
```

**JSON:**
```javascript
"Statement" : [
  {
    "Effect": "Allow",
    "Action": [
      "rds-data:ExecuteSql",
      "rds-data:ExecuteStatement",
      "rds-data:BatchExecuteStatement",
      "rds-data:BeginTransaction",
      "rds-data:RollbackTransaction",
      "rds-data:CommitTransaction"
    ],
    "Resource": "arn:aws:rds:{REGION}:{ACCOUNT-ID}:cluster:{YOUR-CLUSTER-NAME}"
  },
  {
    "Effect": "Allow",
    "Action": [ "secretsmanager:GetSecretValue" ],
    "Resource": "arn:aws:secretsmanager:{REGION}:{ACCOUNT-ID}:secret:{PATH-TO-SECRET}/*"
  }
]
```

## Special Thanks

Special thanks to Jeremy Daly whom was an early adopter of the RDS Data API as well and provides a similar package called the [data-api-client](https://github.com/jeremydaly/data-api-client).  A lot of his work is similar but less type aware.  Additionally portions of this readme are extracted from Jeremy's work!

Additionally, a huge thank you to Mark Herhold for helping to add all of the CI/GH Actions integration as well as providing additional work on the library at large.  The library is better because of his work.
