# Nginx Reverse Proxy Setup for InviteStory

This directory provides the complete configuration to run Nginx as a high-performance reverse proxy routing traffic from your custom domain to your Vercel deployment (`https://invitation-card-umber-six.vercel.app`).

---

## 📁 Included Files

1. **`invitation-card.conf`**: The virtual host configuration. Include this in `/etc/nginx/conf.d/` or `/etc/nginx/sites-available/`.
2. **`nginx.conf`**: Complete standalone Nginx configuration (ideal for Docker or full server setup).

---

## 🚀 Setup Instructions (Ubuntu / Debian VPS)

### Step 1: Install Nginx & Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Copy the Configuration
```bash
sudo cp nginx/invitation-card.conf /etc/nginx/sites-available/invitation-card.conf
sudo ln -s /etc/nginx/sites-available/invitation-card.conf /etc/nginx/sites-enabled/
```

### Step 3: Edit Your Domain Name
Open `/etc/nginx/sites-available/invitation-card.conf` and replace `yourdomain.com www.yourdomain.com` with your actual domain name:
```bash
sudo nano /etc/nginx/sites-available/invitation-card.conf
```

### Step 4: Issue Free SSL Certificate with Certbot
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 5: Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐳 Running with Docker

You can run Nginx instantly with Docker without installing anything on your host:

```bash
docker run -d \
  --name invitation-nginx \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/nginx/invitation-card.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine
```

---

## ⚙️ Key Technical Features in this Config

1. **SNI (Server Name Indication) Enabled**:
   - `proxy_ssl_server_name on;`
   - `proxy_ssl_name invitation-card-umber-six.vercel.app;`
   - *Why this is critical:* Vercel's Cloudflare edge terminates incoming SSL connections based on the SNI hostname. Without this setting, standard Nginx proxy passes to Vercel fail with `403 Forbidden` or SSL handshake errors.

2. **50MB Upload Capacity**:
   - `client_max_body_size 50M;` enables smooth high-resolution wedding photo uploads directly through the proxy.

3. **WebSocket & SSE Passthrough**:
   - Full support for `Upgrade` and `Connection` headers for instant live preview updates.

4. **Dynamic API & Cache Invalidation**:
   - `/api/` and `/cards/` routes have `Cache-Control: no-cache, no-store, must-revalidate` to guarantee mobile devices always receive the freshest wedding details.
