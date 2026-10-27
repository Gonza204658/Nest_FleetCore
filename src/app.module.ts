
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Controlador temporal para probar JWT, Roles y API Key
import { TestController } from './common/test.controller.js';

// Interceptor y filtro globales
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

// Módulos de la aplicación
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { MechanicsModule } from './mechanics/mechanics.module.js';
import { WorkshopsModule } from './workshops/workshops.module.js';
import { MaintenancesModule } from './maintenances/maintenances.module.js';

// Guards globales
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

  // Controlador temporal para probar JWT, Roles y API Key
  controllers: [TestController],

  // Registro global de guards, interceptor y filtro
  providers: [
    // Primero JWT
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Después Roles
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Estandariza las respuestas
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // Maneja las excepciones de la aplicación
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
