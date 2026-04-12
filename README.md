

# TrustChain

A full-stack web application for product traceability and trust across supply chain stakeholders — producers, regulators, and consumers.

**Live Demo**: [https://mdx-fyp26-two.vercel.app/](https://mdx-fyp26-two.vercel.app/)

## Features

- Role-based access for producers, regulators, and consumers
- Product listing, details, and traceability
- Review and comment system with replies, likes, and dislikes
- Event tracking and notifications
- Analytics dashboard
- File/image upload support
- Contact and support pages

## Tech Stack

**Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router  
**Backend**: Node.js, Express, TypeScript  
**Database**: MongoDB Atlas  
**Auth**: JWT

## Run Locally

**Prerequisites:** Node.js, MongoDB URI

1. Clone the repo:
   ```bash
   git clone https://github.com/preciousgit/mdx-fyp.git
   cd mdx-fyp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root:
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5002
   ```

4. Start the backend:
   ```bash
   npm run server
   ```

5. Start the frontend (in a separate terminal):
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

## Deployment

- **Frontend** hosted on [Vercel](https://vercel.com)
- **Backend** hosted on [Railway](https://railway.app)
