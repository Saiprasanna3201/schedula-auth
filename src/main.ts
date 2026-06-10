import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Schedula Auth API')
    .setDescription('Role-Based Authentication — Doctor & Patient')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Root welcome route
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Schedula API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .logo { font-size: 60px; margin-bottom: 10px; }
    h1 { font-size: 3rem; font-weight: 700; margin-bottom: 10px; }
    .subtitle { font-size: 1.2rem; color: #a0c4ff; margin-bottom: 40px; }
    .badge {
      display: inline-block;
      background: #00c853;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-bottom: 40px;
    }
    .cards {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }
    .card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px 30px;
      min-width: 160px;
    }
    .card-icon { font-size: 2rem; margin-bottom: 8px; }
    .card-title { font-size: 1rem; font-weight: 600; }
    .card-desc { font-size: 0.8rem; color: #ccc; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 1rem;
      font-weight: 600;
      margin: 8px;
      transition: transform 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
    .footer { margin-top: 40px; color: #888; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🏥</div>
    <h1>Schedula API</h1>
    <p class="subtitle">Doctor Appointment Booking Backend</p>
    <div class="badge">✅ Server is Live</div>
    <div class="cards">
      <div class="card">
        <div class="card-icon">🔐</div>
        <div class="card-title">Auth</div>
        <div class="card-desc">JWT Authentication</div>
      </div>
      <div class="card">
        <div class="card-icon">👨‍⚕️</div>
        <div class="card-title">Doctor</div>
        <div class="card-desc">Profile & Discovery</div>
      </div>
      <div class="card">
        <div class="card-icon">🧑‍⚕️</div>
        <div class="card-title">Patient</div>
        <div class="card-desc">Onboarding APIs</div>
      </div>
    </div>
    <a href="/api" class="btn">📚 Swagger Docs</a>
    <div class="footer">Built with NestJS + PostgreSQL | Deployed on Render</div>
  </div>
</body>
</html>
    `);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Schedula Auth running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api\n`);
}

bootstrap();