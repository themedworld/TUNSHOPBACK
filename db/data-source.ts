import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Utilisez l'URL complète de Neon
  ssl: { rejectUnauthorized: false },
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/db/migrations/*.js'],
  synchronize: false, // Désactivé en production
  logging: true
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;