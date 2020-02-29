# Game API

The game API is a JSON-RPC query. JSON-RPC specifications available here: <https://www.jsonrpc.org/specification>

## POST /api

Make a JSON-RPC request to the game API.

### Parameters

- `string` `jsonrpc`: the version of the JSON-RPC request. Use the `2.0` version. Required.
- `string` `method`: the method to use in the request. Required.
- `object` `params`: an object to use with the params. Required.
- `int` `id`: the ID of the game to interact with. Optionnal.

### Response

- `string` `jsonrpc`: the version of the JSON-RPC protocol used.
- `any` `result`: the result of the method invoked.
- `error` `error`: the error object if there was an error during the method invokation.
- `integer` `id`: the provided game ID.

#### Error object

The error object in the API should have these properties:

- `integer` `code`: the error code. See the specifications for codes explanations.
- `string` `message`: the message of the error.

## The API methods

All the API methods are mapped in the API service <./src/api/api.service.ts>
