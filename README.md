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

- [GET /](docs/generic.md#get_/)
- [GET /status](docs/generic.md#get_status)

### Game API

- [POST /api](docs/game-api.md#post_api)

### Shop endpoints

- [POST /shop/exchange](docs/shop.md#post_shop_exchange)
- [POST /shop/purchase](docs/shop.md#post_shop_purchase)
- [GET /shop/v/success](docs/shop.md#get_shop_v_success)
- [GET /shop/v/cancel](docs/shop.md#get_shop_v_cancel)

### Profile endpoints

- [GET /wizzard](docs/shop.md#get_wizzard)
- [POST /wizzard/edit](docs/shop.md#post_wizzard_edit)

## License

Nest is [MIT licensed](LICENSE).

TFS Platform is NOT licensed. You are free to download, view, run the repository. You are NOT allowed to redistribute this project for both commercial and non-commercial use. Deal with it.
