/**
 * db.js — Database driver abstraction
 * Mendukung PostgreSQL (pg) dan MySQL/MariaDB (mysql2).
 * Pilih via environment: DATABASE_TYPE=postgres | mysql
 */

"use strict";

require("dotenv").config();

const type = (process.env.DATABASE_TYPE || "mysql").toLowerCase();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a parameterised query from "?" placeholders (MySQL style)
 * to "$1, $2, …" placeholders (PostgreSQL style) when needed.
 */
function pgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => "$" + (++i));
}

// ── PostgreSQL ────────────────────────────────────────────────────────────────

function createPostgresDriver() {
  const { Pool } = require("pg");
  const pool = new Pool({
    host:     process.env.PG_HOST     || "localhost",
    port:     Number(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || "bra_running_style",
    user:     process.env.PG_USER     || "bra_app",
    password: process.env.PG_PASSWORD || "bra_app_local",
  });

  pool.on("error", (err) => console.error("[pg] idle client error", err.message));

  return {
    type: "postgres",

    async query(sql, params = []) {
      const client = await pool.connect();
      try {
        const result = await client.query(pgSql(sql), params);
        return result.rows;
      } finally {
        client.release();
      }
    },

    async run(sql, params = []) {
      const client = await pool.connect();
      try {
        await client.query(pgSql(sql), params);
      } finally {
        client.release();
      }
    },

    /** Execute multiple statements in a single transaction. */
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const tx = {
          query: async (sql, params = []) => {
            const result = await client.query(pgSql(sql), params);
            return result.rows;
          },
          run: async (sql, params = []) => {
            await client.query(pgSql(sql), params);
          },
        };
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },

    /** PostgreSQL upsert helper for app_state */
    upsertStateSql() {
      return `INSERT INTO app_state (id, state_json)
              VALUES (1, ?)
              ON CONFLICT (id) DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = NOW()`;
    },

    /** PostgreSQL upsert for buyers */
    upsertBuyerSql() {
      return `INSERT INTO buyers (name) VALUES (?)
              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
              RETURNING id`;
    },

    /** PostgreSQL upsert for styles */
    upsertStyleSql() {
      return `INSERT INTO styles
                (article_style,buyer_id,brand,description,product_group,week,
                 development_status,production_status,sample_status,mc_ratio,
                 pic_pattern,pic_mdmkt,pic_ie,pic_prod,pic_qa,extra_json)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT (article_style) DO UPDATE SET
                buyer_id=EXCLUDED.buyer_id, brand=EXCLUDED.brand,
                description=EXCLUDED.description, product_group=EXCLUDED.product_group,
                week=EXCLUDED.week, development_status=EXCLUDED.development_status,
                production_status=EXCLUDED.production_status, sample_status=EXCLUDED.sample_status,
                mc_ratio=EXCLUDED.mc_ratio, pic_pattern=EXCLUDED.pic_pattern,
                pic_mdmkt=EXCLUDED.pic_mdmkt, pic_ie=EXCLUDED.pic_ie,
                pic_prod=EXCLUDED.pic_prod, pic_qa=EXCLUDED.pic_qa,
                extra_json=EXCLUDED.extra_json, updated_at=NOW()`;
    },

    async ping() {
      await pool.query("SELECT 1");
    },
  };
}

// ── MySQL / MariaDB ───────────────────────────────────────────────────────────

function createMysqlDriver() {
  const mysql = require("mysql2/promise");
  const pool = mysql.createPool({
    host:     process.env.MYSQL_HOST     || "localhost",
    port:     Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE || "bra_running_style",
    user:     process.env.MYSQL_USER     || "bra_app",
    password: process.env.MYSQL_PASSWORD || "bra_app_local",
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
  });

  return {
    type: "mysql",

    async query(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows;
    },

    async run(sql, params = []) {
      await pool.query(sql, params);
    },

    async transaction(fn) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const tx = {
          query: async (sql, params = []) => { const [rows] = await conn.query(sql, params); return rows; },
          run:   async (sql, params = []) => { await conn.query(sql, params); },
        };
        const result = await fn(tx);
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },

    upsertStateSql() {
      return `INSERT INTO app_state (id, state_json) VALUES (1, ?)
              ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)`;
    },

    upsertBuyerSql() {
      return `INSERT INTO buyers (name) VALUES (?)
              ON DUPLICATE KEY UPDATE name = VALUES(name)`;
    },

    upsertStyleSql() {
      return `INSERT INTO styles
                (article_style,buyer_id,brand,description,product_group,week,
                 development_status,production_status,sample_status,mc_ratio,
                 pic_pattern,pic_mdmkt,pic_ie,pic_prod,pic_qa,extra_json)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON DUPLICATE KEY UPDATE
                buyer_id=VALUES(buyer_id), brand=VALUES(brand),
                description=VALUES(description), product_group=VALUES(product_group),
                week=VALUES(week), development_status=VALUES(development_status),
                production_status=VALUES(production_status), sample_status=VALUES(sample_status),
                mc_ratio=VALUES(mc_ratio), pic_pattern=VALUES(pic_pattern),
                pic_mdmkt=VALUES(pic_mdmkt), pic_ie=VALUES(pic_ie),
                pic_prod=VALUES(pic_prod), pic_qa=VALUES(pic_qa),
                extra_json=VALUES(extra_json)`;
    },

    async ping() {
      await pool.query("SELECT 1");
    },
  };
}

// ── Export ────────────────────────────────────────────────────────────────────

const db = type === "postgres" ? createPostgresDriver() : createMysqlDriver();

console.log(`[db] Using database driver: ${db.type}`);

module.exports = db;
