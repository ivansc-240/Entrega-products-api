import express, { Application } from 'express';
import rutas from './routes/index';

export class Servidor {
  private aplicacion: Application;
  private puerto: number;

  constructor() {
    this.aplicacion = express();
    this.puerto = Number(process.env.PORT ?? 3000);
    this.configurarMiddlewares();
    this.configurarRutas();
  }

  private configurarMiddlewares(): void {
    this.aplicacion.use(express.json()); // antes de registrar las rutas
  }

  private configurarRutas(): void {
    this.aplicacion.use('/api/v1', rutas);
  }

  iniciar(): void {
    this.aplicacion.listen(this.puerto, () =>
      console.log(`Servidor en http://localhost:${this.puerto}`)
    );
  }
}