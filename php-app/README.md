# Village Council Land Pass Management System
## Standalone PHP, MySQL, HTML & CSS Web Hosting Package
**Zero JavaScript Framework & Zero Firebase Dependency**

This complete web application runs on any standard web hosting server:
- cPanel shared hosting (Hostinger, GoDaddy, Bluehost, Namecheap, BigRock, etc.)
- VPS or Dedicated servers running Apache or Nginx with PHP 7.4, 8.0, 8.1, 8.2, or 8.3
- Local development servers (XAMPP, WampServer, MAMP, Laragon)

---

## 1. Quick Setup on Another Domain (cPanel / Shared Hosting)

### Step 1: Upload Files
1. Log in to your hosting cPanel.
2. Open **File Manager** and navigate to your domain's document root (e.g., `public_html/` or a subfolder like `public_html/landpass/`).
3. Upload all files from this `php-app` directory.

### Step 2: Run 1-Click Installer
1. In your web browser, navigate to:
   ```
   https://your-domain.com/install.php
   ```
2. Enter your MySQL database credentials (Database Host, Database Name, Username, Password).
3. Click **"Install & Create MySQL Tables"**.
4. The installer creates all tables (`villages`, `users`, `land_passes`, `audit_logs`) and default administrator accounts automatically!

---

## 2. Default Login Accounts
After installation, the following accounts are ready:

- **Master Authority Key**:
  - Key: `785392` (Enter as Username or Password)
  - Role: Full Authority Master Mode (Approves registrations, audits all passes)

- **Default Council Secretary**:
  - Username: `secretary`
  - Password: `password123`

- **Register New Secretary**:
  - Visit: `https://your-domain.com/register.php`
  - Fill in your council details and starting pass numbers to issue passes immediately!

---

## 3. Local Development on XAMPP
1. Start **Apache** and **MySQL** in XAMPP Control Panel.
2. Copy the `php-app` folder into `C:/xampp/htdocs/landpass/`.
3. Open `http://localhost/landpass/install.php` in your browser.
4. Database host is `localhost`, username is `root`, password is empty. Click Install.
5. Your application is now live at `http://localhost/landpass/`!

---

## 4. Key Features
- **Official Print Engine**: Pure CSS `@media print` generates official A4 Land Pass certificates with official council seals, president & secretary signatures, and boundaries.
- **Strict Data Scoping**: Each secretary only sees their own council's land passes; cross-village leaks are impossible.
- **Configurable Starting Numbers**: Set starting Huan Ram and In Hmun numbers (e.g. 1001 or custom series).
- **Public Verification**: Fast pass verification by serial number without requiring login.
- **Full Database Export**: 1-click download of `.sql` or `.csv` backup files.
