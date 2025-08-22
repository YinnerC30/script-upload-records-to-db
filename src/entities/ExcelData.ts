import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('excel_data')
export class ExcelData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'longtext' })
  data!: string;

  @Column({ type: 'datetime' })
  processedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
