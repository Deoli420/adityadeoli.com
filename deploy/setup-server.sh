#!/usr/bin/env bash
# ── SentinelAI — Server Bootstrap ──────────────────────────────────────
# Run this ONCE on a fresh Ubuntu 24.04 droplet as root.
#
# Usage:
#   ssh root@YOUR_DROPLET_IP
#   bash setup-server.sh
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "═══════════════════════════════════════════════════════════════"
echo " SentinelAI — Server Setup"
echo "═══════════════════════════════════════════════════════════════"

# ── 1. System updates ──────────────────────────────────────────────────
echo "[1/6] Updating system packages..."
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban

# ── 2. Create deploy user ─────────────────────────────────────────────
echo "[2/6] Creating deploy user..."
if id "deploy" &>/dev/null; then
    echo "  User 'deploy' already exists, skipping."
else
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

    # Copy SSH keys
    mkdir -p /home/deploy/.ssh
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys
    echo "  User 'deploy' created with SSH access."
fi

# ── 3. Firewall (UFW) ─────────────────────────────────────────────────
echo "[3/6] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
echo "y" | ufw enable
ufw status verbose

# ── 4. fail2ban ────────────────────────────────────────────────────────
echo "[4/6] Enabling fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# ── 5. Install Docker ─────────────────────────────────────────────────
echo "[5/6] Installing Docker..."
if command -v docker &>/dev/null; then
    echo "  Docker already installed: $(docker --version)"
else
    # Add Docker GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repo
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin

    # Add deploy user to docker group
    usermod -aG docker deploy
    echo "  Docker installed: $(docker --version)"
fi

# ── 6. Docker log rotation ────────────────────────────────────────────
echo "[6/6] Configuring Docker log rotation..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# ── Done ───────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Server setup complete!"
echo ""
echo " Next steps:"
echo "   1. Log out: exit"
echo "   2. SSH as deploy user: ssh deploy@$(curl -s ifconfig.me)"
echo "   3. Run: bash deploy/deploy.sh"
echo "═══════════════════════════════════════════════════════════════"
