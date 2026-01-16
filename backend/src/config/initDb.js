/**
 * Script de inicialización de base de datos
 * Ejecutar con: npm run db:init
 */

import 'dotenv/config';
import { initializeDatabase, getDb, closeDb } from './database.js';

console.log('===========================================');
console.log('  Answer42 - Inicialización de Base de Datos');
console.log('===========================================\n');

try {
  // Inicializar tablas
  console.log('Creando tablas...');
  initializeDatabase();

  // Verificar estructura
  const db = getDb();

  // Listar tablas creadas
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log('\nTablas creadas:');
  tables.forEach(t => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
    console.log(`  - ${t.name} (${count.count} registros)`);
  });

  // Mostrar estructura de la tabla users
  console.log('\nEstructura de tabla "users":');
  const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
  userColumns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });

  // Mostrar estructura de la tabla audit_log
  console.log('\nEstructura de tabla "audit_log":');
  const auditColumns = db.prepare(`PRAGMA table_info(audit_log)`).all();
  auditColumns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });

  // Verificar índices
  console.log('\nÍndices creados:');
  const indexes = db.prepare(`
    SELECT name, tbl_name FROM sqlite_master
    WHERE type='index' AND name NOT LIKE 'sqlite_%'
  `).all();
  indexes.forEach(idx => {
    console.log(`  - ${idx.name} (en ${idx.tbl_name})`);
  });

  console.log('\n✅ Base de datos inicializada correctamente');
  console.log(`   Ubicación: ${process.env.DB_PATH || './data/answer42.db'}`);

  closeDb();
  process.exit(0);

} catch (error) {
  console.error('\n❌ Error al inicializar base de datos:');
  console.error(error.message);
  process.exit(1);
}
