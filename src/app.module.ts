import {MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import{TypeOrmModule} from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { UsersModule } from './users/users.module';
import { CurrentUserMiddleware } from './utility/middlewares/current-user.middleware';
import { ProductModule } from './product/product.module';
import { CommandesModule } from './commandes/commandes.module';


@Module({
  imports: [// app.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Nécessaire pour certains setups
  synchronize: false, // Désactivez en production !
  autoLoadEntities: true,
  logging: true,
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

