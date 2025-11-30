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

    const [alice, bob, charlie, diana] = await knex('users')
        .insert([
            { id: randomUUID(), email: 'alice@example.com', password_hash: 'dev', name: 'Alice' },
            { id: randomUUID(), email: 'bob@example.com', password_hash: 'dev', name: 'Bob' },
            { id: randomUUID(), email: 'charlie@example.com', password_hash: 'dev', name: 'Charlie' },
            { id: randomUUID(), email: 'diana@example.com', password_hash: 'dev', name: 'Diana' }
        ])
        .returning('*');

    await knex('family_memberships').insert([
        { user_id: alice.id, family_id: noelFamily.id, role: 'admin' },
        { user_id: bob.id, family_id: noelFamily.id, role: 'member' },
        { user_id: charlie.id, family_id: summerFamily.id, role: 'admin' },
        { user_id: diana.id, family_id: summerFamily.id, role: 'member' }
    ]);

    const [aliceNoelList] = await knex('wishlists')
        .insert({ user_id: alice.id, family_id: noelFamily.id })
        .returning('*');

    const [bobNoelList] = await knex('wishlists')
        .insert({ user_id: bob.id, family_id: noelFamily.id })
        .returning('*');

    const [charlieSummerList, dianaSummerList] = await knex('wishlists')
        .insert([
            { user_id: charlie.id, family_id: summerFamily.id },
            { user_id: diana.id, family_id: summerFamily.id }
        ])
        .returning('*');

    const [legoSet, cleanArchitecture] = await knex('wishlist_items')
        .insert([
            {
                wishlist_id: aliceNoelList.id,
                title: 'LEGO set',
                price_eur: 79.99,
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
            price_eur: 199.99,
            priority: 1,
            notes: 'Over-ear, comfortable for long flights'
        })
        .returning('*');

    const [campingStove, swimFins] = await knex('wishlist_items')
        .insert([
            {
                wishlist_id: charlieSummerList.id,
                title: 'Camping stove',
                price_eur: 54.99,
                priority: 2,
                notes: 'Compact, with piezo ignition'
            },
            {
                wishlist_id: charlieSummerList.id,
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
            price_eur: 249.99,
            priority: 1,
            notes: 'Handles pet hair, works on rugs'
        })
        .returning('*');

    const [travelHammock] = await knex('wishlist_items')
        .insert({
            wishlist_id: dianaSummerList.id,
            title: 'Travel hammock',
            price_eur: 34.99,
            priority: 3,
            notes: 'Lightweight with carabiners included'
        })
        .returning('*');

    await knex('reservations').insert([
        {
            item_id: legoSet.id,
            reserver_user_id: bob.id,
            status: 'reserved'
        },
        {
            item_id: campingStove.id,
            reserver_user_id: diana.id,
            status: 'purchased'
        },
        {
            item_id: robotVacuum.id,
            reserver_user_id: alice.id,
            status: 'reserved'
        },
        {
            item_id: noiseCancellingHeadphones.id,
            reserver_user_id: bob.id,
            status: 'reserved'
        },
        {
            item_id: swimFins.id,
            reserver_user_id: diana.id,
            status: 'purchased'
        },
        {
            item_id: travelHammock.id,
            reserver_user_id: charlie.id,
            status: 'reserved'
        }
    ]);
}
