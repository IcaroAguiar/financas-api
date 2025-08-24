// backup_production.js
const { Pool } = require('pg');
const fs = require('fs');

async function createBackup() {
  const connectionString = 'postgresql://ascend_db_user:r10zywUitcJ1FAipTm3yAzqN0EZb7Ddq@dpg-d280n2uuk2gs73eo32m0-a.oregon-postgres.render.com:5432/ascend_db';
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Conectando ao banco de produção...');
    
    // Listar todas as tabelas
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log(`📊 Encontradas ${tablesResult.rows.length} tabelas`);
    
    let backupSQL = `-- Backup do banco de produção - ${new Date().toISOString()}\n`;
    backupSQL += `-- Host: dpg-d280n2uuk2gs73eo32m0-a.oregon-postgres.render.com\n`;
    backupSQL += `-- Database: ascend_db\n\n`;
    
    // Para cada tabela, fazer backup dos dados
    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      console.log(`📋 Fazendo backup da tabela: ${tableName}`);
      
      // Obter estrutura da tabela
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [tableName]);
      
      // Obter dados da tabela
      const dataResult = await pool.query(`SELECT * FROM "${tableName}"`);
      
      backupSQL += `-- Tabela: ${tableName} (${dataResult.rows.length} registros)\n`;
      backupSQL += `-- Colunas: ${schemaResult.rows.map(col => `${col.column_name} (${col.data_type})`).join(', ')}\n`;
      
      if (dataResult.rows.length > 0) {
        const columns = schemaResult.rows.map(col => `"${col.column_name}"`).join(', ');
        backupSQL += `INSERT INTO "${tableName}" (${columns}) VALUES\n`;
        
        const values = dataResult.rows.map(row => {
          const rowValues = schemaResult.rows.map(col => {
            const value = row[col.column_name];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return value;
          });
          return `(${rowValues.join(', ')})`;
        }).join(',\n');
        
        backupSQL += values + ';\n\n';
      } else {
        backupSQL += `-- Tabela vazia\n\n`;
      }
    }
    
    // Salvar backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_producao_${timestamp}.sql`;
    
    fs.writeFileSync(filename, backupSQL);
    console.log(`✅ Backup criado: ${filename}`);
    console.log(`📁 Tamanho: ${Math.round(backupSQL.length / 1024)} KB`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    await pool.end();
    process.exit(1);
  }
}

createBackup();