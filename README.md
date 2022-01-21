# Dates

Dates are tricky

Current behaviour (2022-01-20)

- knex appears to tzoffset on insert and on select for both DATETIME and TIMESTAMP
- it seems to default to the local timezone offset if not specied i.e.
  - setting `{ connection: { timezone: "+02:00" } }` in the Knex config options has same effect as NOT setting `timezone` if you are in SAST (i.e. if you're in a +2 timezone then Knex will default to +2 if you don't specify it manually)
  - however if you specify a different timezone then it will offset the dates on insert / select (i.e. you will see differences between dates inserted with knex instance where timezone was specified vs an instance where timezone was not specified)

Behaviour may have changed

- https://github.com/knex/knex/issues/97

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
npm run start

> knex-dates@0.0.1 start
> node ./src/dates.mjs && ./src/select.sh

TZ_STR: +02:00
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │          date1           │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T00:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2021-12-31T22:00:00.000Z │
│    2    │ 3  │  '+02:00 UTC 00:00'   │ 2022-01-01T00:00:00.000Z │
│    3    │ 4  │ '+02:00 Local 00:00'  │ 2021-12-31T22:00:00.000Z │
└─────────┴────┴───────────────────────┴──────────────────────────┘
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │        timestamp1        │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T00:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2021-12-31T22:00:00.000Z │
│    2    │ 3  │  '+02:00 UTC 00:00'   │ 2022-01-01T00:00:00.000Z │
│    3    │ 4  │ '+02:00 Local 00:00'  │ 2021-12-31T22:00:00.000Z │
└─────────┴────┴───────────────────────┴──────────────────────────┘
mysql: [Warning] Using a password on the command line interface can be insecure.
+----+---------------------+---------------------+
| id | message             | date1               |
+----+---------------------+---------------------+
|  1 | default UTC 00:00   | 2022-01-01 02:00:00 |
|  2 | default Local 00:00 | 2022-01-01 00:00:00 |
|  3 | +02:00 UTC 00:00    | 2022-01-01 02:00:00 |
|  4 | +02:00 Local 00:00  | 2022-01-01 00:00:00 |
+----+---------------------+---------------------+
mysql: [Warning] Using a password on the command line interface can be insecure.
+----+---------------------+---------------------+
| id | message             | timestamp1          |
+----+---------------------+---------------------+
|  1 | default UTC 00:00   | 2022-01-01 02:00:00 |
|  2 | default Local 00:00 | 2022-01-01 00:00:00 |
|  3 | +02:00 UTC 00:00    | 2022-01-01 02:00:00 |
|  4 | +02:00 Local 00:00  | 2022-01-01 00:00:00 |
+----+---------------------+---------------------+
```

Running in +02:00 timezone with timezone set to +5 or left on default

```log
npm run start

> knex-dates@0.0.1 start
> node ./src/dates.mjs && ./src/select.sh

TZ_STR: +05:00
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │          date1           │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T00:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2021-12-31T22:00:00.000Z │
│    2    │ 3  │  '+05:00 UTC 00:00'   │ 2022-01-01T03:00:00.000Z │ <= knex uses configured timezone (+5) on insert but default timezone (+2) on select? see sql output below
│    3    │ 4  │ '+05:00 Local 00:00'  │ 2022-01-01T01:00:00.000Z │ <= knex uses configured timezone (+5) on insert but default timezone (+2) on select? see sql output below
└─────────┴────┴───────────────────────┴──────────────────────────┘
┌─────────┬────┬───────────────────────┬──────────────────────────┐
│ (index) │ id │        message        │        timestamp1        │
├─────────┼────┼───────────────────────┼──────────────────────────┤
│    0    │ 1  │  'default UTC 00:00'  │ 2022-01-01T00:00:00.000Z │
│    1    │ 2  │ 'default Local 00:00' │ 2021-12-31T22:00:00.000Z │
│    2    │ 3  │  '+05:00 UTC 00:00'   │ 2022-01-01T03:00:00.000Z │ <= knex uses configured timezone (+5) on insert but default timezone (+2) on select? see sql output below
│    3    │ 4  │ '+05:00 Local 00:00'  │ 2022-01-01T01:00:00.000Z │ <= knex uses configured timezone (+5) on insert but default timezone (+2) on select? see sql output below
└─────────┴────┴───────────────────────┴──────────────────────────┘
mysql: [Warning] Using a password on the command line interface can be insecure.
+----+---------------------+---------------------+
| id | message             | date1               |
+----+---------------------+---------------------+
|  1 | default UTC 00:00   | 2022-01-01 02:00:00 |
|  2 | default Local 00:00 | 2022-01-01 00:00:00 |
|  3 | +05:00 UTC 00:00    | 2022-01-01 05:00:00 | <= knex uses configured timezone (+5) on insert
|  4 | +05:00 Local 00:00  | 2022-01-01 03:00:00 | <= knex uses configured timezone (+5) on insert
+----+---------------------+---------------------+
mysql: [Warning] Using a password on the command line interface can be insecure.
+----+---------------------+---------------------+
| id | message             | timestamp1          |
+----+---------------------+---------------------+
|  1 | default UTC 00:00   | 2022-01-01 02:00:00 |
|  2 | default Local 00:00 | 2022-01-01 00:00:00 |
|  3 | +05:00 UTC 00:00    | 2022-01-01 05:00:00 | <= knex uses configured timezone (+5) on insert
|  4 | +05:00 Local 00:00  | 2022-01-01 03:00:00 | <= knex uses configured timezone (+5) on insert
+----+---------------------+---------------------+
```
