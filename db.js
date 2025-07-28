const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'data', 'words.db');

// 数据库连接实例
let db = null;

/**
 * 初始化数据库连接和表结构
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
      
      // 初始化表结构，但不等待其完成
      initTables().catch(err => {
        console.error('初始化表结构失败:', err);
      });
      
      // 直接返回数据库连接
      resolve(db);
    });
  });
}

/**
 * 初始化数据库表结构
 */
async function initTables() {
  // 创建settings表（如果不存在）
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  // 创建categories表（如果不存在）
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // 创建words表（如果不存在）
  await run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      en TEXT NOT NULL,
      phonetic TEXT,
      pos TEXT,
      cn TEXT,
      category_id TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // 创建theme_templates表（如果不存在）
  await run(`
    CREATE TABLE IF NOT EXISTS theme_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      prompt_text TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    )
  `);
  
  console.log('检查settings表是否有默认API密钥');
  
  // 检查是否已存在qwen_api_key设置
  const qwenSetting = await get('SELECT value FROM settings WHERE key = ?', ['qwen_api_key']);
  if (!qwenSetting) {
    // 插入默认的阿里云千问API密钥
    await run(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      ['qwen_api_key', 'sk-bb800a93f0fa4ebbb306a4c87f2de724']
    );
    console.log('已添加默认阿里云千问API密钥');
  }
  
  console.log('数据库表结构初始化完成');
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