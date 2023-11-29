# Kullanmak istediğiniz base image'ı seçin
FROM node:14-slim

# Uygulamanızın çalışacağı dizini belirtin
WORKDIR /usr/src/app

# package.json ve package-lock.json'ı kopyala
COPY package*.json ./

# Bağımlılıkları yükleyin
RUN npm install

# Uygulama kodlarını kopyala
COPY . .

# Uygulamayı başlat
CMD ["node", "index.js"]
