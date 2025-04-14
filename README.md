# Webpage Project

## Overview
This is a web-based project created as part of the FS/3A Project. It provides [brief description of what your webpage does or its purpose].

## Steps

1. Clone project 

```sh
git clone 'https://github.com/TEssarhir/gestion-stock-umi2'
```

2. Then start your mysql server

```sh
mysql -u root -p < server/db/generate.sql # replace -u {user} with your name, and -p {password}
mysql -u root -p < server/db/seed.sql # replace -u {user} with your name, and -p {password}
```

3. After it install the server and client dependancies

```sh
cd server # for server folder
npm install
cd ../client # for client folder
npm install
```

5. Create a file the `server` folder named `.env.local` with your local variables of mysql (user and password)

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=GESTION_STOCK
PORT=8080
```

5. Finally run your server and client in two terminals

- server :

```sh
cd server
npm run dev
```

- client :

```sh
cd client
npm start
```
