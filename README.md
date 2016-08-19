This repository contains the source code for a web server that acts as a personal API for an individual on the Web.

The server consumes files stored in a data directory and makes them publically available through a RESTful API that conforms to the [JSON API specification](http://jsonapi.org/). These files are mainly formatted in JSON but can also include those with other formats as supporting assets.

The initial use case of this server is to support [a personal web app](https://github.com/markmhx/web), but it is intended to serve any number of use cases that require public access to personal data made available by individuals.

# Data

The data directory must be made available at `./data` either directly or as a symbolic link to its path elsewhere.

Files within the directory should be organized into subdirectory named by type, all lower-case and with dashes used to indicate spaces. E.g. "posts" within the `posts` subdirectory and "athletic results" within the `athletic-results` subdirectory.

Within each directory, objects are represented as JSON files that conform to the JSON API format and are named by their ID plus the ".json" extension. For example, a post object within the `posts` directory could be located at `posts/15.json`.

# Running

Running the server requires [Node.js](http://nodejs.org/) with [NPM](https://www.npmjs.com/) and the `SERVER_PORT` environment variable set to the port on which you'd like it to listen for requests. Then simply execute `node app.js` to fire it up.

# Development and Deployment

With [Grunt](gruntjs.com) installed, you can run scripts to help with development and deployment.

- `grunt dev`: Runs the server and automatically reloads it when changes are made during development.
- `grunt deploy`: Deploys the app to a remote server and runs `npm install` to ensure any new dependencies are loaded there. Also restarts all (forever)[https://github.com/foreverjs/forever] processes on the remote server with the assumption that forever is currently running the server there.
- `grunt deploy-data`: Deploys the data directory to the same remote server to ensure data parity there.

Both deployment scripts require the following environment variables:

- `SERVER_DEPLOY_HOST_USERNAME`: User name with which to SSH into remote server
- `SERVER_DEPLOY_HOST`: Address of the remote server
- `SERVER_DEPLOY_HOST_DIR`: Destination directory for deployment on remote server
- `SERVER_DATA_DIR`: Local data directory for deployment on remote server (not assumed as `./data` in case it has been symlinked there from elsewhere locally)