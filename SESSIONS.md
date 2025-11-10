# Chat Sessions Feature

## Overview
The application now supports persistent chat sessions with full message history and conversation tree preservation.

## Features

### ✅ Session Management
- **Auto-save**: Messages and conversation trees are automatically saved 1 second after changes
- **Persistent Storage**: Sessions stored in `data/sessions.json` (survives server restarts)
- **Multiple Sessions**: Create and manage unlimited chat sessions
- **Session Titles**: Auto-generated from first user message

### ✅ Sessions List Panel
- **View All Sessions**: See all your saved conversations
- **Session Preview**: Shows title, last updated time, and message count
- **Quick Actions**: Load or delete sessions with one click
- **Real-time Updates**: List updates when sessions are created/deleted

### ✅ Session Operations

#### Create New Session
- Click "➕ New Chat" button in sessions panel
- Automatically creates empty session
- Previous session is auto-saved

#### Load Session
- Click any session in the list to load it
- Messages and conversation tree are restored
- Continue from where you left off

#### Delete Session
- Hover over session and click 🗑️ icon
- Confirmation dialog prevents accidental deletion
- If current session is deleted, creates new empty session

## UI Layout

### Right Sidebar (Toggle with button in top-right)
Three tabs:
1. **💬 Chats** - Sessions list and management
2. **📊 Stats** - Learning progress tracker
3. **🌳 Info** - Information about tree visualizations

### Main Chat Area
- **Top Left**: 📜 Conversation Flow (linear timeline)
- **Center**: Chat interface with messages
- **Bottom**: 🗺️ Learning Path Tree (branching conversations)

## Data Storage

### Files
- `data/sessions.json` - All chat sessions
- `data/users.json` - User accounts

### Session Data Structure
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "title": "First message preview...",
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user|assistant",
      "content": "message text",
      "timestamp": "ISO-8601"
    }
  ],
  "conversationTree": [],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

## API Endpoints

### GET /api/sessions
List all sessions for current user

### POST /api/sessions
Create new session
```json
{
  "title": "Session title"
}
```

### GET /api/sessions/[id]
Get specific session details

### PUT /api/sessions/[id]
Update session
```json
{
  "title": "Updated title",
  "messages": [...],
  "conversationTree": [...]
}
```

### DELETE /api/sessions/[id]
Delete session

## Security
- Sessions are user-specific (protected by authentication)
- Can only access/modify own sessions
- Session data not committed to git (in .gitignore)

## Notes
- Sessions auto-save after 1 second of inactivity
- First user message becomes session title (truncated to 50 chars)
- For production: Replace file storage with database (MongoDB, PostgreSQL, etc.)
