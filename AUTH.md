# Authentication System

## Features

- **Sign Up**: New users can create an account with access passcode verification
- **Sign In**: Existing users can sign in with email and password
- **Protected Routes**: Main chat page requires authentication
- **Session Management**: JWT-based authentication with HTTP-only cookies

## Access Passcode

The signup page requires an `ACCESS_PASSCODE` to create new accounts. This is configured in `.env.local`:

```
ACCESS_PASSCODE=iitgoneonta
```

Users must enter this passcode during registration to create an account.

## Routes

- `/signin` - Sign in page
- `/signup` - Sign up page (requires access passcode)
- `/` - Main chat page (protected, requires authentication)

## Environment Variables

Required in `.env.local`:

```
JWT_SECRET=your-jwt-secret-key-change-this-in-production
ACCESS_PASSCODE=iitgoneonta
```

## Security Notes

- Passwords are hashed using bcryptjs
- JWT tokens are stored in HTTP-only cookies
- Session expires after 7 days
- User data is persisted in `data/users.json` file (not committed to git)
- **For production**: Replace file-based storage with a real database (MongoDB, PostgreSQL, etc.)

## Usage

1. Visit `/signup` to create an account
2. Enter your details and the access passcode: `iitgoneonta`
3. After successful signup, you'll be redirected to the main chat page
4. Sign out using the button in the header
5. Sign back in at `/signin` with your email and password
