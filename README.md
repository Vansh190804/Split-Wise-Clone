# Split-Wise-Clone

A full-stack expense-sharing application inspired by Splitwise, built to explore the complexities of expense tracking, balance calculations, settlements, and relationships between users.

Rather than focusing solely on the UI, this project explores the database design and backend logic required to manage expenses between friends and within groups, maintain accurate balances, and preserve transaction history.

## ✨ Features

- **Group Management** — Create and manage groups.
- **Friendships** — Add friends and manage friendships.
- **Expense Management** — Create, edit, and delete expenses.
- **Expense Splitting** — Split expenses among multiple users.
- **Balance Tracking** — Track individual and group balances.
- **Settlements** — Settle outstanding balances between users.
- **Transaction History** — View expense and settlement history.
- **Authentication** — Sign in using Google OAuth.

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Google OAuth

### Storage

- **Supabase Storage** — Stores user and group images.

### Development & Deployment

- Docker
- Docker Compose

## 🎯 What I Wanted to Learn

This project was primarily built to understand the complex database and backend workflows found in applications like Splitwise.

A basic expense tracker can be implemented with straightforward CRUD operations. However, an application like this introduces more challenging questions:

- How should expenses and their individual splits be represented in a relational database?
- How should balances be calculated across multiple expenses?
- How should settlements affect balances while preserving transaction history?
- How should expenses between the same two users behave when they occur both inside and outside groups?
- How should historical transactions be handled after a balance is settled?
- How can different operations update balances without creating inconsistent states?

Working through these challenges helped me develop a deeper understanding of **relational database design, balance calculations, transaction flows, state consistency, and backend architecture** beyond basic CRUD operations.

## 🚀 How to Run the Application

### Prerequisites

Make sure you have the following installed:

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js and npm](https://nodejs.org/)

### 1. Clone the Repository

```bash
git clone https://github.com/Vansh190804/Split-Wise-Clone.git
cd Split-Wise-Clone
```

### 2. Configure Environment Variables

Create your local `.env` file from the provided example.

**Windows (PowerShell)**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Update `.env` with the required configuration and credentials, including your database password, application secret, Google OAuth credentials, Supabase credentials, and Resend API key.

> **Note:** Never commit your actual `.env` file or expose your secret credentials publicly.

### 3. Start the Backend and Database

From the project root, run:

```bash
docker compose up --build
```

This starts the **FastAPI backend** and **PostgreSQL database** in separate Docker containers.

Once running, the backend API and interactive documentation are available at:

- **API:** [http://localhost:8000](http://localhost:8000)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, typically:

**[http://localhost:5173](http://localhost:5173)**

Ensure the frontend API configuration in `Frontend/src/api/axios.ts` points to:

```text
http://localhost:8000
```
