# Troubleshooting Guide - Temperature Monitoring

## Common Issues and Solutions

### Issue 1: TypeScript Errors "Property does not exist on type 'PrismaClient'"

**Symptoms:**
```
error TS2339: Property 'fridgeSection' does not exist on type 'PrismaClient'.
error TS2339: Property 'fridge' does not exist on type 'PrismaClient'.
error TS2339: Property 'temperatureReport' does not exist on type 'PrismaClient'.
```

**Cause:** 
The Prisma client hasn't been regenerated after updating the schema.

**Solution:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_temperature_monitoring
npm run dev
```

**Explanation:**
When you update `schema.prisma`, you need to:
1. Run `prisma generate` to regenerate the TypeScript types
2. Run `prisma migrate dev` to create and apply the database migration
3. Restart the server to use the new types

---

### Issue 2: PowerShell "&&" Not Valid Statement Separator

**Symptoms:**
```
The token '&&' is not a valid statement separator in this version.
```

**Cause:**
PowerShell doesn't support `&&` for chaining commands like bash does.

**Solution:**
Run commands separately:
```powershell
cd backend
npx prisma generate
npx prisma migrate dev --name add_temperature_monitoring
npm run dev
```

Or use semicolons in PowerShell:
```powershell
cd backend; npx prisma generate; npx prisma migrate dev --name add_temperature_monitoring
```

---

### Issue 3: Migration Already Exists

**Symptoms:**
```
Error: Migration already exists
```

**Solution:**
The migration has already been applied. Just run:
```bash
cd backend
npx prisma generate
npm run dev
```

---

### Issue 4: Database Connection Error

**Symptoms:**
```
Can't reach database server
```

**Solution:**
1. Make sure PostgreSQL is running
2. Check your DATABASE_URL in `.env` file
3. Verify username and password are correct
4. Test connection: `psql -U postgres -d tpss`

---

### Issue 5: "No fridge sections configured"

**Symptoms:**
Error message when trying to submit temperature report.

**Solution:**
1. Go to **Manage Fridge** page
2. Click **+ Add Section**
3. Add at least one section
4. Add at least one fridge to that section
5. Now you can submit reports

---

### Issue 6: Menu Items Not Showing

**Symptoms:**
Can't see the new Temperature Monitoring menu items.

**Solution:**
1. Hard refresh your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Make sure frontend is running: `cd frontend && npm run dev`
4. Check browser console for errors (F12)

---

### Issue 7: Reports Not Displaying

**Symptoms:**
View Report page shows "No reports found"

**Solution:**
1. Check the date selector - make sure you're viewing the correct date
2. Verify reports were actually submitted for that date
3. Check backend logs for errors
4. Verify database connection

---

### Issue 8: Changes Not Saving

**Symptoms:**
Edits to fridges/contacts don't persist.

**Solution:**
1. Check browser console for errors
2. Verify backend is running
3. Check network tab in browser dev tools
4. Verify authentication token is valid
5. Try logging out and logging back in

---

### Issue 9: Frontend Won't Start

**Symptoms:**
```
Error: Cannot find module...
```

**Solution:**
```bash
cd frontend
rm -rf node_modules
rm -rf .next
npm install
npm run dev
```

---

### Issue 10: Backend Won't Start After Migration

**Symptoms:**
Server crashes on startup with migration errors.

**Solution:**
```bash
cd backend
npx prisma migrate reset  # CAUTION: This will delete all data!
npx prisma migrate dev --name add_temperature_monitoring
npm run dev
```

**Important:** `migrate reset` will delete all existing data. Only use in development!

---

## Quick Command Reference

### Backend Commands
```bash
# Navigate to backend
cd backend

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migration
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (CAUTION!)
npx prisma migrate reset

# Start dev server
npm run dev

# Build for production
npm run build
```

### Frontend Commands
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Commands
```bash
# Connect to PostgreSQL
psql -U postgres -d tpss

# List databases
\l

# List tables
\dt

# Describe table
\d "TableName"

# Exit psql
\q
```

---

## Debugging Tips

### Check Backend Logs
The backend console will show:
- API requests
- Database queries
- Error messages
- Server start/stop messages

### Check Frontend Console
Open browser dev tools (F12) to see:
- API calls in Network tab
- JavaScript errors in Console tab
- React component warnings

### Check Database
Use Prisma Studio to inspect data:
```bash
cd backend
npx prisma studio
```

Then open http://localhost:5555 in your browser.

### Verify API Endpoints
Test API endpoints directly:
```bash
# Health check
curl http://localhost:3001/health

# Get sections (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/temperature/sections
```

---

## Environment Issues

### Issue: Wrong Node Version

**Solution:**
```bash
node --version  # Should be 18+
nvm use 18      # If using nvm
```

### Issue: Port Already in Use

**Symptoms:**
```
Port 3001 is already in use
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill
```

---

## Data Issues

### Issue: Duplicate Entries

**Solution:**
Check for unique constraints in schema. Delete duplicates manually via Prisma Studio.

### Issue: Foreign Key Violations

**Solution:**
Make sure related records exist before creating entries. For example, create sections before creating fridges.

### Issue: Data Not Showing After Update

**Solution:**
1. Check if update actually succeeded (check response)
2. Refresh the page
3. Check if filtering is hiding the data
4. Verify in Prisma Studio

---

## Performance Issues

### Issue: Slow Page Load

**Solution:**
1. Check database indexes
2. Optimize queries (add `include` only when needed)
3. Check network latency
4. Review console for errors

### Issue: Slow Report Submission

**Solution:**
1. Reduce number of fridges being processed
2. Check backend processing time
3. Verify database connection pool
4. Check server resources

---

## Security Issues

### Issue: Unauthorized Access

**Solution:**
1. Verify JWT token is valid
2. Check token expiration
3. Log out and log back in
4. Check authentication middleware

### Issue: CORS Errors

**Solution:**
1. Check CORS configuration in `backend/src/index.ts`
2. Verify FRONTEND_URL in backend `.env`
3. Check browser console for specific CORS error

---

### Issue 11: "Argument submitter is missing" When Submitting Report

**Symptoms:**
```
Invalid prisma.temperatureReport.create() invocation
Argument `submitter` is missing.
submittedBy: undefined
```

**Cause:**
The user ID wasn't being extracted correctly from the authentication token.

**Solution:**
This has been fixed in the controller. The issue was accessing `req.user.id` instead of `req.user.userId`.

If you still see this error:
1. Make sure you're logged in
2. Check that your JWT token is valid
3. Try logging out and logging back in
4. Verify the backend server restarted after the fix

**Quick Fix:**
```bash
# Restart backend
cd D:\tpss\backend
# Press Ctrl+C to stop
npm run dev
```

---

## Getting More Help

If none of these solutions work:

1. **Check the documentation**:
   - `TEMPERATURE_MONITORING_SETUP.md`
   - `TEMPERATURE_MONITORING_QUICKSTART.md`
   - `TEMPERATURE_MONITORING_WORKFLOW.md`

2. **Gather information**:
   - What were you trying to do?
   - What happened instead?
   - Any error messages?
   - Browser and version?
   - Steps to reproduce?

3. **Check logs**:
   - Backend console output
   - Browser console (F12)
   - Network tab in browser
   - Database logs

4. **Try basic fixes**:
   - Restart backend server
   - Hard refresh browser
   - Clear browser cache
   - Log out and back in
   - Check internet connection

---

## Preventive Measures

To avoid common issues:

1. **Always run `prisma generate` after schema changes**
2. **Restart servers after code changes**
3. **Use TypeScript for type safety**
4. **Test in development before production**
5. **Keep dependencies updated**
6. **Backup database regularly**
7. **Use version control (git)**
8. **Document custom changes**

---

## Emergency Recovery

If everything breaks:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Backend cleanup
cd backend
rm -rf node_modules
npm install
npx prisma generate
npx prisma migrate reset  # CAUTION: Deletes data!
npx prisma migrate dev --name add_temperature_monitoring
npm run dev

# 3. Frontend cleanup (in new terminal)
cd frontend
rm -rf node_modules
rm -rf .next
npm install
npm run dev

# 4. Recreate admin user if needed
cd backend
npm run create-admin
```

**Important:** This will delete all data! Only use as last resort in development.

---

## Contact & Support

For persistent issues:
1. Review all documentation
2. Check error messages carefully
3. Test with example data
4. Verify setup steps were followed

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0

