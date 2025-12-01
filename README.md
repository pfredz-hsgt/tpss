# The Passover System - Setup Guide

**The Passover System** is an internal communication and on-call handover system designed for hospital pharmacy staff. This guide will walk you through setting up the system step by step, even if you're not familiar with coding.

---

## What You'll Need Before Starting

Before you begin, make sure you have the following installed on your computer:

1. **Node.js** (version 18 or higher)
   - What it is: A program that lets you run JavaScript applications
   - How to get it: Visit [nodejs.org](https://nodejs.org/) and download the "LTS" (Long Term Support) version
   - How to check if you have it: Open Command Prompt (Windows) or Terminal (Mac), type `node --version` and press Enter. You should see a version number like "v18.17.0"

2. **PostgreSQL** (version 15 or higher)
   - What it is: A database program that stores all the system's information
   - How to get it: Visit [postgresql.org/download](https://www.postgresql.org/download/) and download the version for your operating system
   - Important: During installation, remember the password you set for the "postgres" user (the default administrator account)

3. **A Code Editor** (optional but helpful)
   - Recommended: Visual Studio Code (free) from [code.visualstudio.com](https://code.visualstudio.com/)

4. **Command Prompt or Terminal**
   - Windows: Press `Windows Key + R`, type `cmd`, press Enter
   - Mac: Press `Command + Space`, type `Terminal`, press Enter

---

## Step 1: Download and Prepare the Project

1. **Get the project files**
   - If you have the files in a ZIP folder, extract them to a location you can easily find (like `C:\tpss` or `D:\tpss` on Windows, or `~/tpss` on Mac)
   - Make note of where you saved the folder - you'll need to navigate there later

2. **Open Command Prompt or Terminal**
   - Navigate to the project folder:
     - **Windows**: Type `cd D:\tpss` (or wherever you saved it) and press Enter
     - **Mac/Linux**: Type `cd ~/tpss` (or wherever you saved it) and press Enter
   - You should see the prompt change to show you're in the tpss folder

---

## Step 2: Set Up PostgreSQL Database

The database is where all the system's data (users, announcements, passovers, etc.) will be stored.

### 2.1: Create the Database

1. **Open Command Prompt or Terminal**

2. **Connect to PostgreSQL**:
   - Type the following command and press Enter:
     ```
     psql -U postgres
     ```
   - When prompted, enter the password you set during PostgreSQL installation
   - If successful, you'll see `postgres=#` which means you're connected

3. **Create the database**:
   - Type the following command and press Enter:
     ```sql
     CREATE DATABASE tpss;
     ```
   - You should see "CREATE DATABASE" as confirmation

4. **Exit PostgreSQL**:
   - Type `\q` and press Enter to exit

### 2.2: Verify the Database Was Created

1. **Check that the database exists**:
   - Type: `psql -U postgres -l` and press Enter
   - Enter your password when prompted
   - You should see "tpss" in the list of databases

---

## Step 3: Set Up the Backend (Server)

The backend is the part of the system that handles all the logic, connects to the database, and provides the API.

### 3.1: Navigate to the Backend Folder

1. **Open Command Prompt or Terminal**

2. **Go to the backend folder**:
   ```
   cd backend
   ```
   - Make sure you're in the main project folder first (tpss), then type this command

### 3.2: Install Required Packages

1. **Install all necessary components**:
   - Type the following and press Enter:
     ```
     npm install
     ```
   - **What this does**: Downloads and installs all the code libraries the system needs to run
   - **How long it takes**: Usually 1-3 minutes, depending on your internet speed
   - **What you'll see**: Lots of text scrolling by - this is normal! Wait until you see a message like "added 204 packages" or until the prompt returns (showing you can type again)

### 3.3: Set Up Environment Variables

Environment variables are settings that tell the system how to connect to your database and other important information.

1. **Check if the .env file exists**:
   - In the backend folder, look for a file named `.env`
   - If it doesn't exist, you'll need to create it (see below)

2. **Create or edit the .env file**:
   - Open the `.env` file in a text editor (like Notepad on Windows or TextEdit on Mac)
   - Make sure it contains the following lines (replace with your actual database password if different):
     ```
     DATABASE_URL="postgresql://postgres:user@localhost:5432/tpss?schema=public"
     JWT_SECRET="your-secret-key-change-in-production"
     JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
     PORT=3001
     NODE_ENV=development
     FRONTEND_URL="http://localhost:3000"
     ```
   - **Important**: 
     - If your PostgreSQL password is NOT "user", change `user` in the DATABASE_URL to your actual password
     - Save the file after making changes

### 3.4: Set Up the Database Tables

1. **Generate the database structure**:
   - Make sure you're still in the backend folder in Command Prompt/Terminal
   - Type the following and press Enter:
     ```
     npm run prisma:generate
     ```
   - **What this does**: Creates the code needed to talk to the database
   - **Expected result**: You should see "✔ Generated Prisma Client" when it's done

2. **Create the database tables**:
   - Type the following and press Enter:
     ```
     npm run prisma:migrate
     ```
   - **What this does**: Creates all the tables in your database (User, Announcement, Passover, etc.)
   - **Expected result**: You should see "Your database is now in sync with your schema"
   - **Note**: If it asks "Enter a name for the new migration:", just type `init` and press Enter

### 3.5: Start the Backend Server

1. **Start the server**:
   - Make sure you're in the backend folder
   - Type the following and press Enter:
     ```
     npm run dev
     ```
   - **What this does**: Starts the backend server so it can receive requests
   - **Expected result**: You should see a message like "Server running on port 3001"
   - **Important**: Keep this window open! The server needs to keep running for the system to work

2. **Test that it's working**:
   - Open a web browser
   - Go to: `http://localhost:3001/health`
   - You should see: `{"status":"ok","timestamp":"..."}`
   - If you see this, the backend is working correctly!

---

## Step 4: Set Up the Frontend (User Interface)

The frontend is what users see and interact with in their web browser.

### 4.1: Open a New Command Prompt or Terminal Window

**Important**: Keep the backend server running in its own window, and open a NEW window for the frontend.

1. **Open a new Command Prompt or Terminal**

2. **Navigate to the frontend folder**:
   ```
   cd D:\tpss\frontend
   ```
   (Adjust the path to where your project is located)

### 4.2: Install Required Packages

1. **Install all necessary components**:
   - Type the following and press Enter:
     ```
     npm install
     ```
   - **What this does**: Downloads and installs all the code libraries the frontend needs
   - **How long it takes**: Usually 2-5 minutes
   - Wait until the installation completes

### 4.3: Set Up Environment Variables

1. **Create the .env.local file**:
   - In the frontend folder, create a new file named `.env.local`
   - Open it in a text editor

2. **Add the following line**:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
   - **What this does**: Tells the frontend where to find the backend server
   - Save the file

### 4.4: Start the Frontend Server

1. **Start the frontend**:
   - Make sure you're in the frontend folder
   - Type the following and press Enter:
     ```
     npm run dev
     ```
   - **What this does**: Starts the web server that serves the user interface
   - **Expected result**: You should see a message like "Ready on http://localhost:3000"
   - **Important**: Keep this window open too!

2. **Open the application**:
   - Open a web browser
   - Go to: `http://localhost:3000`
   - You should see the login page for "The Passover System"

---

## Step 5: Create Your First Admin User

Before you can use the system, you need to create an administrator account. Since user registration requires admin privileges, you'll need to create the first admin user directly in the database.

### Option A: Using the Create Admin Script (Easiest Method - Recommended)

This is the simplest way to create the admin user. The script will automatically create a user with:
- **Username**: `admin`
- **Password**: `admin`
- **Role**: `ADMIN`

1. **Open Command Prompt or Terminal**

2. **Navigate to the backend folder**:
   ```
   cd D:\tpss\backend
   ```
   (Adjust the path to where your project is located)

3. **Run the create admin script**:
   ```
   npm run create-admin
   ```
   - **What this does**: Creates an admin user in the database with username "admin" and password "admin"
   - **Expected result**: You should see a success message with the user details
   - **Note**: If the admin user already exists, it will tell you and won't create a duplicate

4. **You're done!** You can now log in with:
   - Username: `admin`
   - Password: `admin`

### Option B: Using Prisma Studio (Alternative Method)

1. **Open a new Command Prompt or Terminal**

2. **Navigate to the backend folder**:
   ```
   cd D:\tpss\backend
   ```

3. **Start Prisma Studio**:
   ```
   npm run prisma:studio
   ```
   - This will open a web interface in your browser (usually at `http://localhost:5555`)

4. **Create a user**:
   - Click on the "User" model in the left sidebar
   - Click the "Add record" button
   - Fill in the fields:
     - **id**: Leave blank (will be generated automatically)
     - **username**: Choose a username (e.g., "admin")
     - **password**: You need to hash this first (see below)
     - **email**: Your email (optional)
     - **fullName**: Your full name
     - **role**: Select "ADMIN" from the dropdown
     - **createdAt**: Leave blank (will be set automatically)
     - **updatedAt**: Leave blank (will be set automatically)

5. **Hash the password**:
   - You need to hash your password before saving it
   - Open a new Command Prompt/Terminal
   - Navigate to backend folder: `cd D:\tpss\backend`
   - Run: `node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourpassword', 10).then(hash => console.log(hash));"`
   - Replace `yourpassword` with your desired password
   - Copy the long string that appears (this is your hashed password)
   - Paste it into the password field in Prisma Studio
   - Click "Save 1 change"

### Option B: Using SQL (Alternative Method)

1. **Connect to PostgreSQL**:
   ```
   psql -U postgres -d tpss
   ```
   - Enter your password when prompted

2. **Hash your password** (use the same command as in Option A to get the hash)

3. **Insert the admin user**:
   ```sql
   INSERT INTO "User" (id, username, password, "fullName", role, "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid()::text,
     'admin',
     'PASTE_YOUR_HASHED_PASSWORD_HERE',
     'Administrator',
     'ADMIN',
     NOW(),
     NOW()
   );
   ```
   - Replace `PASTE_YOUR_HASHED_PASSWORD_HERE` with the hashed password from step 2
   - Press Enter

4. **Verify the user was created**:
   ```sql
   SELECT username, "fullName", role FROM "User";
   ```
   - You should see your new admin user

5. **Exit PostgreSQL**:
   ```sql
   \q
   ```

---

## Step 6: Log In and Start Using the System

1. **Open your web browser**

2. **Go to**: `http://localhost:3000`

3. **Log in**:
   - Enter the username you created (e.g., "admin")
   - Enter the password you set (the original password, NOT the hash)
   - Click "Sign in"

4. **You're in!** You should now see the home page of The Passover System

---

## Running the System Daily

Every time you want to use the system:

1. **Start PostgreSQL** (if it's not running as a service):
   - Usually PostgreSQL runs automatically in the background
   - If not, start it from the Start Menu (Windows) or Applications (Mac)

2. **Start the Backend**:
   - Open Command Prompt/Terminal
   - Navigate to: `cd D:\tpss\backend`
   - Run: `npm run dev`
   - Keep this window open

3. **Start the Frontend**:
   - Open a NEW Command Prompt/Terminal window
   - Navigate to: `cd D:\tpss\frontend`
   - Run: `npm run dev`
   - Keep this window open

4. **Open your browser** and go to `http://localhost:3000`

---

## Troubleshooting Common Issues

### Problem: "Command not found" or "npm is not recognized"

**Solution**: Node.js is not installed or not in your system PATH
- Reinstall Node.js from [nodejs.org](https://nodejs.org/)
- Make sure to check "Add to PATH" during installation
- Restart your computer after installation

### Problem: "Cannot connect to database" or "password authentication failed"

**Solution**: Check your database connection settings
- Verify PostgreSQL is running
- Check that the password in `.env` file matches your PostgreSQL password
- Make sure the database "tpss" exists

### Problem: "Port 3000 already in use" or "Port 3001 already in use"

**Solution**: Another program is using that port
- Close any other applications that might be using those ports
- Or change the PORT in backend/.env to a different number (like 3002)
- Update FRONTEND_URL and NEXT_PUBLIC_API_URL accordingly

### Problem: "Module not found" errors

**Solution**: Dependencies weren't installed correctly
- Delete the `node_modules` folder in the problematic directory
- Run `npm install` again

### Problem: Can't see the .env file

**Solution**: Hidden files might not be visible
- **Windows**: In File Explorer, go to View → Show → Hidden items
- **Mac**: In Finder, press `Command + Shift + .` (period) to show hidden files

### Problem: Backend starts but frontend can't connect

**Solution**: Check that both servers are running
- Make sure backend is running on port 3001
- Make sure frontend .env.local has the correct API URL
- Check that there are no firewall blocks

---

## Getting Help

If you encounter issues not covered here:

1. **Check the error messages** - They often tell you exactly what's wrong
2. **Verify all steps** - Make sure you completed each step correctly
3. **Check file paths** - Make sure you're in the correct folders when running commands
4. **Restart everything** - Sometimes stopping and restarting the servers helps

---

## What's Next?

Once the system is running:

1. **Create more users** through the Admin panel (after logging in as admin)
2. **Set up categories** for announcements (TDM, TPN, SPUB, Transport, Clinical)
3. **Create groups** and assign users to them
4. **Start using the system** for announcements and passovers!

---

## Important Notes

- **Keep servers running**: Both the backend and frontend servers must be running for the system to work
- **Database must be running**: PostgreSQL must be running for the system to store and retrieve data
- **Security**: Change the JWT_SECRET and JWT_REFRESH_SECRET in production to strong, random values
- **Backups**: Regularly backup your PostgreSQL database to prevent data loss

---

## System Overview

**The Passover System** consists of:

- **Frontend** (what users see): Next.js web application running on port 3000
- **Backend** (the brain): Express.js API server running on port 3001  
- **Database** (the memory): PostgreSQL database named "tpss"

All three components work together to provide the complete system.
