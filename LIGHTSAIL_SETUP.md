# AWS Lightsail + Nginx + Node.js Setup Guide

This guide outlines the steps to deploy the **Ruggier Chromatico** application on an AWS Lightsail instance running Linux (Ubuntu).

## 1. Create Lightsail Instance
1.  Log in to the AWS Lightsail Console.
2.  Click **Create instance**.
3.  Select **Linux/Unix** platform.
4.  Select **OS Only** > **Ubuntu 20.04 LTS** (or 22.04).
5.  Choose your instance plan (e.g., $5/month).
6.  Name your instance (e.g., `artsite-prod`).
7.  Click **Create instance**.

## 2. Networking Setup
1.  Click on your new instance.
2.  Go to the **Networking** tab.
3.  Under **IPv4 Firewall**, ensure the following ports are open:
    *   SSH (22)
    *   HTTP (80)
    *   HTTPS (443)
4.  (Optional) Create a **Static IP** and attach it to your instance.

## 3. Initial Server Setup (SSH)
Connect to your instance via SSH (using the browser console or your local terminal).

```bash
# Update package lists and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential
```

## 4. Install Node.js
We will use NodeSource to install a recent version of Node.js (e.g., v18 or v20).

```bash
# Download setup script for Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

## 5. Setup Project
Clone your repository and install dependencies.

```bash
# Navigate to web root (or home directory)
cd /var/www

# Clone the repository (replace with your actual repo URL)
# You may need to set up SSH keys or use HTTPS with a token
sudo git clone https://github.com/YOUR_USERNAME/ArtSite.git

# Change ownership to the current user (ubuntu) so we can edit files
sudo chown -R ubuntu:ubuntu /var/www/ArtSite

# Enter project directory
cd /var/www/ArtSite

# Install dependencies
npm install

# Install PM2 globally (Process Manager)
sudo npm install -g pm2
```

## 6. Environment Configuration
Create your `.env` file with production values.

```bash
nano config.env
```

Paste your production variables:
```env
NODE_ENV=production
PORT=3000
DATABASE=mongodb+srv://...
DATABASE_PASSWORD=...
STRIPE_SECRET_KEY=...
# ... other variables
```

## 7. PM2 Process Management
Use PM2 to keep your application running in the background.

```bash
# Start the application
# Note: We point directly to server.js instead of using 'npm start' 
# because the package.json script uses Windows 'set' commands.
NODE_ENV=production pm2 start server.js --name "artsite"

# Save the PM2 list so it respawns on reboot
pm2 save

# Generate startup script
pm2 startup
# (Run the command output by the previous step)
```

## 8. Nginx Configuration
Install and configure Nginx as a reverse proxy.

```bash
# Install Nginx
sudo apt install -y nginx

# Create a configuration file for your site
sudo nano /etc/nginx/sites-available/artsite
```

Paste the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site and restart Nginx:

```bash
# Link the configuration
sudo ln -s /etc/nginx/sites-available/artsite /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 9. SSL/TLS (HTTPS)
Secure your site with a free Let's Encrypt certificate using Certbot.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to redirect HTTP traffic to HTTPS.

## 10. Maintenance
*   **View Logs**: `pm2 logs artsite`
*   **Restart App**: `pm2 restart artsite`
*   **Update App**:
    ```bash
    cd /var/www/ArtSite
    git pull
    npm install
    pm2 restart artsite
    ```
