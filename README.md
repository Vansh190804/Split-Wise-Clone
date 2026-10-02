# Split-Wise-Clone

A full-stack expense sharing application inspired by **Splitwise**, built to understand how complex expense, balance, settlement, and relationship flows work in a real-world application.

The project focuses not only on building the UI, but also on designing the **database structure and backend logic** required to correctly handle expenses between friends and within groups, settlements, balance calculations, and transaction history.

## Features

* Create and manage groups
* Add friends and manage friendships
* Create, edit, and delete expenses
* Split expenses between multiple users
* Track individual and group balances
* Settle up balances between users
* View expense and settlement history
* Google OAuth authentication

## Tech Stack

### Frontend

* **React**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui**
* **Axios**

### Backend

* **FastAPI**
* **Python**
* **SQLAlchemy**
* **PostgreSQL**
* **JWT / Google OAuth**

### Storage

* **Supabase Storage** — used for storing user and group images

## What I Wanted to Learn

This project was primarily built as a learning project to understand **complex database and backend flows that are prominent in applications like Splitwise**.

A simple expense tracker can be implemented with basic CRUD operations, but an application like this introduces more complicated problems:

* How should expenses and their individual splits be represented in a relational database?
* How should balances be calculated across multiple expenses?
* How should settlements affect existing balances and transaction history?
* How should the same two users' expenses behave when they are both inside and outside groups?
* How should historical transactions be handled after a user settles their balance?
* How should different operations affect the overall balance without creating inconsistent state?

Working through these problems helped me understand **relational database design, transaction flows, state consistency, and backend architecture** beyond straightforward CRUD APIs.
