# API Integration Guide

## Backend API Integration

This project has been integrated with the backend API endpoints as shown in the Swagger documentation at `http://localhost:8080/swagger-ui/index.html`.

### Environment Configuration

To configure the API base URL, create a `.env.local` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Available API Endpoints

The following endpoints have been integrated:

- **POST /api/user/login** - User login
- **POST /api/user/register** - User registration
- **GET /api/user/{id}** - Get user profile
- **PUT /api/user/{id}** - Update user profile
- **DELETE /api/user/{id}** - Delete user
- **GET /api/user** - Get all users
- **POST /api/user** - Create user
- **GET /api/user/home** - Get home data

### Implementation Details

1. **API Service**: Created `src/services/api.ts` with centralized API calls
2. **Login Component**: Updated to use `/api/user/login` endpoint
3. **Register Component**: Updated to use `/api/user/register` endpoint
4. **Error Handling**: Proper error handling with user-friendly messages
5. **Loading States**: Loading indicators during API calls
6. **Token Management**: Automatic token storage and management

### Usage

1. Start the backend server on `http://localhost:8080`
2. Set the environment variable `VITE_API_BASE_URL=http://localhost:8080`
3. Run the frontend application
4. Users can now login and register using the backend API

### Features

- ✅ Login with email/username and password
- ✅ User registration
- ✅ Error handling and validation
- ✅ Loading states
- ✅ Token-based authentication
- ✅ Automatic redirect after successful authentication
