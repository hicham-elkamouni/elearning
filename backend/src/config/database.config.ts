import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  useFactory: (config: ConfigService) => ({
    type: 'mysql' as const,
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    entities: [User],
    synchronize: true,
    logging: true,
  }),
  inject: [ConfigService],
};
