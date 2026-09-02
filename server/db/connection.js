import Database from 'better-sqlite3';

export function openDatabase(
  databasePath,
  { readonly = false, fileMustExist = false } = {},
) {
  const database = new Database(databasePath, {
    readonly,
    fileMustExist,
  });

  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');

  return database;
}
