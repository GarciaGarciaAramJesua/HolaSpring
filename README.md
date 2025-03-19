# Spring Boot Authentication Project

In this project, you can find a complete Spring Boot application with JWT authentication and role-based authorization. This project provides a RESTful API for user management with various endpoints.

## Authentication API

The application provides several endpoints for user authentication and management:

**URL**: `/auth/register`
**Method**: `POST`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | username      |  required | String   | The username for the new account  |
> | password      |  required | String   | The password for the new account  |
> | firstName      |  required | String   | The first name of the user  |
> | lastName      |  required | String   | The last name of the user  |
> | country      |  required | String   | The country of the user  |
> | role      |  optional | String   | The role for the user (defaults to USER if not specified)  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `400`         | `application/json`    | `{"Error":"Error message"}` |
> | `200`         | `application/json`    | `Success response (empty)`                      |

**Example request**:
```js
{
  "username": "john.doe",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "country": "USA",
  "role": "USER"
}
```

---
**URL**: `/auth/login`
**Method**: `POST`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | username      |  required | String   | The username for authentication  |
> | password      |  required | String   | The password for authentication  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `401`         | `application/json`    | `null` (Authentication failed) |
> | `200`         | `application/json`    | `{"token": "JWT_TOKEN"}`                      |

**Example request**:
```js
{
  "username": "john.doe",
  "password": "securepassword123"
}
```

**Example response**:
```js
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---
**URL**: `/api/info`
**Method**: `GET`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | Authorization      |  required | String   | The JWT token in header (Bearer token)  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `401`         | `application/json`    | Unauthorized (invalid token) |
> | `200`         | `application/json`    | User information and token claims |

**Example response**:
```js
{
  "claims": {
    "sub": "john.doe",
    "iat": 1709705342,
    "exp": 1709708942,
    "roles": ["USER"]
  },
  "usuario": {
    "id": 1,
    "username": "john.doe",
    "firstName": "John",
    "lastName": "Doe",
    "country": "USA",
    "roles": ["USER"]
  }
}
```

---
**URL**: `/api/admin/all-info`
**Method**: `GET`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | Authorization      |  required | String   | The JWT token in header (Bearer token with ADMIN role)  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `401`         | `application/json`    | Unauthorized (invalid token) |
> | `403`         | `application/json`    | Forbidden (not an admin) |
> | `200`         | `application/json`    | List of all users |

**Example response**:
```js
[
  {
    "username": "john.doe",
    "firstname": "John",
    "lastname": "Doe",
    "country": "USA",
    "role": "USER"
  },
  {
    "username": "admin.user",
    "firstname": "Admin",
    "lastname": "User",
    "country": "Canada",
    "role": "ADMIN"
  }
]
```

---
**URL**: `/api/update`
**Method**: `PUT`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | Authorization      |  required | String   | The JWT token in header (Bearer token)  |
> | UserDto      |  required | Object   | User data to update  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `401`         | `application/json`    | Unauthorized (invalid token) |
> | `200`         | `application/json`    | Updated user information and new token |

**Example request**:
```js
{
  "username": "john.doe",
  "firstname": "Johnny",
  "lastname": "Doe",
  "country": "Canada"
}
```

**Example response**:
```js
{
  "user": {
    "id": 1,
    "username": "john.doe",
    "firstName": "Johnny",
    "lastName": "Doe",
    "country": "Canada",
    "roles": ["USER"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---
**URL**: `/api/admin/update/{username}`
**Method**: `PUT`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | Authorization      |  required | String   | The JWT token in header (Bearer token with ADMIN role)  |
> | username      |  required | String   | Username of the user to update (in URL)  |
> | UserDto      |  required | Object   | User data to update  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `401`         | `application/json`    | Unauthorized (invalid token) |
> | `403`         | `application/json`    | Forbidden (not an admin) |
> | `200`         | `application/json`    | Updated user information |

**Example request**:
```js
{
  "firstname": "John",
  "lastname": "Smith",
  "country": "UK",
  "role": "ADMIN"
}
```

**Example response**:
```js
{
  "user": {
    "id": 1,
    "username": "john.doe",
    "firstName": "John",
    "lastName": "Smith",
    "country": "UK",
    "roles": ["ADMIN"]
  }
}
```

---
**URL**: `/api/admin/delete/{username}`
**Method**: `DELETE`
**Parameters**:
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | Authorization      |  required | String   | The JWT token in header (Bearer token with ADMIN role)  |
> | username      |  required | String   | Username of the user to delete (in URL)  |

**Responses**:

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `401`         | `application/json`    | Unauthorized (invalid token) |
> | `403`         | `application/json`    | Forbidden (not an admin) |
> | `200`         | `application/json`    | Empty response (success) |

## Project Structure

The project follows a standard Spring Boot architecture:

- `auth` package: Contains authentication controllers
- `config` package: Contains security configuration
- `controllers` package: REST and view controllers
- `dtos` package: Data Transfer Objects
- `model` package: Entity classes
- `repository` package: Data access layer
- `service` package: Business logic

## Security Configuration

The security configuration uses JWT (JSON Web Token) for authentication:

- Tokens are valid for 1 hour (3,600,000 milliseconds)
- Passwords are encrypted using BCrypt
- API endpoints are secured by role-based authorization
- Web views are accessible under the `/view` path

## Installation

To run the application, you need:

1. Java 21 or higher
2. MySQL database

Configure your database connection in a `.env` file:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/your_database_name?useSSL=false&serverTimezone=UTC
spring.datasource.username=your_database_username
spring.datasource.password=your_database_password
```
To build and run with Docker Compose:

```sh
docker-compose up --build
```

## Views

The application provides the following views:

- `/view/my-profile` - User profile page
- `/view/admin/all-users` - Admin page to manage users

## Default Admin User

Por defecto, se carga un usuario administrador con las siguientes credenciales:

- **Username**: `sudo`
- **Lastname**: `user`
- **Firstname**: `super`
- **Country**: `not defined`
- **Password**: `password` (encriptada con BCrypt)
- **Role**: `ROLE_ADMIN`

Puedes utilizar estas credenciales para probar las funcionalidades de administrador.

## Screenshots

Here are some screenshots of the application (You can find more in `screenshots/Tarea3&Practica1/` route)

### User Registration
![User Registration](./screenshots/Tarea3&Practica1/sign_up.png)

### All Users
![All Users](./screenshots/Tarea3&Practica1/panel_users.png)

### New Users Form
![All Users](./screenshots/Tarea3&Practica1/add_new_users.png)

### User Profile
![User Profile](./screenshots/Tarea3&Practica1/personal_info.png)

### Login
![Login](./screenshots/Tarea3&Practica1/login.png)
