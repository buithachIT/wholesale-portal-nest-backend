import { DynamicModule, Module } from '@nestjs/common';
import { DB_OPTIONS, type DbModuleOptions } from './db.constants';
import { DbService } from './db.service';

@Module({})
export class DbModule {
  static register(options: DbModuleOptions): DynamicModule {
    return {
      module: DbModule,
      providers: [{ provide: DB_OPTIONS, useValue: options }, DbService],
      exports: [DbService],
    };
  }
}
