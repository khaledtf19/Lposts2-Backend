import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as csurf from "csurf";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(helmet());
  app.use(csurf());
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
