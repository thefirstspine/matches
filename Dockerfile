FROM node:16

WORKDIR /matches

COPY . .

RUN npm i 
RUN npm run build

CMD ["node", "dist/main.js"]
