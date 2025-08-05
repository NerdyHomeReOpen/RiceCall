#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 通用 JSON 翻譯檔案排序工具
 * 用法: node sort-i18n-json.cjs <檔案路徑>
 * 例如: node sort-i18n-json.cjs ./src/i18n/locales/zh-TW/translation.json
 */

function sortJsonFile(filePath) {
  try {
    // 檢查檔案是否存在
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 錯誤: 檔案 ${filePath} 不存在`);
      return false;
    }

    // 檢查是否為 JSON 檔案
    if (!filePath.endsWith('.json')) {
      console.error(`❌ 錯誤: ${filePath} 不是 JSON 檔案`);
      return false;
    }

    console.log(`📝 開始整理 ${path.basename(filePath)}...`);
    
    // 讀取原始檔案
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(originalContent);

    console.log(`📊 檔案包含 ${Object.keys(jsonData).length} 個翻譯key`);

    // 按 key 字母順序排序
    const sortedKeys = Object.keys(jsonData).sort();
    const sortedData = {};

    sortedKeys.forEach(key => {
      sortedData[key] = jsonData[key];
    });

    // 格式化輸出 JSON (保持原有的縮排格式)
    const sortedContent = JSON.stringify(sortedData, null, 2);

    // 寫入檔案
    fs.writeFileSync(filePath, sortedContent, 'utf8');

    console.log(`✅ ${path.basename(filePath)} 已按 a-z 順序重新排列完成！`);
    
    // 顯示前後對比
    if (sortedKeys.length > 0) {
      console.log('📋 前 5 個 key:');
      sortedKeys.slice(0, 5).forEach((key, index) => {
        const value = jsonData[key];
        const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        console.log(`   ${index + 1}. ${key}: "${displayValue}"`);
      });

      if (sortedKeys.length > 5) {
        console.log(`\n📋 最後 5 個 key:`);
        sortedKeys.slice(-5).forEach((key, index) => {
          const value = jsonData[key];
          const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
          console.log(`   ${sortedKeys.length - 5 + index + 1}. ${key}: "${displayValue}"`);
        });
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ 處理檔案時發生錯誤: ${error.message}`);
    return false;
  }
}

// 主程式邏輯
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 JSON 翻譯檔案排序工具');
    console.log('\n📖 用法:');
    console.log('  node sort-i18n-json.cjs <檔案路徑>');
    console.log('\n📝 範例:');
    console.log('  node sort-i18n-json.cjs ./src/i18n/locales/zh-TW/translation.json');
    console.log('  node sort-i18n-json.cjs ./src/i18n/locales/zh-TW/message.json');
    console.log('  node sort-i18n-json.cjs ./src/i18n/locales/zh-TW/rpc.json');
    console.log('\n✨ 功能:');
    console.log('  - 按照 key 的字母順序 (a-z) 重新排列 JSON 檔案');
    console.log('  - 保持原有的 JSON 格式和縮排');
    console.log('  - 直接修改原檔案');
    console.log('  - 顯示排序前後的對比資訊');
    return;
  }

  const filePath = args[0];
  
  // 如果是相對路徑，轉換為絕對路徑
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  
  console.log(`🎯 目標檔案: ${absolutePath}`);
  
  const success = sortJsonFile(absolutePath);
  
  if (success) {
    console.log('\n🎉 排序完成！');
  } else {
    console.log('\n💥 排序失敗！');
    process.exit(1);
  }
}

// 如果直接執行此檔案，則運行主程式
if (require.main === module) {
  main();
}

// 導出函數供其他模組使用
module.exports = { sortJsonFile };