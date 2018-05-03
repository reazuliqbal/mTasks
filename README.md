# mTasks

Steem mTasks is a Fiverr like platform built on top of STEEM Blockchain using blockchain's Escrow features. At it's current state it is no where near as complete as Fiverr is but its a start and there is plenty to come. You can take it as SteemGigs.org alternative.

## Features

- Registration and login using SteemConnect
- Creation of services
- Listing of services by category, by user
- User profile page
- User dashboard

## How it works

- First a user creates an account on the site using SteemConnect. After that user can create services or order services created by others.
- Created service is posted on STEEM Blockchain with nice formating and some important data is saved into site's database.
- Now any registered Steem user can order the service by creating an escrow transfer to the SELLER, using site's account as the AGENT. Agent may require a fee. This is done by click on a button.
- Money is kept on the blockchain, and if the SELLER and AGENT approves the order within 3 days, SELLER can start working on the order and deliver. Escrow warranty period is 2 months.
- If BUYER approves the delivered work, s/he can release the money. Both buyer and seller can dispute the order and AGENT will step in to make the final decision.

## How to install and contribute

Clone the repository, make changes to `example.env` according to your credentials. Rename the file to `.env`

Open up Terminal and inset following commands:

```npm install```

For production use:

```npm run start```

For development use:

```npm run dev```

## Technologies used

- Node JS (v8.10.0+)
- MongoDB
- Express JS
- Mongoose
- Steem JS
- Materialize

## TODO

Currently I am considering it as a working proof of concept. Lots of work to be done including but not limited to:

- Adding on site cover image upload
- Adding form fields and other validations
- Adding in-site project delivery
- Adding seller and buyer rating system
- Adding all the required dashboard features for buyer, seller, and agent
- and many more...

## THIS IS NOT PRODUCTION READY

## DEMO: https://steemmtask.herokuapp.com
