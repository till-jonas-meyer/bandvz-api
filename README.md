# BandVZ

## Prerequisites
* PostgreSQL 15.18
* Node.js 24.10.0
* NPM 11.6.1

## Local installation
* Clone the repository
* Change to project folder
* Run `cp .env.sample .env`
* Edit `.env` and change important configuration
* Run `npm install`
* Run `npx tsoa routes`
* Configure a PostgreSQL database (see below)
* Put DB credentials in `.env`
* Run `npm run migration:run`
* Run `npm run dev`

## Configure PostgreSQL

    CREATE USER bandvz WITH PASSWORD 'safe_password';

    CREATE DATABASE bandvz;

    GRANT ALL PRIVILEGES ON DATABASE bandvz TO bandvz;

    \c bandvz;

    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bandvz;

    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bandvz;

    GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO bandvz;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT ALL PRIVILEGES ON TABLES TO bandvz;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT ALL PRIVILEGES ON SEQUENCES TO bandvz;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT ALL PRIVILEGES ON ROUTINES TO bandvz;

    ALTER DATABASE bandvz OWNER TO bandvz;

## TSOA commands
* Generate routes: `npx tsoa routes`
* Generate `openapi.json`: `npx tsoa spec`
