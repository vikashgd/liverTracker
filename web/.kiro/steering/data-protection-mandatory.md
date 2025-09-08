---
inclusion: always
---

# 🚨 MANDATORY DATA PROTECTION RULES

## ⛔ ABSOLUTE PROHIBITIONS - NEVER DO THESE:

1. **NEVER modify `prisma/schema.prisma` without explicit user permission**
2. **NEVER run database migrations automatically**
3. **NEVER use `npx prisma migrate` or `npx prisma db push`**
4. **NEVER modify existing database tables**
5. **NEVER add new database tables without user consent**

## 🛡️ REQUIRED PROCESS FOR ANY DATABASE CHANGES:

**BEFORE making ANY schema changes:**
1. **STOP** - Ask explicit permission
2. **EXPLAIN** exactly what will change
3. **WARN** about data loss risks
4. **GET WRITTEN CONFIRMATION** from user
5. **BACKUP** data first
6. **TEST** on separate database

## ✅ SAFE OPERATIONS (No Permission Needed):
- Adding new API endpoints
- Creating new React components
- Adding new pages
- Modifying UI without schema changes
- Adding new utility functions

## 🚨 DANGEROUS OPERATIONS (Require Permission):
- Any changes to `prisma/schema.prisma`
- Creating migration files
- Database schema modifications
- Adding new database tables/columns

**USER DATA PROTECTION IS THE HIGHEST PRIORITY**