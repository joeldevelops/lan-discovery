# LAN Discovery Tool

This tool enables the discovery of reachable hosts on a local network through either the command line or via a server.

### Table of Contents
- [LAN Discovery Tool](#lan-discovery-tool)
    - [Table of Contents](#table-of-contents)
  - [Running the Tool](#running-the-tool)
    - [Setup](#setup)
    - [Running on the Command Line](#running-on-the-command-line)
      - [ts-node](#ts-node)
      - [Without ts-node](#without-ts-node)
      - [Commands](#commands)
    - [Running the Server](#running-the-server)
  - [Running Tests](#running-tests)
- [Appendix](#appendix)
  - [Assumptions and Considerations](#assumptions-and-considerations)
    - [Pinging All Hosts](#pinging-all-hosts)
    - [Testing the Controller File](#testing-the-controller-file)
    - [API Input Validation](#api-input-validation)
    - [Swagger File](#swagger-file)
    - [Winston and console.log](#winston-and-consolelog)
    - [Server vs Command Line](#server-vs-command-line)
    - [Dockerizing the App](#dockerizing-the-app)

## Running the Tool

There are two options for running the tool:
1. As a command-line application
2. As a server to make GET requests against

### Setup

Create a `.env` at the root of the project and add the following fields:
```sh
RUNTIME_ENV=dev|test|prod # Included for posterity
LOG_LEVEL=silly|debug|info|warn|error
PORT=3000
```

Then, run `npm install`
```sh
npm install
```

### Running on the Command Line
`ts-node` is recommended for running this, but it is possible to run without this tool.

#### ts-node
run:
```sh
npx ts-node . --help
```

or:
```sh
npm i -g ts-node
ts-node . --help
```

#### Without ts-node
run:
```sh
npm run build
node . --help
```

#### Commands
This app exposes the following three commands for operation:
```sh
list-interfaces  List network interface names of the local system.
discover <name>  Bind to a network interface on the local system and find
                 reachable hosts on the local network.
serve            Start the LAN Discovery app as a server.
```

### Running the Server
Again there are two ways to run the server.
```sh
npm run start
```

or:
```sh
ts-node . serve
```

With the server up, the following curl requests can be made:
```sh
curl localhost:3000/api/v1/nics # list network interface names on the local system.
curl localhost:3000/api/v1/nics/<name>/discover-lan
```

## Running Tests
```sh
npm test
```

Collecting coverage:
```sh
npm run test:coverage
```

# Appendix

This section is for discussing design considerations of the application.

## Assumptions and Considerations

### Pinging All Hosts
For this I've decided to use `arpjs` to read the arp table of the local network to find pingable hosts. This is more efficient than scanning the network. It does lead to pinging the broadcast IPs however it would be trivial to avoid this by doing bit manipulation to determine the IP to skip. [This wikipedia page describes the bit manipulation function](https://en.wikipedia.org/wiki/Broadcast_address).

### Testing the Controller File
This generally should be handled by an integration testing framework like supertest or nock. It might be overkill for this application and I'd like to not spend forever getting it just perfect. In a professional setting these tests would be a requirement for the pull request. 

### API Input Validation
Not strictly necessary for this application as we are only sending strings to the application.

### Swagger File
Swagger could potentially be useful for this application as a GUI for making requests to the server, but the API is not so overly complicated that doing cURLs would be a nuisance.

### Winston and console.log
Both are used in this application so that the logging needed for the command line runs are not disabled by the user-set logging level. This also allows for heightened logging levels to help debug when running as a command-line where running a debugger might be more difficult.

### Server vs Command Line
This application is designed to be run either as a server application or a command line app. This way the app can be flexible to meet the needs of the user. The app can technically be dockerized but there are issues with the docker networks and exposing the network interfaces.

### Dockerizing the App
If you're interested in dockerizing the application, it can be done by creating the following files:

`Dockerfile`
```sh
FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci
COPY . .

RUN npm run build

EXPOSE $PORT
CMD [ "node", ".", "serve" ]
```

`docker-compose.yml`
```sh
version: "3"

services: 
  users:
    env_file: ./.env
    build: ./
    ports:
      - "${PORT}:${PORT}"
```
