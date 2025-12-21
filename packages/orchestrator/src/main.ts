import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	// Enable CORS
	const corsOrigins = process.env.CORS_ORIGIN
		? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
		: "*";

	app.enableCors({
		origin: corsOrigins,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
		credentials: true,
	});

	// Serve static files from uploads directory
	app.useStaticAssets(join(process.cwd(), "uploads"), {
		prefix: "/uploads/",
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	);

	// Swagger API documentation
	const config = new DocumentBuilder()
		.setTitle("WordPress PaaS Orchestrator")
		.setDescription("API for managing WordPress instances on Docker Swarm")
		.setVersion("1.0")
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("docs", app, document);

	const port = process.env.PORT || 3001;
	await app.listen(port);
	console.log(`Orchestrator running on port ${port}`);
}

bootstrap();
