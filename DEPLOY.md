# Deploying Volt Rewards to an OCI Compute Instance

This app is a **static Vite + React SPA** — `npm run build` produces a `dist/`
folder of plain HTML/JS/CSS. The simplest, most robust way to serve it on an
Oracle Cloud (OCI) compute instance is **Nginx serving the `dist/` folder**.

These instructions assume you already have:

- An OCI compute instance (Ubuntu 22.04 or Oracle Linux 8/9) that is **running**.
- A **VCN with a public subnet**, an **Internet Gateway**, and a route rule
  `0.0.0.0/0 → Internet Gateway`.
- The instance has a **public IP**.
- SSH access to the instance (the key you chose at launch).

---

## 0. Prerequisites — open the ports (do this once)

Web traffic needs **port 80** (HTTP) and, if you add TLS, **port 443** (HTTPS).
Two layers must both allow it on OCI:

### a) VCN Security List (or Network Security Group)

In the OCI Console → **Networking → Virtual Cloud Networks → your VCN →
your public subnet → Security List → Add Ingress Rules**:

| Source CIDR | IP Protocol | Destination Port |
|-------------|-------------|------------------|
| `0.0.0.0/0` | TCP         | `80`             |
| `0.0.0.0/0` | TCP         | `443`            |

(SSH on port 22 should already be there from launch.)

### b) The instance's OS firewall

**Ubuntu** usually has no firewall blocking by default, but if `ufw` is active:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Oracle Linux** ships with `firewalld` enabled and WILL block port 80 — open it:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

> ⚠️ Oracle Linux also has strict `iptables` rules by default. If the above
> doesn't work, run:
> ```bash
> sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
> sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
> sudo netfilter-persistent save   # Ubuntu
> # or on Oracle Linux: sudo service iptables save
> ```

---

## 1. Build the site

You can build **locally** and upload the result (recommended — keeps the server
lean), or build **on the instance**. Pick one.

### Option A — Build locally, upload `dist/` (recommended)

On your machine, in the project folder:

```bash
npm install
npm run build          # → creates ./dist
```

Upload the `dist/` folder to the instance (replace IP + key path + user;
Ubuntu images use `ubuntu`, Oracle Linux images use `opc`):

```bash
scp -i ~/.ssh/your_key -r dist ubuntu@<PUBLIC_IP>:/tmp/volt-dist
```

### Option B — Build on the instance

SSH in, install Node 20, clone/copy the repo, then build:

```bash
ssh -i ~/.ssh/your_key ubuntu@<PUBLIC_IP>

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -   # Ubuntu
sudo apt-get install -y nodejs                                       # Ubuntu
# (Oracle Linux: curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo dnf install -y nodejs)

git clone <YOUR_REPO_URL> volt && cd volt
npm install
npm run build
sudo mkdir -p /var/www/volt
sudo cp -r dist/* /var/www/volt/
```

---

## 2. Install Nginx

**Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y nginx
```

**Oracle Linux:**
```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
```

---

## 3. Place the built files

If you used **Option A** (uploaded to `/tmp/volt-dist`):

```bash
sudo mkdir -p /var/www/volt
sudo cp -r /tmp/volt-dist/* /var/www/volt/
sudo chown -R www-data:www-data /var/www/volt   # Ubuntu
# Oracle Linux uses the 'nginx' user:  sudo chown -R nginx:nginx /var/www/volt
```

---

## 4. Configure Nginx (SPA-aware)

Create the site config:

```bash
sudo tee /etc/nginx/conf.d/volt.conf > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;          # replace _ with your domain if you have one

    root /var/www/volt;
    index index.html;

    # SPA fallback — always serve index.html for unknown routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-cache the fingerprinted assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    gzip_min_length 1024;
}
EOF
```

> On **Ubuntu** the default install ships an example `default` site. Remove it so
> it doesn't shadow yours:
> ```bash
> sudo rm -f /etc/nginx/sites-enabled/default
> ```
> (Ubuntu's `nginx.conf` includes both `sites-enabled/*` and `conf.d/*`, so the
> file above works on both distros.)

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Verify

Visit `http://<PUBLIC_IP>` in your browser — you should see the Volt Rewards
landing page with the card assembling itself on load.

If it doesn't load, work down the layers:

```bash
# Is nginx serving locally on the box?
curl -I http://localhost            # should be 200 OK

# Is the port reachable from outside? (run from your laptop)
nc -vz <PUBLIC_IP> 80
```

If `curl localhost` works but the external check fails → it's a **network**
problem (VCN Security List rule missing, or OS firewall). Re-check Step 0.

---

## 6. (Optional) HTTPS with a domain

If you have a domain pointed at the instance's public IP (A record):

```bash
# Ubuntu
sudo apt-get install -y certbot python3-certbot-nginx
# Oracle Linux
# sudo dnf install -y certbot python3-certbot-nginx

sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the Nginx config for TLS and sets up auto-renewal. Make sure the
`server_name` in `volt.conf` matches your domain, and that port 443 is open
(Step 0).

---

## Updating the site later

Rebuild and replace the files, then reload isn't even needed (static files):

```bash
# locally
npm run build
scp -i ~/.ssh/your_key -r dist/* ubuntu@<PUBLIC_IP>:/tmp/new-dist/
# on the instance
sudo rm -rf /var/www/volt/*
sudo cp -r /tmp/new-dist/* /var/www/volt/
```

Because filenames under `/assets/` are content-hashed, returning visitors get
the new build immediately without cache issues.
