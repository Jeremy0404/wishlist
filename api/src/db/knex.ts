import knex from 'knex';
import config from './knexConfig';

export const db = knex(config);
