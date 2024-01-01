
# COMP-4990 Final Project

This application leverages IBM Watson's NLP technology to offer sentiment and emotion analysis of user-entered text. Users can authenticate, submit text, and receive immediate analytical feedback. Additionally, the app provides a statistical overview of sentiment and emotion trends over selected timeframes, enhancing understanding of textual expressions.

## Tech Stack

* NextJS
* NodeJS/Express
* Microsoft SQL
* Clerk Authentication
* IBM Watson NLP

## Development Setup

### Prerequisites

- Node.js: [Download and Install Node.js](https://nodejs.org/)

### Installation

1. Clone this repository:

```bash
git clone git@github.com:hassanuahmad/comp-4990-final-project.git
```

2. Install project dependencies in both client and server folders:

```bash
npm install
```

3. Copy the `.env.example` file in the client folder and rename it to `.env`. Update the variables with appropriate values:

```env
# The following variables are required for authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="clerk-publishable-key"
CLERK_SECRET_KEY="clerk-secret-key"

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

4. Copy the `.env.example` file in the server folder and rename it to `.env`. Update the variables with appropriate values:

```env
NLP_API_KEY="ibm-watson-nlp-api-key"

# The following variables are required for the database
DB_USER="your-db-user"
DB_PASSWORD="your-db-password"
DB_SERVER="your-db-server"
DB_PORT="your-db-port"
DB_NAME="your-db-name"
```

### Development

Start the Next.js development server (client folder):

```bash
npm run dev
```

Start the NodeJS server (server folder):

```bash
npm run dev

OR

nodemon index.js
```

Your development environment is now set up and running. Access the site at [http://localhost:3000](http://localhost:3000).
