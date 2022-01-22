import Knex from "knex";

//#region sql

function fixDatesOnWrite(instance) {
  let d = instance.date1 || instance.timestamp1;
  if (d && !isNaN(+d)) {
    d.setTime(d.getTime() + TZ_OFFSET_MS);
  }
}

function fixDatesOnRead(instance) {
  let d = instance.date1 || instance.timestamp1;
  if (d && !isNaN(+d)) {
    d.setTime(d.getTime() - TZ_OFFSET_MS);
  }
}

async function insertDate(knex, instance, fixDates = true) {
  // console.info(`insert date ${instance.message}`);
  if (fixDates) {
    fixDatesOnWrite(instance);
  }
  const modified = instance;
  delete modified.id;
  modified.id = (await knex("dateTable").insert(modified))[0];
  if (fixDates) {
    fixDatesOnRead(modified); // restore local dates
  }
  return modified;
}

async function insertTimestamp(knex, instance, fixDates = true) {
  // console.info(`insert timestamp ${instance.message}`);
  if (fixDates) {
    fixDatesOnWrite(instance);
  }
  const modified = instance;
  delete modified.id;
  modified.id = (await knex("timestampTable").insert(modified))[0];
  if (fixDates) {
    fixDatesOnRead(modified); // restore local dates
  }
  return modified;
}

async function truncate(knex) {
  await knex.raw(`
truncate dateTable;
truncate timestampTable;`);
}

//#endregion

//#region test

async function dateTest(offset, config, doManualOffset = false) {
  let knex;
  try {
    knex = Knex(config);

    let utc = new Date("2022-01-01T00:00:00.000Z");
    let local = new Date("2022-01-01T00:00:00.000");
    // console.log("utc:", utc);
    // console.log("local:", local);

    // insert - no manual date offsetting
    let insertDate1 = { message: offset + " UTC 00:00", date1: utc };
    await insertDate(knex, insertDate1, false);
    let insertDate2 = { message: offset + " Local 00:00", date1: local };
    await insertDate(knex, insertDate2, false);
    let insertTimestamp1 = { message: offset + " UTC 00:00", timestamp1: utc };
    await insertTimestamp(knex, insertTimestamp1, false);
    let insertTimestamp2 = {
      message: offset + " Local 00:00",
      timestamp1: local,
    };
    await insertTimestamp(knex, insertTimestamp2, false);

    // insert - do manual date offsetting
    if (doManualOffset) {
      let insertDate3 = { message: offset + " UTC 00:00 (fixed)", date1: utc };
      await insertDate(knex, insertDate3, true);
      // console.log("utc:", utc);
      let insertDate4 = {
        message: offset + " Local 00:00 (fixed)",
        date1: local,
      };
      // console.log("local:", local);
      await insertDate(knex, insertDate4, true);
      let insertTimestamp3 = {
        message: offset + " UTC 00:00 (fixed)",
        timestamp1: utc,
      };
      await insertTimestamp(knex, insertTimestamp3, true);
      let insertTimestamp4 = {
        message: offset + " Local 00:00 (fixed)",
        timestamp1: local,
      };
      await insertTimestamp(knex, insertTimestamp4, true);
    }
    // select
    await dump(knex);
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

//#region run

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

  /*
  // careful not to mix knex instances - select with timezone:local knex
  let knex = Knex({
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
  await dump(knex);
  knex.destroy();
  */
}
run();

//#endregion
