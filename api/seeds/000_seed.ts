import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

export async function seed(knex: Knex): Promise<void> {
    await knex('family_memberships').del();
    await knex('reservations').del();
    await knex('wishlist_items').del();
    await knex('wishlists').del();
    await knex('users').del();
    await knex('families').del();

    const [noelFamily, summerFamily] = await knex('families')
        .insert([
            { id: randomUUID(), name: 'Fam Noël', invite_code: 'NOEL-2025' },
            { id: randomUUID(), name: 'Fam Summer', invite_code: 'SUN-2025' }
        ])
        .returning('*');

    const [alice, bob, charlie] = await knex('users')
        .insert([
            { id: randomUUID(), email: 'alice@example.com', password_hash: 'dev', name: 'Alice' },
            { id: randomUUID(), email: 'bob@example.com', password_hash: 'dev', name: 'Bob' },
            { id: randomUUID(), email: 'charlie@example.com', password_hash: 'dev', name: 'Charlie' }
        ])
        .returning('*');

    await knex('family_memberships').insert([
        { user_id: alice.id, family_id: noelFamily.id, role: 'admin' },
        { user_id: bob.id, family_id: noelFamily.id, role: 'member' },
        { user_id: bob.id, family_id: summerFamily.id, role: 'admin' },
        { user_id: charlie.id, family_id: summerFamily.id, role: 'member' }
    ]);

    const [aliceNoelList] = await knex('wishlists')
        .insert({ user_id: alice.id, family_id: noelFamily.id })
        .returning('*');

    const [bobNoelList, bobSummerList] = await knex('wishlists')
        .insert([
            { user_id: bob.id, family_id: noelFamily.id },
            { user_id: bob.id, family_id: summerFamily.id }
        ])
        .returning('*');

    const [charlieSummerList] = await knex('wishlists')
        .insert({ user_id: charlie.id, family_id: summerFamily.id })
        .returning('*');

    const [legoSet, cleanArchitecture] = await knex('wishlist_items')
        .insert([
            {
                wishlist_id: aliceNoelList.id,
                title: 'LEGO set',
                price_cents: 7999,
                currency: 'EUR',
                priority: 2,
                notes: 'Accept any Star Wars edition'
            },
            {
                wishlist_id: aliceNoelList.id,
                title: 'Book: Clean Architecture',
                priority: 3,
                url: 'https://example.com/clean-architecture'
            }
        ])
        .returning('*');

    const [noiseCancellingHeadphones] = await knex('wishlist_items')
        .insert({
            wishlist_id: aliceNoelList.id,
            title: 'Noise-cancelling headphones',
            price_cents: 19999,
            currency: 'EUR',
            priority: 1,
            notes: 'Over-ear, comfortable for long flights'
        })
        .returning('*');

    const [campingStove, swimFins] = await knex('wishlist_items')
        .insert([
            {
                wishlist_id: bobSummerList.id,
                title: 'Camping stove',
                price_cents: 5499,
                currency: 'EUR',
                priority: 2,
                notes: 'Compact, with piezo ignition'
            },
            {
                wishlist_id: bobSummerList.id,
                title: 'Swim fins',
                priority: 4,
                url: 'https://example.com/swim-fins'
            }
        ])
        .returning('*');

    const [robotVacuum] = await knex('wishlist_items')
        .insert({
            wishlist_id: bobNoelList.id,
            title: 'Robot vacuum',
            price_cents: 24999,
            currency: 'EUR',
            priority: 1,
            notes: 'Handles pet hair, works on rugs'
        })
        .returning('*');

    await knex('wishlist_items').insert({
        wishlist_id: charlieSummerList.id,
        title: 'Travel hammock',
        price_cents: 3499,
        currency: 'EUR',
        priority: 3,
        notes: 'Lightweight with carabiners included'
    });

    await knex('reservations').insert([
        {
            item_id: legoSet.id,
            reserver_user_id: bob.id,
            status: 'reserved'
        },
        {
            item_id: campingStove.id,
            reserver_user_id: alice.id,
            status: 'purchased'
        },
        {
            item_id: robotVacuum.id,
            reserver_user_id: alice.id,
            status: 'reserved'
        },
        {
            item_id: noiseCancellingHeadphones.id,
            reserver_user_id: charlie.id,
            status: 'reserved'
        },
        {
            item_id: swimFins.id,
            reserver_user_id: charlie.id,
            status: 'purchased'
        }
    ]);
}
