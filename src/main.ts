import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import * as bodyParser from 'body-parser';

config(); // Charge les variables d'environnement

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS pour production
  app.enableCors({
    origin: [
      'http://localhost:3000', // Dev
      'https://votre-frontend-render.onrender.com' // Production
    ],
    credentials: true,
  });

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  
  app.setGlobalPrefix('api/v1');
  
  await app.listen(process.env.PORT || 3001);
}
bootstrap();