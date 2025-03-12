# MERN Stack Chat Application

A full-stack real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

The project is organized into two main directories:

### Backend
- Located in the `/backend` directory
- Node.js/Express server
- MongoDB database connection
- API routes for authentication, messages, friends, users, and group chats
- File upload functionality

### Frontend
- Located in the `/frontend` directory
- React-based user interface
- Responsive design for desktop and mobile
- Real-time messaging capabilities

## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
   This will install dependencies for the root project, backend, and frontend.

3. Set up environment variables:
   Create a `.env` file in the backend directory with the following:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

4. Start the development server:
   ```
   npm run dev
   ```
   This will start both the backend server and frontend client concurrently.

## Features
- User authentication
- Real-time messaging
- Friend management
- Group chats
- File uploads

## Author
Joseph Bec