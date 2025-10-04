import 'dotenv/config';
import type { Knex } from 'knex';

const config: Knex.Config = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: './migrations', extension: 'ts' },
    seeds: { directory: './seeds', extension: 'ts' },
    pool: { min: 2, max: 10 }
};

export default config;
