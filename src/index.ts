import dotenv from 'dotenv';
dotenv.config();

import ConfigProvider from './providers/ConfigProvider';
import DiscordProvider from './providers/DiscordProvider';
import SteamProvider from './providers/SteamProvider';

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

function sendJsonResponse(data: any) {
    let res = new Response(JSON.stringify(data));
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    return res;
}

async function main() {
    if (!ConfigProvider.isReady()) return;

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

    const server = Bun.serve({
        port: 3000,
        async fetch(request: Request) {
            let url = new URL(request.url);
            let user = url.searchParams.get('user');

            if (!user || user === null) {
                if (!ConfigProvider.getConfig().global.lookup_all)
                    return sendJsonResponse({ success: false, message: 'Lookup all is disabled' });

                return sendJsonResponse({
                    success: true,
                    data: latestReturnData
                });
            }

            user = user.toLowerCase();

            if (!latestReturnData[user]) return sendJsonResponse({ success: false, message: 'Unable to find user' });
            const userData = latestReturnData[user];

            return sendJsonResponse({
                success: true,
                data: userData
            });
        }
    });

    console.log(`Listening on localhost:${server.port}`);
}
main();
