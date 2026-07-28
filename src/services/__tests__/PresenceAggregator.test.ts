import { describe, expect, mock, test } from 'bun:test';
import type { Presence, User } from 'discord.js';
import type { UserSummary } from 'steamapi';

import type { Config, ConfigSource, DiscordSource, SteamSource } from '../../types';
import { PresenceAggregator } from '../PresenceAggregator';

const fakeUser = { id: 'd1', tag: 'alice#0' } as unknown as User;
const fakePresence = { status: 'online' } as unknown as Presence;
const fakeSteamUser = { nickname: 'alice' } as unknown as UserSummary;

function makeConfig(config: Config): ConfigSource {
    return { getConfig: () => config };
}

function makeDiscord(overrides: Partial<DiscordSource> = {}): DiscordSource {
    return {
        isReady: true,
        getUser: mock(),
        getPresence: mock(),
        ...overrides
    };
}

function makeSteam(overrides: Partial<SteamSource> = {}): SteamSource {
    return {
        isReady: true,
        getProfile: mock(),
        ...overrides
    };
}

describe('PresenceAggregator', () => {
    test('aggregates discord and steam data per user, lowercasing keys', async () => {
        const discord = makeDiscord({
            getUser: mock().mockResolvedValue(fakeUser),
            getPresence: mock().mockResolvedValue(fakePresence)
        });
        const steam = makeSteam({
            getProfile: mock().mockResolvedValue(fakeSteamUser)
        });
        const config = makeConfig({
            global: { lookup_all: true },
            users: { Alice: { discord: 'd1', steam: 's1' } }
        });
        const aggregator = new PresenceAggregator(config, discord, steam);

        await aggregator.refresh();

        const entry = aggregator.get('alice');
        expect(entry?.discord?.user).toEqual(fakeUser);
        expect(entry?.discord?.presence).toEqual(fakePresence);
        expect(entry?.steam?.user).toEqual(fakeSteamUser);
        expect(aggregator.get('Alice')).toBeUndefined();
    });

    test('skips discord/steam sections when providers are not ready', async () => {
        const discord = makeDiscord({ isReady: false });
        const steam = makeSteam({ isReady: false });
        const config = makeConfig({
            global: { lookup_all: true },
            users: { bob: { discord: 'd2', steam: 's2' } }
        });
        const aggregator = new PresenceAggregator(config, discord, steam);

        await aggregator.refresh();

        expect(aggregator.get('bob')).toEqual({});
        expect(discord.getUser).not.toHaveBeenCalled();
        expect(steam.getProfile).not.toHaveBeenCalled();
    });

    test('reuses cached steam data within the TTL window instead of refetching', async () => {
        const getProfile = mock().mockResolvedValue({ nickname: 'carol' } as unknown as UserSummary);
        const steam = makeSteam({ getProfile });
        const config = makeConfig({
            global: { lookup_all: true },
            users: { carol: { steam: 's3' } }
        });
        const aggregator = new PresenceAggregator(config, makeDiscord(), steam);

        await aggregator.refresh();
        await aggregator.refresh();

        expect(getProfile).toHaveBeenCalledTimes(1);
    });
});
