const { pool } = require('..');
const fs = require('fs').promises;

async function backupDatabase() {
  try {
    const connection = await pool.getConnection();
    const database = process.env.DB_NAME;
    const backupFilePath = `./backups/${database}_backup_${Date.now()}.sql`;

    console.log(`開始備份資料庫: ${database}`);

    const [tableInfos] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ?`,
      [database],
    );

    if (!tableInfos || tableInfos.length === 0) {
      console.log('資料庫中沒有表格。');
      return;
    }

    const tables = tableInfos.map((info) => info.TABLE_NAME);
    const createTableStatements = {};
    const tableDependencies = {};

    // Fetch CREATE TABLE statements and identify dependencies
    for (const tableName of tables) {
      const [createResult] = await connection.execute(
        `SHOW CREATE TABLE \`${tableName}\``,
      );
      if (createResult && createResult.length > 0) {
        createTableStatements[tableName] = createResult[0][`Create Table`];
        const dependencies = [];
        const fkMatches = createTableStatements[tableName].matchAll(
          /FOREIGN KEY \([^)]+\) REFERENCES `([^`]+)`/g,
        );
        for (const match of fkMatches) {
          dependencies.push(match[1]);
        }
        tableDependencies[tableName] = dependencies;
      }
    }
    // console.log("tableDependencies:", tableDependencies);
    // console.log("createTableStatements:", Object.keys(createTableStatements));

    const creationOrder = [];
    const remainingTables = new Set(tables);

    while (remainingTables.size > 0) {
      let addedInThisPass = false;
      for (const tableName of Array.from(remainingTables)) {
        const dependencies = tableDependencies[tableName] || [];
        const unmetDependencies = dependencies.filter((dep) =>
          remainingTables.has(dep),
        );

        if (unmetDependencies.length === 0) {
          creationOrder.push(tableName);
          remainingTables.delete(tableName);
          addedInThisPass = true;
          break; // Process one table in each pass
        }
      }
      if (!addedInThisPass && remainingTables.size > 0) {
        // Handle potential circular dependencies (add remaining, might cause errors on restore)
        // console.warn("Warning: Potential circular dependencies or unresolved dependencies. Adding remaining tables.");
        remainingTables.forEach((table) => creationOrder.push(table));
        remainingTables.clear();
      }
    }
    // console.log("creationOrder:", creationOrder);

    let sqlContent = `-- Database: ${database};\n`;
    sqlContent += `-- Backup generated on: ${new Date().toISOString()};\n\n`;

    // Generate DROP TABLE statements
    const generateDropTableStatements = true;
    if (generateDropTableStatements) {
      const dropOrder = [
        'accounts',
        'badges',
        'channels',
        'direct_messages',
        'friends',
        'friend_applications',
        'friend_groups',
        'members',
        'member_applications',
        'messages',
        'servers',
        'users',
        'user_badges',
        'user_servers',
      ];
      for (const tableName of dropOrder) {
        if (tables.includes(tableName)) {
          sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        }
      }
      sqlContent += `-- End of DROP TABLE statements;\n\n`;
    }

    // **修改這裡：在產生 CREATE TABLE 語句前後加入禁用和啟用外鍵檢查**
    for (const tableName of creationOrder) {
      sqlContent += `-- Table structure for ${tableName};\n`;
      sqlContent += createTableStatements[tableName] + ';\n\n';
    }

    // Generate INSERT statements
    for (const tableName of tables) {
      console.log(`正在備份表格資料: ${tableName}`);
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      if (rows && rows.length > 0) {
        sqlContent += `-- Dumping data for table ${tableName};\n`;
        for (const row of rows) {
          const columns = Object.keys(row)
            .map((col) => `\`${col}\``)
            .join(', ');
          const values = Object.values(row)
            .map((value) =>
              value === null ? 'NULL' : connection.escape(value),
            )
            .join(', ');
          sqlContent += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        sqlContent += '\n';
      }
    }

    sqlContent += `-- End of data;\n`;

    await fs.mkdir('./backups', { recursive: true });
    await fs.writeFile(backupFilePath, sqlContent, 'utf8');
    console.log(`資料庫備份完成，檔案儲存於: ${backupFilePath}`);
    console.log(`資料庫還原: node .\\restore-db.js ${backupFilePath}`);
  } catch (error) {
    console.error('備份資料庫時發生錯誤:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

backupDatabase();
