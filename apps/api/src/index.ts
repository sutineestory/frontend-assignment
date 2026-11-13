import { buildApp } from "./http/build-app.js";

const app = buildApp({ logger: true });
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
