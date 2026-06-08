import { toNodeHandler } from 'better-auth/node';
import { auth } from '../../auth/auth.js';

export default toNodeHandler(auth);
