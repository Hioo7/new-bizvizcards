# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prisma generate` only reads the schema, it never connects to the database,
# but prisma.config.ts requires DATABASE_URL to be set to load at all. .env is
# not copied into the image (see .dockerignore), so give it a placeholder here;
# the real value is supplied at container runtime via docker-compose env_file.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV LEGACY_DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npx prisma generate --config prisma/legacy.config.ts
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Alpine ships with no fonts and no fontconfig at all. sharp's SVG text
# rendering (used by VirtualBackgroundComposerService to draw the caption
# under the QR code) depends on fontconfig finding an installed font for the
# "Arial, sans-serif" family — without this, fontconfig has no config file
# and Pango silently renders every glyph as blank, which is invisible on a
# dev machine's own OS fonts but reproduces every time in this container.
# font-liberation provides Liberation Sans, a metric-compatible Arial
# substitute, so it matches the family requested in
# virtual-backgrounds.constants.ts.
RUN apk add --no-cache fontconfig font-liberation && fc-cache -f
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run seed:plan-policy-defaults && node dist/main.js"]
