# comp2537-assignment1
## Setup git

git log --show-signature
git push -u origin main

## Setup Node project and Express, express-session

````bash
npm init -y
npm i express
npm i nodemon
npm i express-session 
need to use a previous version of express
"express": "^4.18.2",

npm run devStart

#other helpful tricks

killall -9 node  // reset port 3000 by killing all node.