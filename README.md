# Dates

Summary

- `timezone: "Z"` should be sufficient to write UTC dates to mysql
- it will also read them correctly
- see: [final.mjs](./src/final.mjs)
- NB: my old code: [dates.mjs](./src/dates.mjs) had a [bug](#incorrect) which made it look like timezone was only applied to insert not select

## setup

```sh
git clone https://github/com/ilanc/knex-dates.git
cd knex-dates
npm i

# edit these first
code ./scripts/create-db-user-tables.sql
code ./scripts/create.sh

# before runing this - NOTE: will drop and recreate `DATABASE test` & create a user `test`
./scripts/create.sh
```

## run

```sh
npm run start
```

## output

Running in +02:00 timezone with timezone set to +2 or left on default

```log
node ./src/final.mjs && ./src/select.sh
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │          date1           │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T00:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2021-12-31T22:00:00.000Z │
└─────────┴────┴───────────────────────┴──────────────────────────┘
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │        timestamp1        │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T00:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2021-12-31T22:00:00.000Z │
└─────────┴────┴───────────────────────┴──────────────────────────┘
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │          date1           │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T02:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2022-01-01T00:00:00.000Z │
│    2    │ 3  │     'Z UTC 00:00'     │ 2022-01-01T00:00:00.000Z │
│    3    │ 4  │    'Z Local 00:00'    │ 2021-12-31T22:00:00.000Z │
└─────────┴────┴───────────────────────┴──────────────────────────┘
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │        timestamp1        │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T02:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2022-01-01T00:00:00.000Z │
│    2    │ 3  │     'Z UTC 00:00'     │ 2022-01-01T00:00:00.000Z │
│    3    │ 4  │    'Z Local 00:00'    │ 2021-12-31T22:00:00.000Z │
└─────────┴────┴───────────────────────┴──────────────────────────┘
mysql: [Warning] Using a password on the command line interface can be insecure.
+----+---------------------+---------------------+
| id | message             | date1               |
+----+---------------------+---------------------+
|  1 | default UTC 00:00   | 2022-01-01 02:00:00 |
|  2 | default Local 00:00 | 2022-01-01 00:00:00 |
|  3 | Z UTC 00:00         | 2022-01-01 00:00:00 |
|  4 | Z Local 00:00       | 2021-12-31 22:00:00 |
+----+---------------------+---------------------+
mysql: [Warning] Using a password on the command line interface can be insecure.
+----+---------------------+---------------------+
| id | message             | timestamp1          |
+----+---------------------+---------------------+
|  1 | default UTC 00:00   | 2022-01-01 02:00:00 |
|  2 | default Local 00:00 | 2022-01-01 00:00:00 |
|  3 | Z UTC 00:00         | 2022-01-01 00:00:00 |
|  4 | Z Local 00:00       | 2021-12-31 22:00:00 |
+----+---------------------+---------------------+
```

## incorrect

Was mixing knex instances - one to do insert (with timezone: local) another to do select (with timezone: z).

Current behaviour (2022-01-20)

- knex appears to tzoffset as follows:
  - on insert by the timezone that you specify in the knex config options (or the system timezone if unspecified)
  - on select by the system timezone regardless of what you specify in the knex config options
  - this happens in the same fashion for both DATETIME and TIMESTAMP
- hence the only solution is to:
  - avoid specifying the timezone
  - or specify the timezone explicitly but match the system timezone
  - note: in either case above knex will write the **local** date string to mysql (see problem below)
- NOTE: do NOT attempt to resolve this by specifying a different timezone to the system timezone (e.g. UTC when your system is not in UTC)
  - this will offset by different amounts on insert & select and hence cause you to receive a different date upon select to that which was inserted

Problem

- mysql DATETIMEs don't have a timezone
  - if you read and write local dates from 2 systems with different timezones then you will wind up with different dates on each system
  - e.g. if you have an ec2 in eu-west-2 (i.e. +00:00) writing dates and a support machine in af-south-1 (i.e. +02:00) reading dates then
    - the ec2 will write "2022-01-01 00:00" to the DB intending it to be "2022-01-01Z"
    - and the support machine will read "2022-01-01 00:00" as "2021-12-31T22:00:00.000Z"
- the solution to this is either:
  - set timezone to +0 (so that inserts are not modified) and manually offset dates on select by `- systemOffset`

Behaviour may have changed

- https://github.com/knex/knex/issues/97
