import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

export async function seed(knex: Knex): Promise<void> {
    await knex('family_memberships').del();
    await knex('reservations').del();
    await knex('wishlist_items').del();
    await knex('wishlists').del();
    await knex('users').del();
    await knex('families').del();

    const [family] = await knex('families')
        .insert({ id: randomUUID(), name: 'Fam Noël', invite_code: 'NOEL-2025' })
        .returning('*');

    const [alice] = await knex('users')
        .insert({ id: randomUUID(), email: 'alice@example.com', password_hash: 'dev', name: 'Alice' })
        .returning('*');

    const [bob] = await knex('users')
        .insert({ id: randomUUID(), email: 'bob@example.com', password_hash: 'dev', name: 'Bob' })
        .returning('*');

    await knex('family_memberships').insert([
        { user_id: alice.id, family_id: family.id, role: 'admin' },
        { user_id: bob.id, family_id: family.id, role: 'member' }
    ]);

    const [aliceList] = await knex('wishlists')
        .insert({ user_id: alice.id, family_id: family.id })
        .returning('*');

    await knex('wishlist_items').insert([
        { wishlist_id: aliceList.id, title: 'LEGO set', price_cents: 7999, currency: 'EUR', priority: 2 },
        { wishlist_id: aliceList.id, title: 'Book: Clean Architecture', priority: 3 }
    ]);
}
