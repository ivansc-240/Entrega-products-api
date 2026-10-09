import { Router } from 'express';
import {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  cambiarPrecio,
} from '../controllers/products.controller.js';

const enrutador = Router();

enrutador.get('/getAll', obtenerTodos);
enrutador.get('/getById/:id', obtenerPorId);
enrutador.post('/create', crear);
enrutador.put('/update/:id', actualizar);
enrutador.delete('/delete/:id', eliminar);
enrutador.patch('/change-price/:id', cambiarPrecio);

export default enrutador;