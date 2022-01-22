import Knex from "knex";

//#region sql

async function insertDate(knex, instance) {
  const modified = instance;
  delete modified.id;
  modified.id = (await knex("dateTable").insert(modified))[0];
  return modified;
}

async function insertTimestamp(knex, instance) {
  const modified = instance;
  delete modified.id;
  modified.id = (await knex("timestampTable").insert(modified))[0];
  return modified;
}

async function truncate(knex) {
  await knex.raw(`
truncate dateTable;
truncate timestampTable;`);
}

async function reset() {
  let knex;
  try {
    knex = Knex({
      client: "mysql",
      connection: {
        database: "test",
        host: "0.0.0.0",
        user: "test",
        password: "test123",
        connectTimeout: 1000,
        multipleStatements: true, // allow `knex.raw(query)`with multiple statements at a time
      },
      acquireConnectionTimeout: 2000,
    });

    // truncate so we can re-run on clean tables
    await truncate(knex);
  } catch (e) {
    console.error(e);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
}

async function dump(knex) {
  // select
  const rows1 = await knex("dateTable").select("*");
  console.table(rows1);
  const rows2 = await knex("timestampTable").select("*");
  console.table(rows2);
}

//#endregion

//#region test

async function dateTest(offset, config) {
  let knex;
  try {
    knex = Knex(config);

    let utc = new Date("2022-01-01T00:00:00.000Z");
    let local = new Date("2022-01-01T00:00:00.000");

    // insert - no manual date offsetting
    let insertDate1 = { message: offset + " UTC 00:00", date1: utc };
    await insertDate(knex, insertDate1);
    let insertDate2 = { message: offset + " Local 00:00", date1: local };
    await insertDate(knex, insertDate2);
    let insertTimestamp1 = { message: offset + " UTC 00:00", timestamp1: utc };
    await insertTimestamp(knex, insertTimestamp1);
    let insertTimestamp2 = {
      message: offset + " Local 00:00",
      timestamp1: local,
    };
    await insertTimestamp(knex, insertTimestamp2);

    // select (with same knex instance i.e. same timezone)
    await dump(knex);
  } catch (e) {
    console.error(e);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
}

//#endregion

//#region run

async function run() {
  await reset();

  // insert without timezone specified
  await dateTest("default", {
    client: "mysql",
    connection: {
      database: "test",
      host: "0.0.0.0",
      user: "test",
      password: "test123",
      connectTimeout: 1000,
      multipleStatements: true, // allow `knex.raw(query)`with multiple statements at a time
      // timezone: "local", // defaults to local - see https://github.com/mysqljs/mysql#connection-options
    },
    acquireConnectionTimeout: 2000,
  });

  // insert without timezone specified
  await dateTest("Z", {
    client: "mysql",
    connection: {
      database: "test",
      host: "0.0.0.0",
      user: "test",
      password: "test123",
      connectTimeout: 1000,
      multipleStatements: true, // allow `knex.raw(query)`with multiple statements at a time
      timezone: "Z",
      // dateStrings: true, // https://github.com/sidorares/node-mysql2/issues/1089
    },
    acquireConnectionTimeout: 2000,
  });
}
run();

//#endregion
