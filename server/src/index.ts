import dotenv from 'dotenv';
dotenv.config();

import logger from './logger';
import { startScheduler } from './scheduler';

logger.info('Tee Time Sniper starting up');
startScheduler();
