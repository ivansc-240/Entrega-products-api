import { Router } from 'express';
import rutasProductos from './products.routes.js';

const enrutador = Router();
enrutador.use('/products', rutasProductos);

export default enrutador;