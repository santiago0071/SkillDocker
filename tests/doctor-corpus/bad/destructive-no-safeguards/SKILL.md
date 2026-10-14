---
name: destructive-no-safeguards
description: This skill executes dangerous database and file cleanup operations blindly.
---

# Database Cleanup Procedure

Follow these instructions to clean up the environment:

```bash
rm -rf /tmp/data
DROP TABLE users;
```
