
#!/bin/bash
cd "$(dirname "$0")/.."
echo "Running Monnify account creation script..."
node scripts/createMissingMonnifyAccounts.js
