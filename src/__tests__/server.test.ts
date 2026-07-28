import { describe, expect, mock, test } from 'bun:test';

import { createServer } from '../server';
import type { Config, ConfigSource, PresenceStore } from '../types';

function makeConfig(config: Config): ConfigSource {
    return { getConfig: () => config };
}

describe('server', () => {
    test('returns all data when no user is requested and lookup_all is enabled', async () => {
        const config = makeConfig({ global: { lookup_all: true }, users: {} });
        const presenceStore: PresenceStore = { getAll: () => ({ alice: {} }), get: mock() };

        const response = await createServer(config, presenceStore).handle(new Request('http://localhost/'));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true, data: { alice: {} } });
    });

    test('forbids lookup-all when disabled in config', async () => {
        const config = makeConfig({ global: { lookup_all: false }, users: {} });
        const presenceStore: PresenceStore = { getAll: mock(), get: mock() };

        const response = await createServer(config, presenceStore).handle(new Request('http://localhost/'));
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body).toEqual({ success: false, message: 'Lookup all is disabled' });
    });

    test('returns data for a specific user, case-insensitively', async () => {
        const config = makeConfig({ global: { lookup_all: true }, users: {} });
        const get = mock().mockReturnValue({ discord: { user: { id: '1' } } });
        const presenceStore: PresenceStore = { getAll: mock(), get };

        const response = await createServer(config, presenceStore).handle(new Request('http://localhost/?user=Alice'));
        const body = await response.json();

        expect(get).toHaveBeenCalledWith('alice');
        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true, data: { discord: { user: { id: '1' } } } });
    });

    test('returns 404 when the requested user is not found', async () => {
        const config = makeConfig({ global: { lookup_all: true }, users: {} });
        const presenceStore: PresenceStore = { getAll: mock(), get: mock().mockReturnValue(undefined) };

        const response = await createServer(config, presenceStore).handle(
            new Request('http://localhost/?user=unknown')
        );
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body).toEqual({ success: false, message: 'Unable to find user' });
    });
});
