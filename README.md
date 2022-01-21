# Dates

Dates are tricky

Current behaviour (2022-01-20)

- knex appears to tzoffset on insert and on select for both DATETIME and TIMESTAMP
- it seems to default to the local timezone offset if not specied i.e.
  - setting `{ connection: { timezone: "+02:00" } }` in the Knex config options has same effect as NOT setting `timezone` if you are in SAST (i.e. if you're in a +2 timezone then Knex will default to +2 if you don't specify it manually)
  - however if you specify a different timezone then

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
