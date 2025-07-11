# ---------- FRONTEND BUILD ----------
    FROM node:20-alpine AS frontend-builder

    WORKDIR /app/astrogram
    
    # Install frontend dependencies
    COPY astrogram/package*.json ./
    RUN npm install
    
    # Copy the rest of the frontend app
    COPY astrogram ./
    
    # allow passing the Vite API base URL at build time
    ARG VITE_API_BASE_URL
    ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
    
    # Build the React app
    RUN npm run build
    
    # ---------- BACKEND BUILD ----------
    FROM node:20-alpine AS backend-builder
    
    WORKDIR /app/backend
    
    # Install backend dependencies
    COPY backend/package*.json ./
    RUN npm install
    
    # Copy backend source
    COPY backend ./
    
    # ⬇️ Copy frontend build into backend public folder
    COPY --from=frontend-builder /app/astrogram/dist ./public
    
    # Build NestJS backend
    RUN npm run build
    
    # ---------- FINAL STAGE ----------
    FROM node:20-alpine
    
    WORKDIR /app
    
    # Copy backend build output
    COPY --from=backend-builder /app/backend/dist ./dist
    COPY --from=backend-builder /app/backend/node_modules ./node_modules
    
    # Copy frontend static files served by Express
    COPY --from=backend-builder /app/backend/public ./public
    
    # Copy any necessary production files
    COPY backend/package*.json ./
    
    # Expose the port
    EXPOSE 3000
    ENV NODE_ENV=production
    
    # Start the NestJS app
    CMD ["node", "dist/main"]