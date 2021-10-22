import sqlite from './sqlite';
import mysql from './mysql';
import postgres from './postgres';

export default {
    'sqlite3':sqlite,
    'mysql': mysql,
    'mysql2': mysql,
    'pg': postgres,
}