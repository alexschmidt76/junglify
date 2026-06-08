import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../src/auth/auth.js';

export default toNodeHandler(auth);
