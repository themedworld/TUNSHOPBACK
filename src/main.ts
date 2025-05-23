async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Instead of direct body-parser, use NestJS built-in
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  // Configure CORS through NestJS methods
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true
  });
  
  app.setGlobalPrefix('api/v1');
  
  // Validate env vars before starting
  validateEnvVars();
  
  await app.listen(3001);
}

function validateEnvVars() {
  const requiredEnvVars = [
    'DB_HOST', 
    'DB_USERNAME',
    'DB_PASSWORD',
    'ACCESS_TOKEN_SECRET_KEY'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingVars.length > 0) {
    throw new Error(`⚠️ Les variables suivantes doivent être définies dans l'environnement: ${missingVars.join(', ')}`);
  }
}

bootstrap();