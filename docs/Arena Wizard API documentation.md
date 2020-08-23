Arena Wizard API documentation
===
The wizard API helps you interact with the players accounts.
## Endpoints documentation
This part describes the endpoints of the API.
### GET /wizard/:id
`id`This endpoint is not protected.

Response code | Description | Example
--- | --- | ---
404 Not Found | The wizard does not exist. |
200 OK | Normal response |
```
{
"message": {
"statusCode": 404,
"error": "Not Found"
},
"statusCode": 404,
"timestamp": "2020-07-29T08:56:49.135Z",
"path": "/wizard/63718"
}
```
```
{
"id": 1,
"name": "EnergyBear",
"version": 0.8,
"items": [
{
"name": "holo-applicant",
"num": 20
}
],
"history": [
{
"gameId": 1,
"gameTypeId": "fpe",
"victory": true,
"timestamp": 1591123742571
}
],
"triumphs": [
"wizzard",
"summoner"
],
"purchases": [
"holo-soul-of-a-sacrified-hunter",
"holo-summoner"
],
"avatar": "merlin",
"title": "comic",
"friends": [
3,
1
],
"publicRoom": "fr"
}
```
### GET /wizard/me
Get the wizard account of the connected user. If the wizard does not exist, it is created with basic data.
`Authorization: Bearer xxx.xxx.xxx`
Response code | Description | Example
--- | --- | ---
403 Forbidden | The provided access token is not valid. |
200 OK | Normal response |
```
{
"message": {
"statusCode": 403,
"error": "Forbidden",
"message": "Forbidden resource"
},
"statusCode": 403,
"timestamp": "2020-07-20T21:29:43.427Z",
"path": "/wizard/me"
}
```
```
{
"id": 1,
"name": "EnergyBear",
"version": 0.8,
"items": [
{
"name": "holo-applicant",
"num": 20
}
],
"history": [
{
"gameId": 1,
"gameTypeId": "fpe",
"victory": true,
"timestamp": 1591123742571
}
],
"triumphs": [
"wizzard",
"summoner"
],
"purchases": [
"holo-soul-of-a-sacrified-hunter",
"holo-summoner"
],
"avatar": "merlin",
"title": "comic",
"friends": [
3,
1
],
"publicRoom": "fr"
}
```
### PATCH /wizard/me
Update the account of the connected user.
`Authorization: Bearer xxx.xxx.xxx`
Parameter name | Type | Required ? | Description
--- | --- | --- | ---
name | string | no | The name of the player
avatar | string | no | The chosen avatar of the player. Should be a valid avatar ID under the /rest/avatars endpoint of the rest net service.
title | string | no | The chosen title of the player. Should be a valid triumph ID under the /rest/triumphs endpoint of the rest net service. The player should have too the titile under the titles key of his account.
friends | number[] | no | The IDs of the friends added.
publicRoom | 'fr'|'en' | no | The public room chosen.

Response code | Description | Example
--- | --- | ---
403 Forbidden | The provided access token is not valid. |
400 Bad Request | The parameters are malformed | Can vary
200 OK | Normal response |
```
{
"message": {
"statusCode": 403,
"error": "Forbidden",
"message": "Forbidden resource"
},
"statusCode": 403,
"timestamp": "2020-07-20T21:29:43.427Z",
"path": "/wizard/me"
}
```
```
{
"id": 1,
"name": "EnergyBear",
"version": 0.8,
"items": [
{
"name": "holo-applicant",
"num": 20
}
],
"history": [
{
"gameId": 1,
"gameTypeId": "fpe",
"victory": true,
"timestamp": 1591123742571
}
],
"triumphs": [
"wizzard",
"summoner"
],
"purchases": [
"holo-soul-of-a-sacrified-hunter",
"holo-summoner"
],
"avatar": "merlin",
"title": "comic",
"friends": [
3,
1
],
"publicRoom": "fr"
}
```
### POST /wizard/:id/reward
Add some items to the wizard’s inventory.
`X-Client-Cert: xxx`
Parameter name | Type | Required ? | Description
--- | --- | --- | ---
name | string | yes | The name of the item to add
num | integer | yes | The number of items to add

Response code | Description | Example
--- | --- | ---
403 Forbidden | The provided certificate is not valid |
400 Bad Request | The parameters are malformed | Can vary
200 OK | Normal response |
```
{
"message": {
"statusCode": 403,
"error": "Forbidden",
"message": "Forbidden resource"
},
"statusCode": 403,
"timestamp": "2020-07-20T21:29:43.427Z",
"path": "/wizard/1/reward"
}
```
```
(empty response)
```
