# Arena service

The `arena` service is the service that will manage all the games & wizzards accounts in the Arena products.

## Installation

```bash
npm install
```

## Running the app

```bash
npm run start
```

## Build & run for production

```bash
npm run build
node dist/main.js
```

## Test

```bash
npm run test:game
```

## Public endpoints documentation

### Generic endpoints

- [GET /](docs/generic.md#GET%20%2F)
- [GET /status](docs/generic.md#GET%20%2Fstatus)

### Game API

- [POST /api](docs/game-api.md#POST%20%2Fapi)

### Shop endpoints

- [POST /shop/exchange](docs/shop.md#POST%20%2Fshop%2Fexchange)
- [POST /shop/purchase](docs/shop.md#POST%20%2Fshop%2Fpurchase)
- [GET /shop/v/success](docs/shop.md#GET%20%2Fshop%2Fv%2Fsuccess)
- [GET /shop/v/cancel](docs/shop.md#GET%20%2Fshop%2Fv%2Fcancel)

### Profile endpoints

- [GET /wizzard](docs/wizzard.md#GET%20%2Fwizzard)
- [POST /wizzard/edit](docs/wizzard.md#POST%20%2Fwizzard%2Fedit)

## License

Nest is [MIT licensed](LICENSE).

TFS Platform is NOT licensed. You are free to download, view, run the repository. You are NOT allowed to redistribute this project for both commercial and non-commercial use. Deal with it.
