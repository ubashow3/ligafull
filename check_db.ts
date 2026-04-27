import Database from 'better-sqlite3';
const db = new Database('db_futebol');
try {
    const columns = db.prepare("PRAGMA table_info(championships)").all();
    console.log(JSON.stringify(columns, null, 2));
} catch (e) {
    console.error(e);
}
db.close();
