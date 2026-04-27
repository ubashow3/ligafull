import Database from 'better-sqlite3';
const db = new Database('db_futebol');
const leagues = db.prepare('SELECT * FROM leagues').all();
console.log('Leagues:', JSON.stringify(leagues, null, 2));
const championships = db.prepare('SELECT * FROM championships').all();
console.log('Championships:', JSON.stringify(championships, null, 2));
