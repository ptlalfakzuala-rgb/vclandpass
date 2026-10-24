# Village Council Land Pass - PHP & MySQL Storage Backend

This package allows you to run the complete data storage backend for the **Mizoram Village Council Land Pass Management System** on any PHP-capable web server:
- cPanel / Plesk shared hosting (Hostinger, GoDaddy, Bluehost, Namecheap, etc.)
- Local development on XAMPP / WampServer / MAMP / Laragon
- VPS or Dedicated Linux server running Apache or Nginx with PHP 7.4, 8.0, 8.1, 8.2, or 8.3

---

## Quick Setup Guide

### Method A: Using 1-Click Web Installer (Recommended)
1. Copy the `php-backend` folder to your website directory (e.g., `public_html/php-backend/` or `htdocs/php-backend/`).
2. Open your browser and navigate to: `http://your-domain.com/php-backend/install.php`
3. Enter your MySQL database credentials (Host, Database Name, User, Password).
4. Click **"Install / Create MySQL Tables"**.
5. Once completed, your PHP storage endpoint is ready at: `http://your-domain.com/php-backend/api.php`

---

### Method B: Manual MySQL Setup (phpMyAdmin)
1. Log in to your cPanel or phpMyAdmin.
2. Create a database named `landpass_db` (or your choice).
3. Click **Import**, choose `schema.sql`, and click **Go**.
4. Open `config.php` and update the constants:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_mysql_username');
   define('DB_PASS', 'your_mysql_password');
   ```

---

### Zero-Configuration Mode (Flat-file JSON Storage)
If MySQL is not installed or configured yet, the PHP backend automatically falls back to secure JSON file storage inside `./data/`. No configuration is required.

---

## Connecting the Frontend to Your PHP Backend
1. In the Web App, click **Settings** or the **PHP Storage** button in the navigation bar.
2. Under **PHP Storage Backend**, paste your PHP API URL:
   `http://your-domain.com/php-backend/api.php`
3. Click **Test PHP Connection** to verify connection.
4. Click **"Transfer All Data to PHP Backend"** to migrate all existing Land Passes, Village Profiles, Users, and Audit Logs directly to your MySQL database!
