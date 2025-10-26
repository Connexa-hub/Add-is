
#!/bin/bash

echo "🔒 Setting up ClamAV Antivirus Scanner"
echo "======================================"

# Install ClamAV
echo "📦 Installing ClamAV..."
sudo apt-get update
sudo apt-get install -y clamav clamav-daemon

# Stop the daemon to update virus definitions
echo "⏸️  Stopping ClamAV daemon..."
sudo systemctl stop clamav-freshclam

# Update virus definitions
echo "📥 Updating virus definitions..."
sudo freshclam

# Start the daemon
echo "▶️  Starting ClamAV daemon..."
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon
sudo systemctl start clamav-freshclam
sudo systemctl enable clamav-freshclam

echo ""
echo "✅ ClamAV setup complete!"
echo "The antivirus scanner is now running and will automatically update virus definitions."
