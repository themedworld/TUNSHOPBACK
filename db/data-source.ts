import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as pg from 'pg'; // Important pour Neon

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Utilisez l'URL complète (avec pooler)
  ssl: {
    rejectUnauthorized: false // Obligatoire pour Neon
  },
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/db/migrations/*.js'], // Chemin corrigé
  synchronize: process.env.NODE_ENV !== 'production', // Désactivé en prod
  logging: process.env.NODE_ENV === 'development',
  extra: {
    connectionLimit: 5, // Important pour le pooler Neon
    idleTimeoutMillis: 10000
  },
  driver: pg // Spécifique à Neon
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;