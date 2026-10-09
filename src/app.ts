import dotenv from 'dotenv';
dotenv.config();

import { Servidor } from './server';

new Servidor().iniciar();