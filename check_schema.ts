import Database from 'better-sqlite3';
const db = new Database('db_futebol');
const info = db.prepare("PRAGMA table_info(championships)").all();
console.log(JSON.stringify(info, null, 2));
db.close();
