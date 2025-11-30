# Deployment Guide: ArtSite on AWS Lightsail

This guide covers deploying your Node.js application to an AWS Lightsail instance using Ubuntu, Nginx, and PM2.

## Prerequisites

- A GitHub (or GitLab/Bitbucket) account.
- An AWS account.
- Your domain name (optional but recommended for SSL).

---

## Phase 1: Git Setup (Local Machine)

1.  **Initialize Git** (if not already done):

    ```bash
    git init
    ```

2.  **Check `.gitignore`**:
    Ensure you have a `.gitignore` file preventing sensitive files from being uploaded. It should include:

    ```
    node_modules/
    config.env
    .cache/
    .vscode/
    ```

3.  **Commit and Push**:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    # Create a new repository on GitHub, then follow the instructions to push:
    git branch -M main
    git remote add origin <YOUR_REPO_URL>
    git push -u origin main
    ```

---

## Phase 2: AWS Lightsail Instance Setup

1.  Log in to the **AWS Console** and navigate to **Lightsail**.
2.  Click **Create instance**.
3.  **Platform**: Linux/Unix.
4.  **Blueprint**: Select **OS Only** -> **Ubuntu 22.04 LTS** (or 20.04).
    - _Note: You can use the "Node.js" blueprint, but "OS Only" gives you a cleaner slate to configure Nginx exactly how you want._
5.  **Instance Plan**: The cheapest plan ($3.50/mo) is usually sufficient for a small site.
6.  **Name**: Give it a name (e.g., `artsite-prod`).
7.  Click **Create instance**.
8.  **Networking**:
    - Click on your new instance.
    - Go to the **Networking** tab.
    - Under **IPv4 Firewall**, ensure ports **22 (SSH)**, **80 (HTTP)**, and **443 (HTTPS)** are open.
    - (Optional) Create a **Static IP** and attach it to your instance.

---

## Phase 3: Server Configuration (SSH)

Click the orange **Connect using SSH** button in the Lightsail console.

### 1. Update and Install Dependencies

Run the following commands one by one:

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js (Version 18 or 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx (Web Server)
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install PM2 (Process Manager) globally
sudo npm install -g pm2
```

### 2. Clone Your Repository

```bash
# Go to the web root (or your home directory)
cd /var/www

# Clone your repo (replace with your actual URL)
sudo git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git artsite

# Change ownership to the current user (ubuntu) so you can edit files
sudo chown -R ubuntu:ubuntu /var/www/artsite
```

### 3. Install App Dependencies

```bash
cd /var/www/artsite
npm install
```

### 4. Configure Environment Variables

**NEVER** commit your `config.env` to Git. Create it manually on the server.

```bash
nano config.env
```

- Paste the contents of your local `config.env`.
- Update `NODE_ENV=production`.
- Update database connection strings if necessary.
- Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.

---

## Phase 4: Start the Application with PM2

PM2 keeps your app running in the background and restarts it if it crashes.

```bash
# Start the app (assuming server.js is your entry point)
pm2 start server.js --name "artsite"

# Save the PM2 list so it restarts on reboot
pm2 save

# Generate startup script
pm2 startup
# (Copy and paste the command output by the previous step)
```

---

## Phase 5: Configure Nginx (Reverse Proxy)

Nginx will sit in front of your Node app, handling public traffic on port 80 and forwarding it to your app (usually port 3000 or 8000).

1.  **Remove default config**:

    ```bash
    sudo rm /etc/nginx/sites-enabled/default
    ```

2.  **Create new config**:

    ```bash
    sudo nano /etc/nginx/sites-available/artsite
    ```

3.  **Paste the following configuration**:
    _Replace `yourdomain.com` with your actual domain or Public IP._
    _Ensure the `proxy_pass` port matches your Node app's port (check `server.js` or `config.env`)._

    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        location / {
            proxy_pass http://localhost:3000; # Change 3000 to your app's port
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

4.  **Enable the site**:

    ```bash
    sudo ln -s /etc/nginx/sites-available/artsite /etc/nginx/sites-enabled/
    ```

5.  **Test and Restart Nginx**:
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## Phase 6: SSL Setup (HTTPS)

1.  **Install Certbot**:

    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    ```

2.  **Obtain Certificate**:
    ```bash
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
    ```

    - Follow the prompts. Select "Redirect" (2) to force HTTPS.

---

## Maintenance

- **View Logs**: `pm2 logs artsite`
- **Restart App**: `pm2 restart artsite`
- **Deploy New Code**:
  ```bash
  cd /var/www/artsite
  git pull
  npm install
  pm2 restart artsite
  ```
