import {MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import{TypeOrmModule} from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { UsersModule } from './users/users.module';
import { CurrentUserMiddleware } from './utility/middlewares/current-user.middleware';
import { ProductModule } from './product/product.module';
import { CommandesModule } from './commandes/commandes.module';


@Module({
  imports: [ TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: true, // Obligatoire pour Neon
      // Désactivez synchronize en production !
      synchronize: process.env.NODE_ENV !== 'production',
      autoLoadEntities: true,
    }), UsersModule, ProductModule, CommandesModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CurrentUserMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

