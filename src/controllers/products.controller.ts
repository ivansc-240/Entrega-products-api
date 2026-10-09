import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../conf/dbConnection';

const interpretarId = (valor: string | string[] | undefined): number | null => {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
};

const precioValido = (valor: unknown): valor is number => {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) return false;
  return Math.round(valor * 100) / 100 === valor; // máximo 2 decimales
};

const errorDelServidor = (res: Response, error: unknown) => {
  console.error(error); // el detalle solo se ve en consola, nunca en la respuesta
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
};

const validarCuerpo = (cuerpo: Record<string, unknown>): string | null => {
  const { name, price, stock, description, brand, img } = cuerpo;
  if (typeof name !== 'string' || !name.trim()) return 'name es obligatorio';
  if (!precioValido(price)) return 'price debe ser numérico, mayor que 0 y con máximo 2 decimales';
  if (!Number.isInteger(stock) || (stock as number) < 0) return 'stock debe ser un entero mayor o igual a 0';
  if (typeof description !== 'string' || !description.trim()) return 'description es obligatorio';
  if (brand !== undefined && brand !== null && typeof brand !== 'string') return 'brand debe ser texto';
  if (img !== undefined && img !== null && typeof img !== 'string') return 'img debe ser texto';
  return null;
};

export const obtenerTodos = async (req: Request, res: Response) => {
  const activo = req.query.active;
  if (activo !== undefined && String(activo).toUpperCase() !== 'TRUE') {
    return res.status(400).json({ mensaje: 'El parámetro active solo acepta el valor TRUE' });
  }
  try {
    const [filas] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE active = ?',
      [true]
    );
    return res.status(200).json(filas);
  } catch (error) {
    return errorDelServidor(res, error);
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  const id = interpretarId(req.params.id);
  if (id === null) return res.status(400).json({ mensaje: 'ID inválido' });
  try {
    const [filas] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? AND active = ?',
      [id, true]
    );
    if (filas.length === 0) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    return res.status(200).json(filas[0]);
  } catch (error) {
    return errorDelServidor(res, error);
  }
};

export const crear = async (req: Request, res: Response) => {
  const cuerpo = req.body ?? {};
  const mensajeError = validarCuerpo(cuerpo);
  if (mensajeError) return res.status(400).json({ mensaje: mensajeError });

  const { name, price, stock, description, brand = null, img = null } = cuerpo;
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      'INSERT INTO products (name, price, stock, description, brand, img) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, stock, description, brand, img]
    );
    return res.status(201).json({
      id: resultado.insertId,
      name, price, stock, description, brand, img,
      active: true,
    });
  } catch (error) {
    return errorDelServidor(res, error);
  }
};

export const actualizar = async (req: Request, res: Response) => {
  const id = interpretarId(req.params.id);
  if (id === null) return res.status(400).json({ mensaje: 'ID inválido' });

  const cuerpo = req.body ?? {};
  const mensajeError = validarCuerpo(cuerpo);
  if (mensajeError) return res.status(400).json({ mensaje: mensajeError });

  const { name, price, stock, description, brand = null, img = null } = cuerpo;
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      `UPDATE products
       SET name = ?, price = ?, stock = ?, description = ?, brand = ?, img = ?
       WHERE id = ? AND active = ?`,
      [name, price, stock, description, brand, img, id, true]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    return res.status(200).json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    return errorDelServidor(res, error);
  }
};

export const eliminar = async (req: Request, res: Response) => {
  const id = interpretarId(req.params.id);
  if (id === null) return res.status(400).json({ mensaje: 'ID inválido' });
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      'UPDATE products SET active = ? WHERE id = ? AND active = ?',
      [false, id, true]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    return res.status(200).json({ mensaje: 'Producto dado de baja' });
  } catch (error) {
    return errorDelServidor(res, error);
  }
};

export const cambiarPrecio = async (req: Request, res: Response) => {
  const id = interpretarId(req.params.id);
  if (id === null) return res.status(400).json({ mensaje: 'ID inválido' });

  const cuerpo = req.body ?? {};
  const claves = Object.keys(cuerpo);
  if (claves.length !== 1 || claves[0] !== 'price') {
    return res.status(400).json({ mensaje: 'El cuerpo debe contener solamente price' });
  }
  if (!precioValido(cuerpo.price)) {
    return res.status(400).json({ mensaje: 'price debe ser numérico, mayor que 0 y con máximo 2 decimales' });
  }
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      'UPDATE products SET price = ? WHERE id = ? AND active = ?',
      [cuerpo.price, id, true]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    return res.status(200).json({ mensaje: 'Precio actualizado' });
  } catch (error) {
    return errorDelServidor(res, error);
  }
};