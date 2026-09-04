import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config.service';
import { BetterAuthApiErrorFilter } from './common/filters/better-auth-api-error.filter';
import {
  CUSTOMER_AUTH,
  EMPLOYEE_AUTH,
  MCP_BASE_PATH,
} from './common/auth/auth.constants';
import { registerAuthHttpMounts } from './common/auth/register-auth-http-mounts';
import type { EmployeeAuth } from './common/auth/employee-auth.factory';
import type { CustomerAuth } from './common/auth/customer-auth.factory';
import { createMcpFetchHandler } from './modules/mcp/mcp-http-handler';
import { McpServerService } from './modules/mcp/services/mcp-server.service';
import { CustomersService } from './modules/customers/services/customers.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  // Exactly one reverse proxy sits in front of this app (nginx — see
  // nginx/default.conf's `proxy_pass` to the backend container) and sets
  // X-Forwarded-For on every request. Without this, Express's default
  // req.ip falls back to the raw TCP peer address, which behind nginx is
  // the proxy container's own internal Docker IP — the SAME value for
  // every request regardless of the real client. That silently broke
  // the OAuth/MCP rate limiter (see register-auth-http-mounts.ts): its
  // default IP-based keyGenerator was keying every customer's OAuth/MCP
  // request (plus ChatGPT's, Claude's, and any other caller) under one
  // shared bucket, so the "100 requests
  // per 60s" limit was actually a single global budget for the entire
  // app's OAuth/MCP traffic — trivially exhausted by ordinary usage, and
  // surfaced to users as unpredictable "couldn't register" / "connection
  // stopped working" failures that had nothing to do with their own
  // request volume. (express-rate-limit does detect this misconfiguration
  // via its xForwardedForHeader validation, but only logs it once to the
  // server's own console — it never fails the request, so this went
  // unnoticed without reading server logs.) `1` trusts exactly the
  // nearest hop (nginx), which is the correct value for this single-proxy
  // topology — not `true`, which would trust the full chain and let a
  // client forge its own X-Forwarded-For to bypass rate limiting entirely.
  app.set('trust proxy', 1);
  const appConfig = app.get(AppConfigService);
  const employeeAuth = app.get<EmployeeAuth>(EMPLOYEE_AUTH);
  const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);

  const httpAdapter = app.getHttpAdapter().getInstance();

  // The cross-origin OAuth/MCP surface (oauth2/* endpoints, the well-known
  // discovery documents, the better-auth `all()` handlers) plus its CORS and
  // rate limiting — mounted in one shared place so its endpoint list can't
  // drift from the integration test's copy. See register-auth-http-mounts.ts.
  // Must run before app.enableCors() (which only allows this app's own frontend
  // origins) and before express.json() below.
  registerAuthHttpMounts(httpAdapter, { customerAuth, employeeAuth });

  // requireMcpAuth (wrapping our tool-serving handler) is itself a Web
  // Standard `(Request) => Promise<Response>` function — same shape
  // toNodeHandler already bridges to Express for the auth mounts above, so
  // it's mounted the same way (ahead of express.json(): it reads the raw
  // request body itself via the Fetch Request, like better-auth's own
  // handlers do).
  const mcpResource = `${appConfig.publicAppBaseUrl}${MCP_BASE_PATH}`;
  httpAdapter.post(
    MCP_BASE_PATH,
    toNodeHandler(
      createMcpFetchHandler({
        customerAuth,
        mcpServerService: app.get(McpServerService),
        customersService: app.get(CustomersService),
        resource: mcpResource,
      }),
    ),
  );

  app.enableCors({
    origin: appConfig.corsAllowedOrigins,
    credentials: true,
  });

  app.use(express.json());
  app.useGlobalFilters(new BetterAuthApiErrorFilter());

  await app.listen(appConfig.port);
}
void bootstrap();
