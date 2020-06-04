# Profile endpoints

The profile endpoints can manage the user's account in Arena.

## GET /wizzard

Get the Arena's account. This endpoint is protected with a user JWT token.

### Response

Returns an `IWizard` instance.

For more infomation about this type, see <https://github.com/thefirstspine/arena-shared/blob/master/wizzard.d.ts>

## POST /wizzard/edit

Edit fields of a wizzard.

### Parameters

- `string` `avatar`: the ID of the avatar to use. All available avatars are in the REST service. Optionnal.
- `string` `title`: the ID title to use. All available titles are in the REST service. Optionnal.

### Response

Returns an `IWizard` instance.

For more infomation about this type, see <https://github.com/thefirstspine/arena-shared/blob/master/wizzard.d.ts>
