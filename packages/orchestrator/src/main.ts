import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);

	// Enable CORS
	const corsOrigins = process.env.CORS_ORIGIN
		? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
		: "*";

	app.enableCors({
		origin: corsOrigins,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
		credentials: true,
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
