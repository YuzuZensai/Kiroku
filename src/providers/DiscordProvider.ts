import { ActivityType, Client, Events, GatewayIntentBits } from 'discord.js';

import ConfigProvider from './ConfigProvider';

class DiscordProvider {
    private client: Client;
    private guildId: string = '';
    private ready: boolean = false;

    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences]
        });

        this.client.once(Events.ClientReady, (client) => {
            console.log('[DiscordProvider]', `Ready! Logged in as ${client.user.tag}`);
            this.ready = true;

            const setStatus = () => {
                this.client?.user?.setPresence({
                    activities: [
                        {
                            name: 'custom',
                            type: ActivityType.Custom,
                            state: '🥺 Staring at a cutie'
                        }
                    ],
                    status: 'online',
                    afk: false
                });
            };
            setStatus();

            setInterval(() => {
                setStatus();
            }, 1000 * 60 * 5);
        });

        const token = ConfigProvider.getConfig().global.discord_bot_token;
        const guild_id = ConfigProvider.getConfig().global.discord_guild_id;

        if (!token || !guild_id) {
            console.error('[DiscordProvider]', 'Missing token or guild_id in config.json');
            return;
        }

        this.guildId = guild_id;

        this.client.login(token);
    }

    public async getUser(id: string) {
        const user = this.client.users.cache.get(id) || (await this.client.users.fetch(id));
        return user;
    }

    public async getPresence(id: string) {
        const guild = this.client.guilds.cache.get(this.guildId) || (await this.client.guilds.fetch(this.guildId));
        const member = guild.members.cache.get(id) || (await guild.members.fetch(id));
        const presence = member.presence;
        return presence;
    }

    public get isReady(): boolean {
        return this.ready;
    }
}

export default new DiscordProvider();
