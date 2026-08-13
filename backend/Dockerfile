# Menggunakan Node.js LTS versi Alpine (ringan & cepat)
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy file dependency dulu untuk efisiensi caching
COPY package*.json ./

# Install dependency untuk production
RUN npm ci --only=production

# Copy seluruh source code backend
COPY . .

# Port yang digunakan oleh Express.js
EXPOSE 3000

# Jalankan aplikasi Express
CMD ["node", "src/app.js"]