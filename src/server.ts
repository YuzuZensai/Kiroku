import { Elysia, t } from 'elysia';

import ConfigProviderSingleton from './providers/ConfigProvider';
import PresenceAggregatorSingleton from './services/PresenceAggregator';
import type { ConfigSource, PresenceStore } from './types';

export function createServer(
    config: ConfigSource = ConfigProviderSingleton,
    presenceStore: PresenceStore = PresenceAggregatorSingleton
) {
    return new Elysia().get(
        '/',
        ({ query, status }) => {
            const requestedUser = query.user?.toLowerCase();

            if (!requestedUser) {
                if (!config.getConfig().global.lookup_all)
                    return status('Forbidden', { success: false, message: 'Lookup all is disabled' });

                return { success: true, data: presenceStore.getAll() };
            }

            const userData = presenceStore.get(requestedUser);
            if (!userData) return status('Not Found', { success: false, message: 'Unable to find user' });

            return { success: true, data: userData };
        },
        {
            query: t.Object({
                user: t.Optional(t.String())
            })
        }
    );
}
