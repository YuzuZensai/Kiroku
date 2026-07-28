import dotenv from 'dotenv';

dotenv.config();

import ConfigProvider from './providers/ConfigProvider';
import { createServer } from './server';
import PresenceAggregator from './services/PresenceAggregator';

function main() {
    if (!ConfigProvider.isReady()) return;
    const port = process.env.PORT || 3000;

    PresenceAggregator.start();

    createServer().listen(port);

    console.log(`Listening on port ${port}`);
}
main();
