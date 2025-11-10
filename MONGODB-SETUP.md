# MongoDB Setup Guide

## Quick Start

### 1. MongoDB Atlas Setup (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (Free tier available)
4. Create a database user with username/password
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string

### 2. Update .env.local

Your connection string is already in `.env.local`:

```bash
MONGODB_URI=mongodb+srv://stephen:suny123456@cluster0.gdulg.mongodb.net/learning?retryWrites=true&w=majority&appName=Cluster0
```

**Security Note**: Change the password for production!

### 3. Database Collections

The app will automatically create these collections:
- `users` - User accounts
- `sessions` - Chat sessions (master)
- `messages` - Chat messages (slave)

### 4. First Run

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The app will:
   - Connect to MongoDB on first request
   - Create collections automatically
   - Store all data in MongoDB

### 5. Verify Connection

Check the terminal for:
```
✓ Connected to MongoDB
```

If you see connection errors:
- Verify MONGODB_URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has read/write permissions

## Data Migration (Optional)

If you have existing data in `data/users.json` or `data/sessions.json`:

### Option 1: Start Fresh
Just delete the `data/` folder. MongoDB starts empty.

### Option 2: Manual Migration
You would need to write a migration script to:
1. Read JSON files
2. Insert into MongoDB collections
3. Handle ID mappings

## Collection Indexes (Production)

For better performance in production, create indexes:

```javascript
// In MongoDB Atlas or mongosh
use learning;

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ id: 1 }, { unique: true });

// Sessions indexes  
db.sessions.createIndex({ userId: 1, updatedAt: -1 });
db.sessions.createIndex({ id: 1 }, { unique: true });

// Messages indexes
db.messages.createIndex({ sessionId: 1, order: 1 });
db.messages.createIndex({ id: 1 }, { unique: true });
```

## Monitoring

MongoDB Atlas Dashboard provides:
- Real-time metrics
- Query performance
- Storage usage
- Connection statistics

## Troubleshooting

### Connection Refused
- Check if MongoDB Atlas cluster is running
- Verify IP whitelist includes your IP
- Check network connectivity

### Authentication Failed
- Verify username/password in connection string
- Check database user permissions
- Ensure special characters in password are URL-encoded

### Slow Queries
- Create indexes (see above)
- Check MongoDB Atlas metrics
- Monitor connection pool usage

## Production Checklist

- [ ] Use strong database password
- [ ] Restrict IP whitelist to production IPs
- [ ] Create all recommended indexes
- [ ] Enable MongoDB Atlas backups
- [ ] Set up monitoring alerts
- [ ] Use connection pooling
- [ ] Consider read replicas for scaling

## Local MongoDB (Alternative)

If you prefer local MongoDB:

1. Install MongoDB locally
2. Start MongoDB: `mongod`
3. Update `.env.local`:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/learning
   ```

## Database Schema

See `MONGODB.md` for detailed schema documentation and master-slave relationship structure.
