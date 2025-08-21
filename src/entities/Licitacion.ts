import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('licitaciones')
export class Licitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  idLicitacion: string;

  @Column({ type: 'varchar', length: 500 })
  nombre: string;

  @Column({ type: 'datetime' })
  fechaPublicacion: Date;

  @Column({ type: 'datetime' })
  fechaCierre: Date;

  @Column({ type: 'varchar', length: 300 })
  organismo: string;

  @Column({ type: 'varchar', length: 200 })
  unidad: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montoDisponible: number;

  @Column({ type: 'varchar', length: 10 })
  moneda: string;

  @Column({ type: 'varchar', length: 50 })
  estado: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime' })
  processedAt: Date;
}
