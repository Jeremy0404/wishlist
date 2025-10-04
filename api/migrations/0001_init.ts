import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Extensions for UUID & cryptographic functions
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await knex.schema
        .createTable('users', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.string('email').notNullable().unique();
            t.string('password_hash').notNullable();
            t.string('name').notNullable();
            t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        })
        .createTable('families', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.string('name').notNullable();
            t.string('invite_code').notNullable().unique();
            t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        })
        .createTable('family_memberships', (t) => {
            t.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
            t.uuid('family_id').notNullable().references('families.id').onDelete('CASCADE');
            t.string('role').notNullable().defaultTo('member'); // 'member' | 'admin'
            t.primary(['user_id', 'family_id']);
            t.index(['family_id']);
            t.index(['user_id']);
        })
        .createTable('wishlists', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
            t.uuid('family_id').notNullable().references('families.id').onDelete('CASCADE');
            t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
            t.unique(['user_id', 'family_id']);
            t.index(['family_id']);
        })
        .createTable('wishlist_items', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('wishlist_id').notNullable().references('wishlists.id').onDelete('CASCADE');
            t.string('title').notNullable();
            t.string('url');
            t.integer('price_cents');
            t.string('currency', 3);
            t.text('notes');
            t.specificType('priority', 'smallint').notNullable().defaultTo(3); // 1=high,3=normal,5=low
            t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
            t.index(['wishlist_id']);
        })
        .createTable('reservations', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('item_id').notNullable().references('wishlist_items.id').onDelete('CASCADE');
            t.uuid('reserver_user_id').notNullable().references('users.id').onDelete('CASCADE');
            t.enu('status', ['reserved', 'purchased'], { useNative: true, enumName: 'reservation_status' })
                .notNullable()
                .defaultTo('reserved');
            t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
            t.unique(['item_id']); // one reservation per item (MVP)
            t.index(['reserver_user_id']);
        });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema
        .dropTableIfExists('reservations')
        .dropTableIfExists('wishlist_items')
        .dropTableIfExists('wishlists')
        .dropTableIfExists('family_memberships')
        .dropTableIfExists('families')
        .dropTableIfExists('users');
    await knex.raw('DROP TYPE IF EXISTS reservation_status;');
}
