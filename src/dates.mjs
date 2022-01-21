import Knex from "knex";

//#region timezone

// timezone difference in hours and minutes e.g. +02:00, -06:00 or Z
function timeZoneStr() {
  let offset_hrs = Math.floor(Math.abs(TZ_OFFSET / 60));
  let offset_min = Math.abs(TZ_OFFSET % 60);
  let tzStr;
  if (offset_hrs < 10) {
    offset_hrs = "0" + offset_hrs;
  }
  if (offset_min < 10) {
    offset_min = "0" + offset_min;
  }
  if (TZ_OFFSET < 0) {
    tzStr = "+" + offset_hrs + ":" + offset_min;
  } else if (TZ_OFFSET > 0) {
    tzStr = "-" + offset_hrs + ":" + offset_min;
  } else if (TZ_OFFSET == 0) {
    tzStr = "+00:00";
  }
  return tzStr;
}

// TODO: try replace with a TZ_OFFSET that differs from your actual timezone
// const TZ_OFFSET = -300; // +05:00
// const TZ_OFFSET = 0; // +00:00
const TZ_OFFSET = new Date().getTimezoneOffset();
const TZ_OFFSET_MS = TZ_OFFSET * 60 * 1000;
const TZ_STR = timeZoneStr();

// console.log("TZ_OFFSET:", TZ_OFFSET);
// console.log("TZ_OFFSET_MS:", TZ_OFFSET_MS);
console.log("TZ_STR:", TZ_STR);

//#endregion

//#region config

const normalConnection = {
  database: "test",
  host: "0.0.0.0",
  user: "test",
  password: "test123",
  connectTimeout: 1000,
  multipleStatements: true, // allow `knex.raw(query)`with multiple statements at a time
};
const connectionWithTimezoneOffset = Object.assign({}, normalConnection, {
  timezone: TZ_STR,
});
const config1 = {
  client: "mysql",
  connection: normalConnection,
  acquireConnectionTimeout: 2000,
};
const config2 = Object.assign({}, config1, {
  connection: connectionWithTimezoneOffset,
});

//#endregion

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
  let knex;
  try {
    knex = Knex(config1);

    // truncate so we can re-run on clean tables
    await truncate(knex);

    // insert without timezone specified
    await dateTest("default", config1);
    // insert without timezone specified
    await dateTest(TZ_STR, config2);

    // select
    const rows1 = await knex("dateTable").select("*");
    console.table(rows1);
    const rows2 = await knex("timestampTable").select("*");
    console.table(rows2);
  } catch (e) {
    console.error(e);
  } finally {
    if (knex) {
      knex.destroy();
    }
  }
}
run();

//#endregion
