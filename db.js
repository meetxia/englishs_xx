const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'data', 'words.db');

// 数据库连接实例
let db = null;

/**
 * 初始化数据库连接
 */
function initDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      console.log('数据库已连接');
      return resolve(db);
    }
    
    console.log(`连接数据库: ${dbPath}`);
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
        reject(err);
        return;
      }
      
      console.log('数据库连接成功');
      resolve(db);
    });
  });
}

/**
 * 运行SQL查询（不返回结果）
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('数据库未连接'));
      return;
    }
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('SQL执行错误:', err.message);
        reject(err);
        return;
      }
      
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

/**
 * 运行SQL查询（返回单行结果）
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('数据库未连接'));
      return;
    }
    
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('SQL执行错误:', err.message);
        reject(err);
        return;
      }
      
      resolve(row);
    });
  });
}

/**
 * 运行SQL查询（返回多行结果）
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('数据库未连接'));
      return;
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQL执行错误:', err.message);
        reject(err);
        return;
      }
      
      resolve(rows);
    });
  });
}

/**
 * 关闭数据库连接
 */
function closeDb() {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.log('数据库未连接');
      return resolve();
    }
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库错误:', err.message);
        reject(err);
        return;
      }
      
      console.log('数据库已关闭');
      db = null;
      resolve();
    });
  });
}

module.exports = {
  initDb,
  run,
  get,
  all,
  closeDb
}; 