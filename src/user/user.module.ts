import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule.register({ uri: 'user.json' })],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
