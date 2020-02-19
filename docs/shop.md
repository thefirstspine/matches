# Shop endpoints

The shop endpoints are here to purchase items.

## POST /shop/exchange

Exchange internal currency (e.g. shards) for another item. This endpoint is protected with a user JWT token.

### Parameters

- `string` `shopItemId`: the item to purchase. Required.

### Response

- `boolean` `status`: the status of the request.
- `message` `message`: a message explaining a potential error.

## POST /shop/purchase

Purchase items with real currency. Transfert asks to the `shop` service. This endpoint is protected with a user JWT token.

Once a purchase is complete, the messaging service will send a message on the `TheFirstSpine:shop` subject.

### Parameters

- `string` `shopItemId`: the item to purchase. Required.

### Response

- `boolean` `status`: the status of the request.
- `string` `message`: a message explaining a potential error.
- `string` `html`: the HTML to display to the user in a web view.

## GET /shop/v/success

Page to diplay in case of purchase success.

## GET /shop/v/cancel

Page to diplay in case of purchase cancel or error.
