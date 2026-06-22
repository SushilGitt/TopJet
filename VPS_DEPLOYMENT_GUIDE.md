# VPS & Deployment - Complete Hinglish Guide
### From Localhost to Production - Sab Kuch Scratch Se Seekho

---

## Table of Contents
1. [Basics Samjho Pehle](#1-basics-samjho-pehle)
2. [Localhost Kya Hai?](#2-localhost-kya-hai)
3. [Server Kya Hai?](#3-server-kya-hai)
4. [VPS Kya Hai?](#4-vps-kya-hai)
5. [Domain & DNS Kaise Kaam Karta Hai](#5-domain--dns-kaise-kaam-karta-hai)
6. [SSH - Apne Server Se Baat Karo](#6-ssh---apne-server-se-baat-karo)
7. [Docker - Samjho Isko Dabba System](#7-docker---samjho-isko-dabba-system)
8. [Nginx - Traffic Police](#8-nginx---traffic-police)
9. [SSL Certificate - Lock Wala Padlock](#9-ssl-certificate---lock-wala-padlock)
10. [Coolify - Docker Ka Dashboard](#10-coolify---docker-ka-dashboard)
11. [Full Deployment Flow - Step by Step](#11-full-deployment-flow---step-by-step)
12. [Common Commands Cheat Sheet](#12-common-commands-cheat-sheet)
13. [Troubleshooting Guide](#13-troubleshooting-guide)

---

## 1. Basics Samjho Pehle

### Internet Kaise Kaam Karta Hai (Simple Version)

Socho tum browser mein `google.com` type karte ho. Kya hota hai?

```
Tumhara Computer  →  Internet  →  Google Ka Server  →  Wapas Tumhare Paas
   (Client)                        (Ek Computer jo                 
                                    24/7 chalu hai)
```

Bas yehi concept hai:
- **Client** = Jo maangta hai (browser, phone, app)
- **Server** = Jo deta hai (ek computer jo hamesha chalu rehta hai)
- **Request** = Client ka sawaal ("mujhe ye page do")
- **Response** = Server ka jawab ("ye lo page")

### IP Address Kya Hai?

Har computer ka ek address hota hai, jaise ghar ka address hota hai.

```
Tumhara Ghar:    B-42, Sector 15, Noida
Tumhara Server:  91.239.208.85
```

IP Address = Internet ka Pin Code. Har server ka unique hota hai.

### Port Kya Hai?

IP address ghar ka address hai, port flat number hai.

```
91.239.208.85:3000   →  Flat 3000 (mx-trust-badges app)
91.239.208.85:3012   →  Flat 3012 (pixelmint app)
91.239.208.85:3013   →  Flat 3013 (scroll-up-pro app)
91.239.208.85:8000   →  Flat 8000 (Coolify dashboard)
91.239.208.85:27017  →  Flat 27017 (MongoDB database)
```

Ek server pe bahut saari apps chal sakti hain — har ek alag port pe.

---

## 2. Localhost Kya Hai?

Jab tum apne laptop pe `npm run dev` karte ho aur `http://localhost:3000` khulta hai — wo **localhost** hai.

```
localhost = Tumhara apna computer
127.0.0.1 = localhost ka IP address (hamesha same rehta hai)
```

**Localhost ka matlab:**
- Sirf TUMI dekh sakte ho
- Baaki duniya nahi dekh sakti
- Jab laptop band, sab band

**Server ka matlab:**
- Poori duniya dekh sakti hai
- 24/7 chalu rehta hai
- Internet pe available hai

### Localhost vs Server

| Feature | Localhost | Server (VPS) |
|---------|-----------|-------------|
| Kaun dekh sakta hai? | Sirf tum | Poori duniya |
| Kab chalu? | Jab laptop on | 24/7 hamesha |
| IP Address | 127.0.0.1 | 91.239.208.85 (public) |
| Domain | localhost | scrollup.solnix.store |
| Free hai? | Haan | Nahi (monthly rent) |

---

## 3. Server Kya Hai?

Server = Ek computer jo hamesha chalu rehta hai aur internet pe available hai.

### Server Ke Types

```
1. Shared Hosting (Sasta, Slow)
   ┌──────────────────────┐
   │  Ek bada computer    │
   │  ┌────┐ ┌────┐ ┌────┐│
   │  │App1│ │App2│ │App3││  ← 100 logon ki apps ek hi machine pe
   │  │John│ │Jane│ │You ││  ← Sab share karte hain RAM, CPU
   │  └────┘ └────┘ └────┘│
   └──────────────────────┘
   Example: GoDaddy, Hostinger basic plans
   Price: Rs 100-500/month

2. VPS - Virtual Private Server (Best for Apps)
   ┌──────────────────────┐
   │  Ek bada computer    │
   │  ┌────────────────┐  │
   │  │ TUMHARA VIRTUAL │  │  ← Tumhara apna section
   │  │ SERVER          │  │  ← Guaranteed RAM, CPU
   │  │ 4GB RAM, 2 CPU │  │  ← Full control (root access)
   │  └────────────────┘  │
   │  ┌────────────────┐  │
   │  │ Kisi aur ka    │  │
   │  └────────────────┘  │
   └──────────────────────┘
   Example: Hetzner, DigitalOcean, Contabo
   Price: Rs 500-3000/month

3. Dedicated Server (Expensive, Full Power)
   ┌──────────────────────┐
   │  POORA COMPUTER      │
   │  SIRF TUMHARA        │  ← Full machine sirf tumhare liye
   │  64GB RAM, 16 CPU    │
   └──────────────────────┘
   Example: OVH, Hetzner Dedicated
   Price: Rs 5000-50000/month

4. Cloud (Pay As You Go)
   AWS, Google Cloud, Azure
   Price: Use karo utna pay karo
   Complex hai but scalable
```

### Tumhara Setup

Tumhara VPS = **91.239.208.85**
- Ye ek Hetzner/Contabo type VPS hai
- Username: `theharsh`
- OS: Ubuntu Linux
- Isme Docker, Nginx, Coolify sab installed hai

---

## 4. VPS Kya Hai?

**VPS = Virtual Private Server**

Simple bhasha mein: Ek bade computer ka ek hissa jo sirf tumhara hai. Jaise ek building mein tumhara apna flat.

### VPS Lene Ke Baad Kya Milta Hai?

```
1. IP Address     →  91.239.208.85 (tumhara public address)
2. Username       →  root ya theharsh
3. Password/Key   →  SSH key ya password (login ke liye)
4. OS             →  Ubuntu Linux (usually)
5. RAM            →  4GB, 8GB, etc.
6. Storage        →  80GB, 160GB SSD
7. Bandwidth      →  Unlimited (usually)
```

### VPS Providers (Popular Ones)

| Provider | Starting Price | Best For |
|----------|---------------|----------|
| Hetzner | $4/mo (~Rs 350) | Best value, Europe servers |
| DigitalOcean | $6/mo (~Rs 500) | Simple, good docs |
| Contabo | $6/mo (~Rs 500) | Cheap, lots of RAM |
| Linode | $5/mo (~Rs 400) | Reliable |
| Vultr | $6/mo (~Rs 500) | Many locations |
| AWS Lightsail | $5/mo (~Rs 400) | If you want AWS ecosystem |

### VPS Lena Kaise Hai?

1. Provider ki website pe jao (e.g., hetzner.com)
2. Sign up karo
3. "Create Server" click karo
4. Choose: Ubuntu 22.04, 4GB RAM, closest location
5. SSH key add karo (ya password set karo)
6. Pay karo
7. IP address milega — bas, tumhara server ready hai!

---

## 5. Domain & DNS Kaise Kaam Karta Hai

### Domain Name Kya Hai?

Domain = IP address ka sundar naam.

```
IP Address:  91.239.208.85      (yaad rakhna mushkil)
Domain:      scrollup.solnix.store  (yaad rakhna easy)
```

Jaise phone mein contact save karte ho — "Mummy" naam se, actual number yaad nahi rakhte.

### DNS Kya Hai?

**DNS = Domain Name System** = Internet ki phone book.

Jab tum `scrollup.solnix.store` type karte ho:

```
Browser:  "scrollup.solnix.store kahan hai?"
   ↓
DNS Server:  "91.239.208.85 pe hai"
   ↓
Browser:  "OK, 91.239.208.85 pe request bhejta hoon"
```

### DNS Records Samjho

DNS mein different types ke records hote hain:

```
A Record (Address Record)
   scrollup.solnix.store  →  91.239.208.85
   "Is domain ko is IP pe bhejo"

CNAME Record (Alias)
   www.solnix.store  →  solnix.store
   "Ye wahi hai jo wo hai"

MX Record (Mail)
   solnix.store  →  mail.google.com
   "Email yahan bhejo"
```

### DNS Setup Kaise Karte Hain?

1. Domain kharido (Namecheap, Cloudflare, GoDaddy)
2. DNS settings mein jao
3. A record add karo:
   - Name: `scrollup` (subdomain)
   - Type: `A`
   - Value: `91.239.208.85` (tumhara VPS IP)
4. Save karo
5. 5-30 minutes mein propagate hota hai

### Cloudflare Kya Hai?

Cloudflare = Free DNS + CDN + Security provider

```
Without Cloudflare:
   User → Tumhara Server

With Cloudflare:
   User → Cloudflare (cache + protection) → Tumhara Server
```

**Important Settings:**
- **DNS Only (Grey Cloud)** = Sirf DNS, traffic directly server pe jaata hai
- **Proxied (Orange Cloud)** = Cloudflare se hoke jaata hai (caching, DDoS protection)

Shopify apps ke liye **DNS Only (Grey Cloud)** use karo, kyunki Coolify/Nginx apna SSL handle karta hai.

---

## 6. SSH - Apne Server Se Baat Karo

### SSH Kya Hai?

**SSH = Secure Shell** = Apne server ko remotely control karne ka tarika.

Jaise TeamViewer se kisi ka computer control karte ho, waise SSH se server control karte ho — but sirf terminal/command line se.

### SSH Kaise Connect Karte Hain?

```bash
# Basic format
ssh username@ip-address

# Example: Tumhara server
ssh theharsh@91.239.208.85

# With specific port (default 22)
ssh -p 22 theharsh@91.239.208.85
```

### SSH Key Kya Hai?

Password se login karna safe nahi hai. SSH key use karo.

SSH Key = Ek taala aur chaabi ka system:
- **Private Key** = Chaabi (tumhare laptop pe rehti hai, KABHI share mat karo)
- **Public Key** = Taala (server pe lagta hai)

```bash
# Step 1: Key generate karo (apne laptop pe)
ssh-keygen -t ed25519

# Step 2: Public key server pe copy karo
ssh-copy-id theharsh@91.239.208.85

# Step 3: Ab bina password ke login ho jaoge
ssh theharsh@91.239.208.85
```

### Important SSH Commands (Server Pe)

```bash
# System info
whoami              # Kaun logged in hai
hostname            # Server ka naam
df -h               # Disk space check
free -h             # RAM check
top                 # CPU/Memory usage (live)
htop                # Better version of top

# Files
ls                  # Files list karo
ls -la              # Hidden files bhi dikhao
cd /path/to/folder  # Folder mein jao
cat file.txt        # File padho
nano file.txt       # File edit karo (simple editor)
vim file.txt        # File edit karo (advanced editor)

# Services
sudo systemctl status nginx    # Nginx chal raha hai?
sudo systemctl restart nginx   # Nginx restart karo
sudo systemctl status docker   # Docker chal raha hai?

# Logs
sudo journalctl -u nginx --tail 50   # Nginx ke last 50 logs
docker logs container_name --tail 50  # Docker container ke logs

# Network
curl http://localhost:3013     # Local test karo
netstat -tlnp                  # Kaun sa port kaun use kar raha
sudo lsof -i :80               # Port 80 pe kya chal raha
```

---

## 7. Docker - Samjho Isko Dabba System

### Docker Kya Hai?

Socho tumhare paas 5 apps hain:
- App 1 ko Node.js 18 chahiye
- App 2 ko Node.js 16 chahiye  
- App 3 ko Python chahiye
- App 4 ko MongoDB chahiye

Agar sab ek hi machine pe directly install karo → **CONFLICT!**

Docker solution hai: Har app ko apne **dabba (container)** mein rakh do.

```
┌──── VPS (91.239.208.85) ──────────────────┐
│                                            │
│  ┌─────────────┐  ┌─────────────┐         │
│  │ Container 1 │  │ Container 2 │         │
│  │ Node 18     │  │ Node 16     │         │
│  │ Scroll Up   │  │ PixelMint   │         │
│  │ Port: 3013  │  │ Port: 3012  │         │
│  └─────────────┘  └─────────────┘         │
│                                            │
│  ┌─────────────┐  ┌─────────────┐         │
│  │ Container 3 │  │ Container 4 │         │
│  │ MongoDB     │  │ PostgreSQL  │         │
│  │ Port: 27018 │  │ Port: 5434  │         │
│  └─────────────┘  └─────────────┘         │
│                                            │
│  Har container apne mein isolated hai      │
│  Ek crash hua toh baaki safe               │
└────────────────────────────────────────────┘
```

### Docker Key Concepts

```
Image     = Blueprint/Recipe (e.g., "Node 18 + mera code")
Container = Running instance of image (actual chalta hua app)
Dockerfile = Instructions to build image
Volume    = Permanent storage (container delete ho toh bhi data safe)
Network   = Containers ko ek dusre se baat karne ka system
```

**Real life analogy:**
```
Image      = Pizza ka recipe
Container  = Actual bani hui pizza
Dockerfile = Recipe likhne ka format
Volume     = Fridge (pizza khatam ho toh bhi ingredients saved)
Network    = Kitchen mein sab chef ek dusre se baat kar sakte
```

### Dockerfile Samjho

Tumhara TopJet ka Dockerfile:

```dockerfile
# Step 1: Base image (Node.js 18 wala dabba lo)
FROM node:18-alpine

# Step 2: Build tools install karo (sqlite3 ke liye)
RUN apk add --no-cache python3 make g++

# Step 3: Shopify API key set karo
ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY

# Step 4: Port batao
EXPOSE 3000

# Step 5: Working directory set karo
WORKDIR /app

# Step 6: Code copy karo
COPY web .

# Step 7: Dependencies install karo
RUN npm install

# Step 8: App start karo
CMD ["npm", "run", "serve"]
```

Ye basically bol raha hai:
1. Node.js 18 ka dabba lo
2. Kuch tools install karo
3. Mera code copy karo
4. npm install karo
5. App chalu karo

### Important Docker Commands

```bash
# Containers dekhna
docker ps                          # Running containers
docker ps -a                       # Sab containers (stopped bhi)

# Container logs
docker logs container_name         # Logs dekho
docker logs container_name --tail 30  # Last 30 lines

# Container ke andar jao
docker exec -it container_name sh  # Shell open karo

# Container start/stop
docker stop container_name
docker start container_name
docker restart container_name

# Image build karo
docker build -t my-app .           # Current folder se build

# Container run karo
docker run -d -p 3013:3000 my-app  # Background mein run karo
#            │    │     │
#            │    │     └── Container ke andar port
#            │    └── Server pe port
#            └── Detached mode (background)

# Sab clean karo
docker system prune -a             # Unused sab delete (careful!)
```

### Docker Networks

Containers ek dusre se baat kaise karte hain?

```
┌── coolify network ──────────────────────┐
│                                          │
│  scroll-up-pro ←→ MongoDB               │
│  (container)       (container)           │
│                                          │
│  Dono ek network pe hain,               │
│  toh ek dusre ko naam se                │
│  call kar sakte hain                     │
│                                          │
│  MongoDB URL andar se:                   │
│  mongodb://root:pass@m45pbowj...:27017   │
│           (container ka naam)            │
└──────────────────────────────────────────┘
```

Container naam = Network ke andar hostname.

---

## 8. Nginx - Traffic Police

### Nginx Kya Hai?

**Nginx = Reverse Proxy = Traffic Police**

Problem: Tumhare paas 5 apps hain ek server pe, sab alag ports pe. User ko port number yaad nahi rehta.

```
Without Nginx:
   User ko yaad rakhna padega:
   http://91.239.208.85:3012  → PixelMint
   http://91.239.208.85:3013  → TopJet
   
With Nginx:
   User sirf domain type karta hai:
   https://pixelmint.solnix.store  → Nginx → port 3012
   https://scrollup.solnix.store   → Nginx → port 3013
```

Nginx port 80 (HTTP) aur 443 (HTTPS) pe sunata hai, aur domain ke basis pe sahi app pe bhej deta hai.

### Nginx Config Samjho

Tumhara TopJet config (`/etc/nginx/sites-enabled/scrollup.solnix.store`):

```nginx
server {
    server_name scrollup.solnix.store;     # Ye domain ke liye

    location / {
        proxy_pass http://127.0.0.1:3013;  # Yahan bhejo (Docker container)
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSL (HTTPS) - Certbot ne auto-add kiya
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/scrollup.solnix.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scrollup.solnix.store/privkey.pem;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name scrollup.solnix.store;
    return 301 https://$host$request_uri;  # HTTP se HTTPS pe bhejo
}
```

### Naya App Add Karna (Nginx Config)

```bash
# Step 1: Config file banao
sudo nano /etc/nginx/sites-enabled/newapp.solnix.store

# Step 2: Config likho (upar wala format copy karo, port change karo)

# Step 3: Test karo (syntax check)
sudo nginx -t

# Step 4: Reload karo
sudo systemctl reload nginx

# Step 5: SSL certificate lo
sudo certbot --nginx -d newapp.solnix.store --non-interactive --agree-tos
```

### Nginx Important Commands

```bash
sudo nginx -t                    # Config test karo (HAMESHA pehle test karo!)
sudo systemctl reload nginx      # Config reload karo (bina downtime)
sudo systemctl restart nginx     # Full restart (thoda downtime)
sudo systemctl status nginx      # Status check karo
sudo tail -f /var/log/nginx/error.log    # Live error logs dekho
sudo tail -f /var/log/nginx/access.log   # Live access logs dekho
```

---

## 9. SSL Certificate - Lock Wala Padlock

### SSL Kya Hai?

```
HTTP  = Bina lock  = http://  = Unsecure (data plain text mein jaata)
HTTPS = Lock wala  = https:// = Secure (data encrypted hota hai)
```

SSL certificate = Browser mein padlock icon.

### Let's Encrypt Kya Hai?

**Free SSL certificates!** Pehle SSL ke liye pay karna padta tha. Ab Let's Encrypt free mein deta hai.

**Certbot** = Let's Encrypt ka tool jo automatically certificate install karta hai.

### SSL Setup Steps

```bash
# Step 1: Certbot install karo (ek baar)
sudo apt install certbot python3-certbot-nginx

# Step 2: Certificate lo (Nginx ke saath)
sudo certbot --nginx -d scrollup.solnix.store

# Ye automatically:
# - Certificate generate karega
# - Nginx config update karega
# - Auto-renewal setup karega

# Step 3: Check karo
sudo certbot certificates   # Sab certificates dekho

# Auto-renewal test
sudo certbot renew --dry-run
```

Certificates 90 days ke liye valid hote hain, but Certbot auto-renew karta hai.

---

## 10. Coolify - Docker Ka Dashboard

### Coolify Kya Hai?

**Coolify = Self-hosted Vercel/Heroku/Netlify**

Matlab: Vercel jaisa experience, but tumhare apne server pe.

```
Without Coolify:
   - SSH karo
   - Git pull karo
   - Docker build karo
   - Docker run karo
   - Env vars set karo
   - Sab manually karo
   - Bahut commands type karo

With Coolify:
   - Dashboard pe jao (http://91.239.208.85:8000)
   - GitHub repo connect karo
   - "Deploy" click karo
   - Bas!
```

### Coolify Ka Dashboard

```
http://91.239.208.85:8000
│
├── Projects           # Apps organize karo
│   ├── TopJet
│   ├── CompressCart
│   └── Promoloom
│
├── Servers            # VPS manage karo
│   └── localhost (tumhara server)
│
├── Databases          # MongoDB, PostgreSQL manage karo
│   ├── MongoDB (scroll-up-pro)
│   ├── MongoDB (promoloom)
│   └── PostgreSQL (compress-cart)
│
└── Settings           # General settings
```

### Coolify Mein App Deploy Karna

1. **Project banao** → "TopJet"
2. **App add karo** → GitHub repo select karo
3. **Environment variables set karo:**
   ```
   SHOPIFY_API_KEY=866588...
   SHOPIFY_API_SECRET=shpss_2b91...
   HOST=https://scrollup.solnix.store
   MONGO_URI=mongodb://root:pass@container:27017
   ```
4. **Deploy click karo**
5. Coolify automatically:
   - Git clone karega
   - Docker image build karega
   - Container start karega
   - Health check karega

### Coolify vs Manual Docker

| Task | Manual | Coolify |
|------|--------|---------|
| Deploy | 10+ commands | 1 click |
| Env vars | .env file manage | Dashboard pe set |
| Logs | `docker logs` command | Dashboard pe dekho |
| Rollback | Mushkil | 1 click |
| SSL | Certbot manually | Auto (Traefik) |
| Database | Docker commands | 1 click create |

### Coolify Ka API

Coolify ka API bhi hai — hum isi se deploy kar rahe the bina dashboard ke:

```bash
# Deploy trigger karo
curl -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"app-uuid"}' \
  "http://91.239.208.85:8000/api/v1/deploy"

# App status check karo
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  "http://91.239.208.85:8000/api/v1/applications/app-uuid"
```

---

## 11. Full Deployment Flow - Step by Step

### Tumhara TopJet Kaise Deploy Hua - Pura Flow

```
STEP 1: Code likhte ho (Local PC)
   ↓
STEP 2: Git push (GitHub pe)
   ↓
STEP 3: Coolify detect karta hai (ya manual trigger)
   ↓
STEP 4: Coolify git clone karta hai server pe
   ↓
STEP 5: Dockerfile se Docker image build hoti hai
   ↓
STEP 6: Purana container band, naya start
   ↓
STEP 7: Naya container port 3013 pe chalu
   ↓
STEP 8: Nginx route karta hai domain → port
   ↓
STEP 9: User scrollup.solnix.store visit karta hai
   ↓
STEP 10: App live!
```

### Detailed Flow

```
┌─ Tumhara Laptop ────────────────────────────────────────┐
│                                                          │
│  1. Code changes karo                                    │
│  2. Frontend build: SHOPIFY_API_KEY=xxx npm run build    │
│  3. git add → git commit → git push                     │
│                                                          │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌─ GitHub (ankur4work/Scroll-Up-Pro) ─────────────────────┐
│                                                          │
│  Code stored here. Coolify yahan se pull karta hai.      │
│                                                          │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌─ VPS (91.239.208.85) ──────────────────────────────────┐
│                                                          │
│  ┌─ Coolify ──────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  1. GitHub se code pull karta hai                  │  │
│  │  2. Dockerfile padhta hai                          │  │
│  │  3. Docker image build karta hai                   │  │
│  │  4. Environment variables inject karta hai         │  │
│  │  5. Container start karta hai (port 3013)          │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Docker Container (scroll-up-pro) ─────────────────┐  │
│  │                                                    │  │
│  │  Node.js 18 + Express server                       │  │
│  │  Listening on 0.0.0.0:3000                         │  │
│  │  (Container ke andar 3000, bahar 3013)             │  │
│  │                                                    │  │
│  │  ┌─ Frontend (React) ──┐  ┌─ Backend (API) ──┐    │  │
│  │  │  /assets/index.js   │  │  /api/auth        │    │  │
│  │  │  Polaris UI         │  │  /api/getshop     │    │  │
│  │  │  index.html         │  │  /api/subscribe   │    │  │
│  │  └─────────────────────┘  └───────┬───────────┘    │  │
│  │                                   │                │  │
│  └───────────────────────────────────┼────────────────┘  │
│                                      │                    │
│  ┌─ MongoDB Container ───────────────┼────────────────┐  │
│  │                                   │                │  │
│  │  Database: scroll_up_pro          │                │  │
│  │  Collection: shopify_sessions  ←──┘                │  │
│  │  (Session data stored here)                        │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Nginx ────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  Port 80/443 pe sunata hai                         │  │
│  │                                                    │  │
│  │  scrollup.solnix.store → http://127.0.0.1:3013    │  │
│  │  pixelmint.solnix.store → http://127.0.0.1:3012   │  │
│  │                                                    │  │
│  │  + SSL certificate handle karta hai                │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
               │
               ▼
┌─ User Ka Browser ───────────────────────────────────────┐
│                                                          │
│  https://scrollup.solnix.store                           │
│  → DNS: 91.239.208.85                                    │
│  → Nginx: port 3013 pe bhejo                             │
│  → Docker container: index.html serve karo               │
│  → React app load!                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Naya App Deploy Karna (From Scratch)

Agar tumhe ek bilkul naya app deploy karna hai:

```bash
# === LOCAL PC PE ===

# 1. Code ready karo
# 2. Dockerfile banao
# 3. GitHub pe push karo

# === SERVER PE (SSH) ===

# 4. Coolify dashboard pe jao: http://91.239.208.85:8000
#    - New Project → New App → GitHub repo select
#    - Env vars set karo
#    - Port set karo (e.g., 3014:3000)
#    - Deploy click karo

# 5. Nginx config banao
sudo nano /etc/nginx/sites-enabled/newapp.solnix.store

# Content:
# server {
#     server_name newapp.solnix.store;
#     location / {
#         proxy_pass http://127.0.0.1:3014;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#     }
#     listen 80;
# }

# 6. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 7. SSL certificate lo
sudo certbot --nginx -d newapp.solnix.store --non-interactive --agree-tos

# 8. DNS set karo (Cloudflare/registrar mein)
#    A record: newapp → 91.239.208.85

# DONE! App live hai https://newapp.solnix.store pe
```

---

## 12. Common Commands Cheat Sheet

### Server Management
```bash
# Login
ssh theharsh@91.239.208.85

# System info
uptime                    # Kitne time se server chalu hai
df -h                     # Disk usage
free -h                   # RAM usage
top                       # Live CPU/RAM usage
```

### Docker
```bash
# Status
docker ps                 # Running containers
docker ps -a              # All containers

# Logs
docker logs NAME --tail 50     # Last 50 lines
docker logs NAME -f            # Live follow

# Container management
docker restart NAME
docker stop NAME
docker start NAME

# Go inside container
docker exec -it NAME sh

# Cleanup
docker system prune        # Remove unused data
```

### Nginx
```bash
sudo nginx -t                          # Test config
sudo systemctl reload nginx            # Apply changes
sudo systemctl restart nginx           # Full restart
sudo tail -f /var/log/nginx/error.log  # Watch errors
```

### Certbot (SSL)
```bash
sudo certbot --nginx -d domain.com     # New certificate
sudo certbot certificates              # List all certs
sudo certbot renew                     # Renew all certs
```

### Git (Deploy Flow)
```bash
git add .
git commit -m "message"
git push                               # Triggers Coolify deploy
```

### Port Check
```bash
sudo lsof -i :3013                     # Kaun use kar raha port 3013
sudo netstat -tlnp                     # Sab ports dikao
curl http://localhost:3013             # Local test
```

---

## 13. Troubleshooting Guide

### App Nahi Chal Raha?

```
Step 1: Container chal raha hai?
   $ docker ps | grep app-name
   → Agar nahi dikha: docker start container_name

Step 2: Container crash ho raha?
   $ docker logs container_name --tail 30
   → Error message padho

Step 3: Port pe kuch chal raha hai?
   $ curl http://localhost:PORT
   → Agar response aaye: Docker OK, Nginx check karo
   → Agar nahi aaye: Docker problem

Step 4: Nginx config sahi hai?
   $ sudo nginx -t
   → Error aaye toh config fix karo

Step 5: DNS sahi hai?
   $ nslookup yourdomain.com
   → IP match hona chahiye server se

Step 6: SSL sahi hai?
   $ curl -v https://yourdomain.com
   → Certificate check karo
```

### Common Errors

| Error | Matlab | Fix |
|-------|--------|-----|
| `EADDRINUSE` | Port already in use | Doosra port use karo |
| `ECONNREFUSED` | Container band hai | `docker start` karo |
| `502 Bad Gateway` | Nginx container se baat nahi kar pa raha | Container restart karo, port check karo |
| `ERR_MODULE_NOT_FOUND` | npm package missing | `npm install` karo, package.json check karo |
| `permission denied` | Permission nahi hai | `sudo` lagao |
| `Connection timed out` | Firewall ya wrong IP | Firewall check karo, IP check karo |

### Emergency Commands

```bash
# Sab containers restart karo
docker restart $(docker ps -q)

# Nginx restart karo
sudo systemctl restart nginx

# Server reboot karo (LAST RESORT)
sudo reboot
```

---

## Summary - Ek Slide Mein Sab

```
Local PC:     Code likhte ho, test karte ho
    ↓ git push
GitHub:       Code store hota hai
    ↓ Coolify pulls
VPS:          Server jo 24/7 chalu hai
    ├── Coolify:  Docker containers manage karta hai
    ├── Docker:   Apps isolated containers mein chalata hai
    ├── Nginx:    Domains ko sahi container pe bhejta hai
    ├── Certbot:  Free SSL certificates deta hai
    └── MongoDB:  Data store karta hai

Domain → DNS → VPS IP → Nginx → Docker Container → App
```

**Yaad rakhne wali cheezein:**
1. VPS = Tumhara rented computer (91.239.208.85)
2. Docker = Har app apne dabba mein
3. Nginx = Domain → sahi port
4. Coolify = Dashboard to manage it all
5. SSL = HTTPS ka padlock
6. `sudo nginx -t` HAMESHA config test karo
7. `docker logs` se debugging karo
8. Har app ka alag port hona chahiye

---

*Guide by Claude for Ankur @ Meroxio*
*Last updated: April 2026*
