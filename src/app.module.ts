
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

// Controlador temporal para probar JWT, Roles y API Key
import { TestController } from './common/test.controller.js';

import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { MechanicsModule } from './mechanics/mechanics.module.js';
import { WorkshopsModule } from './workshops/workshops.module.js';
import { MaintenancesModule } from './maintenances/maintenances.module.js';

import { JwtAuthGuard, RolesGuard } from './common/guards/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Solo desarrollo
      }),
    }),

    UsersModule,
    AuthModule,
    VehiclesModule,
    MechanicsModule,
    WorkshopsModule,
    MaintenancesModule,
  ],

  // Controlador temporal para probar los guards
  controllers: [TestController],

  // Guards globales: primero JWT y después Roles
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
