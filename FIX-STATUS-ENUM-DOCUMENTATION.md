# Fix: Status ENUM Inconsistency - Documentation

## Problem Identified

Several utility scripts were attempting to use `'pending'` as a status value for Attendance records, but the Attendance model's ENUM definition only accepts Portuguese values.

## Root Cause

The `Attendance` model in `backend/src/models/Attendance.js` defines the `status` field with a strict ENUM containing only Portuguese values:

```javascript
status: {
  type: DataTypes.ENUM(
    'Recebida',        // Chamada recebida (Call received)
    'Triagem',         // Em processo de triagem (In triage)
    'Aprovada',        // Aprovada para despacho (Approved for dispatch)
    'Despachada',      // Enviada para criar corrida (Dispatched to create ride)
    'Em andamento',    // Corrida em andamento (Ride in progress)
    'Finalizada',      // Atendimento concluído (Completed)
    'Cancelada',       // Cancelada (Cancelled)
    'Negada'          // Negada por critérios (Denied)
  ),
  allowNull: false,
  defaultValue: 'Recebida'
}
```

## Files Fixed

### 1. fix-attendances.js
- **Changes**: 5 occurrences of `'pending'` changed to `'Recebida'`
- **Lines affected**: 24, 28, 47, 67, 87, 110, 113, 119

### 2. test-attendances-real.js
- **Changes**: 6 occurrences of `'pending'` changed to `'Recebida'`
- **Lines affected**: 24, 45, 64, 83, 123, 141-142
- **Additional**: Updated filter logic to check for both 'Recebida' and 'Triagem' status

### 3. debug-table.js
- **Changes**: 1 occurrence of `'pending'` changed to `'Recebida'`
- **Lines affected**: 23

### 4. update-status.js
- **Changes**: 2 occurrences of `'pending'` changed to `'Recebida'`
- **Lines affected**: 9, 17, 21

### 5. backend/src/routes/rideRoutes.js
- **Changes**: 1 occurrence - status check validation
- **Lines affected**: 199-200
- **Before**: `if (attendance.status !== 'pending')`
- **After**: `if (attendance.status !== 'Recebida')`

## Impact

### Before Fix
Attempting to run these scripts would result in database constraint violations:
```
Error: Invalid enum value. Expected 'Recebida', 'Triagem', 'Aprovada', etc., got 'pending'
```

### After Fix
- ✅ All scripts now use correct ENUM values
- ✅ Database operations will succeed
- ✅ Consistent with existing API implementation
- ✅ Aligns with Portuguese terminology used throughout the system

## Important Notes

1. **Ride Status vs Attendance Status**: The `Ride` model uses English status values ('pending', 'assigned', 'accepted', etc.) which is correct and should not be changed.

2. **API Endpoints**: The API endpoint `/api/attendances/pending` is correctly implemented in `backend/src/routes/attendanceRoutes.js` and internally queries for `status: 'Recebida'` (line 177).

3. **Frontend**: The frontend correctly uses Portuguese status values and the `getStatusChip` function in AttendanceList.js properly handles the Portuguese ENUM values.

## Verification

All modified files passed syntax checks:
```bash
✓ fix-attendances.js OK
✓ test-attendances-real.js OK
✓ debug-table.js OK
✓ update-status.js OK
✓ backend/src/routes/rideRoutes.js OK
```

## Status Translation Reference

For future development, here's the mapping between statuses:

| Portuguese (Attendance) | English Equivalent | Context |
|------------------------|-------------------|---------|
| Recebida | Received/Pending | Initial status when call is received |
| Triagem | Triage | Being evaluated |
| Aprovada | Approved | Approved for dispatch |
| Despachada | Dispatched | Sent to create a ride |
| Em andamento | In Progress | Ride is active |
| Finalizada | Completed | Finished successfully |
| Cancelada | Cancelled | Cancelled by user/system |
| Negada | Denied | Denied based on criteria |

## Testing Recommendations

To verify the fix works correctly:

1. Start the database (XAMPP with MariaDB)
2. Run: `node fix-attendances.js`
3. Run: `node test-attendances-real.js`
4. Verify that attendances are created with `status: 'Recebida'`
5. Check that the frontend displays attendances correctly

## Conclusion

This fix resolves a critical bug that prevented utility scripts from working with the Attendance model. All status values now correctly use the Portuguese ENUM values defined in the model schema.
