# Task Flow API Documentation

**Base URL (Local):** `http://localhost:5000/api`  
**Base URL (Production):** `https://YOUR-RENDER-URL.onrender.com/api`

---

## 🔐 Admin APIs
**Base:** `/api/admin`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Admin login | Public |
| GET | `/profile` | Get admin profile | Admin Token |

### Login Request
```json
{
    "email": "admin@gmail.com",
    "password": "task123"
}
```

---

## 👔 Manager APIs
**Base:** `/api/managers`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Manager login | Public |
| GET | `/profile` | Get manager profile | Manager Token |
| POST | `/` | Create manager | Admin Token |
| GET | `/` | Get all managers | Admin Token |
| GET | `/:id` | Get manager by ID | Admin Token |
| PUT | `/:id` | Update manager | Admin Token |
| DELETE | `/:id` | Delete manager | Admin Token |

### Create Manager
```json
{
    "name": "John Smith",
    "email": "john@company.com",
    "password": "manager123",
    "company": "Tech Corp",
    "contactNumber": "+1234567890"
}
```

---

## 👤 Employee APIs
**Base:** `/api/employees`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Employee login | Public |
| GET | `/profile` | Get employee profile | Employee Token |
| POST | `/` | Create employee | Admin Token |
| GET | `/` | Get all employees | Admin Token |
| GET | `/:id` | Get employee by ID | Admin Token |
| PUT | `/:id` | Update employee | Admin Token |
| DELETE | `/:id` | Delete employee | Admin Token |

### Create Employee
```json
{
    "name": "Emily Davis",
    "email": "emily@company.com",
    "password": "employee123",
    "contactNumber": "+1234567890",
    "designation": "Senior Developer"
}
```

---

## 📁 Project APIs
**Base:** `/api/projects`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create project & assign employees | Manager Token |
| GET | `/` | Get projects (Admin: all, Manager: own, Employee: assigned) | Any Token |
| GET | `/:id` | Get project by ID | Any Token |
| PUT | `/:id` | Update project | Manager Token (own only) |
| DELETE | `/:id` | Delete project | Manager Token (own only) |

### Create Project
```json
{
    "projectName": "Website Redesign",
    "description": "Complete website overhaul",
    "clientName": "ABC Corp",
    "clientPhone": "+1234567890",
    "location": "New York",
    "assignedEmployees": ["employee_id_1", "employee_id_2"],
    "deadline": "2026-03-15"
}
```

---

## ✅ Task APIs
**Base:** `/api/tasks`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/project/:projectId` | Create task under project | Manager Token |
| GET | `/my-tasks` | Get all tasks assigned to employee | Employee Token |
| GET | `/project/:projectId` | Get tasks by project (Manager: all, Employee: assigned only) | Any Token |
| GET | `/:id` | Get task by ID | Any Token |
| PUT | `/:id` | Update task (Manager: full, Employee: status only) | Manager/Employee Token |
| DELETE | `/:id` | Delete task | Manager Token (own only) |

### Create Task
**URL:** `POST /api/tasks/project/:projectId`
```json
{
    "taskName": "Design Homepage",
    "description": "Create new homepage design mockups",
    "assignedEmployee": "employee_id",
    "deadline": "2026-02-20"
}
```

### Update Task Status (Employee)
```json
{
    "status": "In Progress"
}
```
**Valid Status Values:** `Pending`, `In Progress`, `Completed`

---

## 🔑 Using Tokens
1. Login to get a token
2. Add header: `Authorization: Bearer YOUR_TOKEN_HERE`

---

## 🚀 Render Deployment

### Environment Variables (Set in Render Dashboard)
| Variable | Value |
|----------|-------|
| `MONGO_URI` | `mongodb+srv://username:password@cluster.mongodb.net/task-flow` |
| `JWT_SECRET` | `your_strong_secret_key_here` |
| `JWT_EXPIRES_IN` | `1d` |
| `NODE_ENV` | `production` |

### Build Command
```
npm install
```

### Start Command
```
npm start
```
