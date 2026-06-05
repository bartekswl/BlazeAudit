// The encrypted fork is API-compatible with better-sqlite3 but ships no types.
// Alias it to better-sqlite3's type definitions.
declare module 'better-sqlite3-multiple-ciphers' {
  import BetterSqlite3 = require('better-sqlite3');
  export = BetterSqlite3;
}
