# Matches

The matches service is the service that will manage all the games in the TFS products.

## Installation

```
npm ci
```

## Running the app

```
npm run start
```

## Build & run for production

```
npm run build
node dist/main.js
```

## Configuration

See the configuration keys with the [Ansible playbook](https://github.com/thefirstspine/ansible/blob/master/volume/playbooks/deploy-matches.yaml)

To help you configure your local environment to generate a dotenv file you can use the [configurator](https://github.com/thefirstspine/configurator) using this command:

```
node configurator.js create matches --conf-path [local copy of ansible volume]/conf --force-http true
```

## About queue and game instances

Queues & game instances are the core concepts in the Matches service. Queues instances can be created through the API and can be joined by every players. It is used to create game instance based on the parameters provided during the creation of the queue, and when a player is joining a queue.

A game instance cannot be created or deleted though the API.
