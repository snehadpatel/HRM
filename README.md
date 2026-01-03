# Dayflow HRMS

Here is how you can set up and run the project from scratch.

## Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- PostgreSQL

## 1. Database Setup
First, make sure your PostgreSQL server is running. You need to create a database named `dayflow`.
If you are on Mac, you can likely just run this in your terminal:

```bash
createdb dayflow
```

*Note: The settings are configured for my user `snehapatel` with no password on localhost:5432. If your config is different, check `backend/dayflow/settings.py`.*

## 2. Backend Setup
Open a terminal and go to the backend folder:

```bash
cd backend
```

Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Run the database migrations:
```bash
python manage.py migrate
```

**Important:** Populate the database with test data (Users, Employees, Attendance, etc.):
```bash
python seed_data.py
```

Finally, start the server:
```bash
python manage.py runserver
```
It should run on `http://localhost:8000`.

## 3. Frontend Setup
Open a **new key terminal window** (keep the backend running) and go to the frontend folder:

```bash
cd frontend
```

Install the packages:
```bash
npm install
```

Start the dev server:
```bash
npm run dev
```
It should run on `http://localhost:5173`.

## 4. Login Credentials
Once both servers are running, open `http://localhost:5173` in your browser.

Use these accounts to log in:

**Admin Access** (Full access to settings, payroll, etc.)
- Email: `admin@dayflow.com`
- Password: `admin123`

**HR Access** (Manage employees, attendance)
- Email: `hr@dayflow.com`
- Password: `hr123`

**Employee Access** (View profile, request leave)
- Email: `john.doe@dayflow.com`
- Password: `employee123`