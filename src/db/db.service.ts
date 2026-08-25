import { Inject, Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { DB_OPTIONS } from './db.constants';
import type { DbModuleOptions } from './db.constants';

@Injectable()
export class DbService {
  constructor(
    @Inject(DB_OPTIONS)
    private readonly options: DbModuleOptions,
  ) {}

  private get filePath(): string {
    return path.isAbsolute(this.options.uri)
      ? this.options.uri
      : path.join(process.cwd(), this.options.uri);
  }

  async read(): Promise<unknown[]> {
    try {
      const data = await readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? (parsed as unknown[]) : [];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async write(obj: unknown): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(obj, null, 2), 'utf8');
  }
}
