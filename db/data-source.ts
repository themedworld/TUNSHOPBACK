import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Utilisez directement l'URL de Neon
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/db/migrations/*{.ts,.js}'],
  synchronize: false, // IMPORTANT: désactivé en production
  logging: true,
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false // Nécessaire pour Neon
    },
    connectionLimit: 5 // Configuration du pool de connexions
  }
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;