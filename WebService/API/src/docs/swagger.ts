import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';

export function registerSwagger(app: Express) {
  app.get('/openapi.json', (_req, res) => {
    res.type('application/json').send(openApiSpec);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customSiteTitle: 'RakuShield API Docs',
      swaggerOptions: {
        docExpansion: 'list',
      },
    }),
  );
}
