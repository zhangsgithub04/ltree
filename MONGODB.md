# MongoDB Integration - Master-Slave Collections

## Overview
The application now uses MongoDB with a master-slave (parent-child) collection structure for efficient data management and scalability.

## Database Structure

### Collections

#### 1. **users** (Master Collection)
Stores user account information.

```javascript
{
  _id: ObjectId,
  id: "uuid",
  email: "user@example.com",
  name: "John Doe",
  password: "hashed_password",
  createdAt: Date
}
```

#### 2. **sessions** (Master Collection)
Stores chat session metadata.

```javascript
{
  _id: ObjectId,
  id: "uuid",
  userId: "user-uuid",           // Reference to users collection
  title: "Session title",
  conversationTree: [...],       // Tree structure for branching conversations
  createdAt: Date,
  updatedAt: Date,
  messageCount: 10               // Denormalized count for performance
}
```

#### 3. **messages** (Slave Collection)
Stores individual messages belonging to sessions.

```javascript
{
  _id: ObjectId,
  id: "uuid",
  sessionId: "session-uuid",     // Reference to parent session (SLAVE)
  role: "user|assistant",
  content: "Message text",
  timestamp: Date,
  order: 0                       // Maintains message order within session
}
```

## Master-Slave Relationship

### Session (Master) ← Messages (Slave)

- **One-to-Many**: One session has many messages
- **Cascade Delete**: When a session is deleted, all its messages are deleted
- **Order Maintenance**: Messages use `order` field to maintain sequence
- **Denormalization**: `messageCount` in sessions for quick access

### Benefits

1. **Scalability**: Messages can grow independently without bloating session documents
2. **Performance**: Queries can fetch sessions without loading all messages
3. **Flexibility**: Easy to add message-level features (reactions, edits, etc.)
4. **Data Integrity**: Cascade deletes maintain referential integrity

## Key Operations

### Create Session
```typescript
const session = await createSession(userId, "New Chat");
// Creates master record in sessions collection
```

### Add Message
```typescript
await addMessage(sessionId, {
  id: "msg-uuid",
  role: "user",
  content: "Hello!"
});
// Creates slave record in messages collection
// Updates parent session's messageCount and updatedAt
```

### Get Session with Messages
```typescript
const { session, messages } = await getSessionWithMessages(sessionId);
// Fetches master record and all related slave records
// Messages sorted by order field
```

### Update Session
```typescript
await updateSession(sessionId, {
  title: "Updated Title",
  messages: [...],              // Only inserts new messages
  conversationTree: [...]
});
// Updates master record
// Inserts only new messages (checks existing by ID)
```

### Delete Session
```typescript
await deleteSession(sessionId);
// 1. Deletes all messages (slaves) for this session
// 2. Deletes session (master) record
```

## Indexes (Recommended for Production)

```javascript
// sessions collection
db.sessions.createIndex({ userId: 1, updatedAt: -1 });
db.sessions.createIndex({ id: 1 }, { unique: true });

// messages collection
db.messages.createIndex({ sessionId: 1, order: 1 });
db.messages.createIndex({ id: 1 }, { unique: true });

// users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ id: 1 }, { unique: true });
```

## Environment Variables

Required in `.env.local`:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learning?retryWrites=true&w=majority
```

## Migration from File-based Storage

The old `data/users.json` and `data/sessions.json` files are no longer used. All data is now in MongoDB:

- **users.json** → **users** collection
- **sessions.json** → **sessions** + **messages** collections (split)

## Connection Management

- **Development**: Uses global connection to survive hot reloads
- **Production**: Creates new connection per deployment
- **Connection Pooling**: Handled by MongoDB driver
- **Database Name**: `learning`

## Querying Examples

### Get All User Sessions
```typescript
const sessions = await getUserSessions(userId);
// Returns sessions sorted by updatedAt (newest first)
```

### Get Session Messages
```typescript
const messages = await getSessionMessages(sessionId);
// Returns messages sorted by order (chronological)
```

### Get Full Session Data
```typescript
const { session, messages } = await getSessionWithMessages(sessionId);
// Single query for session + join query for messages
```

## Performance Considerations

1. **Denormalized Count**: `messageCount` avoids expensive count queries
2. **Indexed Queries**: All queries use indexed fields
3. **Selective Loading**: Fetch sessions without messages for listing
4. **Batch Inserts**: New messages inserted in batches
5. **Order Field**: Faster than sorting by timestamp

## Data Consistency

- **Atomic Updates**: Session updates are atomic
- **Transaction Support**: Available for critical operations
- **Cascade Deletes**: Implemented at application level
- **Duplicate Prevention**: Checks existing message IDs before insert

## Backup & Recovery

MongoDB Atlas provides:
- Automated backups
- Point-in-time recovery
- Cross-region replication
- Disaster recovery options

## Future Enhancements

Potential improvements:
- Add indexes for full-text search on messages
- Implement soft deletes for sessions/messages
- Add message reactions/edits as sub-collections
- Implement sharding for horizontal scaling
- Add caching layer (Redis) for frequently accessed sessions
