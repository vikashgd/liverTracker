# 🚨 MANDATORY DATA PROTECTION RULES

## ⛔ **ABSOLUTE PROHIBITIONS**

### 🔒 **NEVER MODIFY WITHOUT EXPLICIT PERMISSION:**
1. `prisma/schema.prisma` - Database schema changes
2. Any migration files in `prisma/migrations/`
3. Database connection strings in `.env` files
4. Any commands that run `prisma migrate` or `prisma db push`

### 🚫 **FORBIDDEN ACTIONS:**
- Running database migrations automatically
- Modifying existing database tables
- Adding new database tables without explicit user consent
- Running `npx prisma migrate dev`
- Running `npx prisma db push`
- Any schema changes that could trigger migrations

## ✅ **REQUIRED PROCESS FOR SCHEMA CHANGES**

### **BEFORE ANY DATABASE MODIFICATION:**
1. **STOP** - Ask explicit permission from user
2. **EXPLAIN** exactly what will be changed and why
3. **WARN** about potential data loss risks
4. **BACKUP** - Create data backup strategy
5. **CONFIRM** - Get written confirmation from user
6. **TEST** - Use separate test database first

### **SCHEMA CHANGE APPROVAL TEMPLATE:**
```
🚨 DATABASE SCHEMA CHANGE REQUEST

WHAT: [Describe exact changes]
WHY: [Explain necessity]
RISK: [Data loss potential - HIGH/MEDIUM/LOW]
BACKUP: [Backup strategy]
ROLLBACK: [How to undo changes]

⚠️  This change requires database migration
⚠️  Potential for data loss exists
⚠️  User data backup recommended

PROCEED? [YES/NO - User must explicitly confirm]
```

## 🔧 **SAFE IMPLEMENTATION PATTERNS**

### **FOR NEW FEATURES:**
1. Create separate API endpoints (✅ SAFE)
2. Add new components (✅ SAFE)
3. Add new pages (✅ SAFE)
4. Modify existing UI without schema changes (✅ SAFE)

### **FOR DATABASE NEEDS:**
1. Use existing tables when possible
2. Store data in JSON fields if needed
3. Create external storage solutions
4. Use separate databases for new features

## 📋 **MANDATORY CHECKS BEFORE ANY TASK**

### **ASK THESE QUESTIONS:**
1. Does this require database schema changes?
2. Will this trigger Prisma migrations?
3. Could this affect existing user data?
4. Are we modifying core database files?

### **IF ANY ANSWER IS YES:**
- STOP immediately
- Request explicit user permission
- Follow schema change approval process
- Do NOT proceed without written confirmation

## 🛠️ **IMPLEMENTATION SAFEGUARDS**

### **Code Review Checklist:**
- [ ] No `prisma/schema.prisma` modifications
- [ ] No new migration files created
- [ ] No database connection changes
- [ ] No automatic migration triggers
- [ ] User data remains intact

### **Testing Requirements:**
- Test on separate database first
- Verify existing data is unaffected
- Confirm rollback procedures work
- Document all changes made

## 🚨 **EMERGENCY PROCEDURES**

### **IF DATA LOSS OCCURS:**
1. Immediately stop all operations
2. Document what happened
3. Attempt data recovery from backups
4. Inform user immediately
5. Create incident report
6. Update protection rules

### **INCIDENT REPORTING:**
- What caused the data loss?
- What rules were violated?
- How can we prevent this in future?
- What additional safeguards are needed?

## 📝 **DEVELOPER COMMITMENT**

**I COMMIT TO:**
- Never modify database schema without explicit permission
- Always ask before making changes that could affect data
- Follow the approval process for any database modifications
- Prioritize data protection over feature implementation
- Stop and ask when in doubt about data safety

**VIOLATION OF THESE RULES IS UNACCEPTABLE**

---
*These rules are mandatory and non-negotiable. User data protection is the highest priority.*