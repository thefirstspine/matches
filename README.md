Install & run arena service
===
## Installation
```
npm install
```
## Configuring
The service needs a dotenv file to run. This dotenv file will be loaded in the environment variables. Here’s what the app needs:

Environement key | Summary | Required by
--- | --- | ---
ARENA_URL | Arena net service URL | App
BOTS_PUBLIC_KEY | Public key to interact with bots net service | App
BOTS_URL | Bots net service URL | App
AUTH_URL | Auth net service URL | @thefirstspine/auth-nest
MESSAGING_PUBLIC_KEY | Public key to interact with messaging net service | @thefirstspine/messaging-nest
MESSAGING_URL | Messaging net service URL | @thefirstspine/messaging-nest
PRIVATE_KEY | Private key to validate protected incoming requests | @thefirstspine/certificate-authority
PORT | The port where to serve the app | App
REST_URL | Rest net service URL | App
ROOMS_PUBLIC_KEY | Public key to interact with rooms net service | App
ROOMS_URL | Rooms net service URL | App
SHOP_PUBLIC_KEY | Public key to interact with shops net service | App
SHOP_URL | Shop net service URL | App
CALENDAR_URL | Calendar URL | App
## Running the app
```
npm run start
```
## Build & run for production
```
npm run build
node dist/main.js
```
## Test
```
npm run test:game
```
