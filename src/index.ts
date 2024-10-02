import dotenv from 'dotenv';
dotenv.config();

import ConfigProvider from './providers/ConfigProvider';
import DiscordProvider from './providers/DiscordProvider';
import SteamProvider from './providers/SteamProvider';
import { Elysia, t } from 'elysia';

// 1 minute
const REFRESH_TIME = 60 * 1000;

interface ReturnData {
    [key: string]: {
        discord?: {
            user: any;
            presences: any;
            updatedAt: Date;
        };
        steam?: {
            user: any;
            updatedAt: Date;
        };
    };
}

let latestReturnData: ReturnData = {};

async function main() {
    if (!ConfigProvider.isReady()) return;
    const port = process.env.PORT || 3000;

    setInterval(async () => {
        let newData: ReturnData = {};

        for (let [key, value] of Object.entries(ConfigProvider.getConfig().users)) {
            key = key.toLowerCase();
            newData[key] = {};

            // Discord
            if (value.discord && DiscordProvider.isReady) {
                // Discord data is already cached by the library, no need to limit it
                let user = await DiscordProvider.getUser(value.discord);
                let presences = await DiscordProvider.getPresence(value.discord);
                newData[key].discord = {
                    user,
                    presences: presences,
                    updatedAt: new Date()
                };
            }

            // Steam
            if (value.steam && SteamProvider.isReady) {
                if (
                    latestReturnData[key] &&
                    latestReturnData[key].steam &&
                    latestReturnData[key].steam!.updatedAt.getTime() > Date.now() - REFRESH_TIME
                ) {
                    newData[key].steam = latestReturnData[key].steam;
                } else {
                    let user = await SteamProvider.getProfile(value.steam);
                    newData[key].steam = {
                        user,
                        updatedAt: new Date()
                    };
                }
            }
        }

        // Check for changes
        for (let [key, value] of Object.entries(newData)) {
            if (JSON.stringify(value) !== JSON.stringify(latestReturnData[key])) {
                latestReturnData[key] = value;
            }
        }
    }, 500);

    const server = new Elysia()
        .get('/', async ({ query, error }) => {
            query: t.Object({
                user: t.Optional(t.String())
            });

            let user = query.user;

            if (!user) {
                if (!ConfigProvider.getConfig().global.lookup_all)
                    return error('Forbidden', { success: false, message: 'Lookup all is disabled' });

                return {
                    success: true,
                    data: latestReturnData
                };
            }

            user = user.toLowerCase();

            if (!latestReturnData[user]) return error('Not Found', { success: false, message: 'Unable to find user' });
            const userData = latestReturnData[user];

            return {
                success: true,
                data: userData
            };
        })
        .listen(port);

    console.log(`Listening on port ${port}`);
}
main();
