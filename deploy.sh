#!/bin/bash

echo "🚀 Starting temporal-game deployment..."

# Step 1: Create required directories
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Step 2: Replace email in production config
read -p "Have you updated the email address? (y/n): " email_updated
if [ "$email_updated" != "y" ]; then
    echo "Please edit docker-compose.prod.yml and replace 'your-email@inesctec.pt' with your actual email"
    exit 1
fi

# Step 3: Start services for SSL certificate generation
cp nginx-init.conf nginx.conf
docker compose -f docker-compose.prod.yml up -d nginx

# Step 4: Get SSL certificates
docker compose -f docker-compose.prod.yml run --rm certbot

# Step 5: Update nginx configuration with SSL
cp nginx.conf nginx-ssl.conf  # backup
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name temporal-game.inesctec.pt;
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name temporal-game.inesctec.pt;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/temporal-game.inesctec.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/temporal-game.inesctec.pt/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy to frontend (Next.js)
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes to backend (Flask)
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Step 6: Build application images
docker compose -f docker-compose.prod.yml build

# Step 7: Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.prod.yml up -d

# Step 8: Set up certificate renewal
echo "⏰ Setting up certificate renewal..."
# Add a cron job for certificate renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/docker compose -f $(pwd)/docker-compose.prod.yml run --rm certbot renew --quiet && /usr/bin/docker compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -

echo "✅ Deployment complete!"
echo "🌐 Your application should be available at https://temporal-game.inesctec.pt"
echo ""
echo "📊 Check status with: docker compose -f docker-compose.prod.yml ps"
echo "📋 View logs with: docker compose -f docker-compose.prod.yml logs -f" 