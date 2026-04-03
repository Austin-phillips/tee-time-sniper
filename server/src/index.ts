import dotenv from 'dotenv';
dotenv.config();

import { startScheduler } from './scheduler';

console.log('🏌️ Tee Time Sniper starting up...');
startScheduler();
