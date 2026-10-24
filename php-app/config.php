<?php
/**
 * Village Council Land Pass Management System
 * Core Configuration & Database Bootstrap
 * 
 * Works with PHP 7.4+ and MySQL 5.7+ / MariaDB 10+
 * Zero JavaScript / Zero Firebase dependencies
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// -----------------------------------------------------------------------------
// Database Settings (Update these for your cPanel / XAMPP / Hostinger server)
// -----------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'landpass_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');

// Application Constants
define('APP_NAME', 'Village Council Land Pass Portal');
define('APP_STATE', 'Mizoram');
define('MASTER_AUTHORITY_KEY', '785392');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_URL', 'uploads/');

// -----------------------------------------------------------------------------
// PDO Database Connection Helper
// -----------------------------------------------------------------------------
function get_db(): ?PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // If database connection fails, redirect to install.php if not already there
        $currentPage = basename($_SERVER['PHP_SELF'] ?? '');
        if ($currentPage !== 'install.php') {
            $_SESSION['db_error'] = "Database connection failed: " . $e->getMessage();
            header("Location: install.php");
            exit;
        }
        return null;
    }
}

// -----------------------------------------------------------------------------
// Authentication & Permission Helpers
// -----------------------------------------------------------------------------
function is_logged_in(): bool {
    return !empty($_SESSION['user_uid']);
}

function is_authority(): bool {
    return !empty($_SESSION['is_authority']) || (isset($_SESSION['user_type']) && in_array($_SESSION['user_type'], ['authority', 'admin']));
}

function current_user(): ?array {
    if (!is_logged_in()) {
        return null;
    }
    return [
        'uid' => $_SESSION['user_uid'] ?? '',
        'username' => $_SESSION['username'] ?? '',
        'display_name' => $_SESSION['display_name'] ?? '',
        'phone_number' => $_SESSION['phone_number'] ?? '',
        'village_id' => $_SESSION['village_id'] ?? '',
        'village_name' => $_SESSION['village_name'] ?? '',
        'user_type' => $_SESSION['user_type'] ?? 'secretary',
        'status' => $_SESSION['status'] ?? 'pending',
    ];
}

function require_login(): void {
    if (!is_logged_in() && !is_authority()) {
        flash('error', 'Please login to access the Village Council Land Pass registry.');
        header('Location: login.php');
        exit;
    }
}

function require_authority(): void {
    if (!is_authority()) {
        flash('error', 'Access denied. Master Authority permission required.');
        header('Location: login.php');
        exit;
    }
}

// -----------------------------------------------------------------------------
// Village Configuration Helper
// -----------------------------------------------------------------------------
function get_current_village(PDO $pdo, ?string $villageId = null): array {
    $default = [
        'id' => 'village_default',
        'village_name' => 'VILLAGE COUNCIL, MIZORAM',
        'block_name' => '',
        'district_name' => 'Mizoram',
        'state_name' => 'Mizoram',
        'pin_code' => '',
        'huan_ram_prefix' => 'MZ-VC-HR-',
        'in_hmun_prefix' => 'MZ-VC-IH-',
        'starting_pass_number' => 1001,
        'starting_huan_ram_number' => 1001,
        'starting_in_hmun_number' => 1001,
        'conditions_and_terms' => "CONDITIONS & RESTRICTION:\n1. Huan ram / In hmun hi ramri ziah anga pek a ni a.\n2. An ri-te inkar chin a huam ang.\n3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.\n4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.\n5. VC ten tul bik thil ah an cancel thei ang.\n6. Vantlang leh sawrkar pawimawh ah a tul angin zangnadawmna pe lo in hman theih a ni ang.",
        'president_name' => '',
        'secretary_name' => '',
        'logo_url' => '',
        'emblem_logo_url' => '',
    ];

    if (!$villageId && is_logged_in()) {
        $villageId = $_SESSION['village_id'] ?? null;
    }

    if ($villageId) {
        $stmt = $pdo->prepare("SELECT * FROM `villages` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$villageId]);
        $row = $stmt->fetch();
        if ($row) {
            return array_merge($default, $row);
        }
    }

    // Fallback: check first village in DB
    $stmt = $pdo->query("SELECT * FROM `villages` ORDER BY `created_at` ASC LIMIT 1");
    $row = $stmt ? $stmt->fetch() : null;
    return $row ? array_merge($default, $row) : $default;
}

// -----------------------------------------------------------------------------
// Automatic Next Pass Number Generator with Custom Starting Number
// -----------------------------------------------------------------------------
function get_next_pass_number(PDO $pdo, string $villageId, string $passType, ?string $customPrefix = null, ?int $startingNumber = null): string {
    $village = get_current_village($pdo, $villageId);

    $isHuanRam = ($passType === 'huan_ram');
    $prefix = $customPrefix ?: ($isHuanRam ? $village['huan_ram_prefix'] : $village['in_hmun_prefix']);
    if (empty($prefix)) {
        $prefix = $isHuanRam ? 'MZ-VC-HR-' : 'MZ-VC-IH-';
    }

    $start = $startingNumber;
    if ($start === null || $start <= 0) {
        $start = (int)($isHuanRam ? $village['starting_huan_ram_number'] : $village['starting_in_hmun_number']);
        if ($start <= 0) {
            $start = (int)($village['starting_pass_number'] ?? 1001);
        }
    }
    if ($start <= 0) $start = 1001;

    // Fetch existing pass numbers for this village and type
    $stmt = $pdo->prepare("SELECT `pass_number` FROM `land_passes` WHERE `village_id` = ? AND `pass_type` = ?");
    $stmt->execute([$villageId, $passType]);
    $existingRows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $highest = $start - 1;
    foreach ($existingRows as $num) {
        // Match numbers at the end of the pass string
        if (preg_match('/(\d+)$/', $num, $matches)) {
            $val = (int)$matches[1];
            if ($val > $highest) {
                $highest = $val;
            }
        }
    }

    $nextNum = $highest + 1;
    if ($nextNum < $start) {
        $nextNum = $start;
    }

    // Ensure format matches prefix
    return rtrim($prefix, '-/') . '-' . $nextNum;
}

// -----------------------------------------------------------------------------
// Flash Messages Helper
// -----------------------------------------------------------------------------
function flash(string $type, string $message): void {
    if (!isset($_SESSION['flash'])) {
        $_SESSION['flash'] = [];
    }
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function get_flash(): array {
    $messages = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $messages;
}

// -----------------------------------------------------------------------------
// Security & CSRF Helper
// -----------------------------------------------------------------------------
function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(?string $token): bool {
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

function sanitize(string $val): string {
    return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8');
}

// -----------------------------------------------------------------------------
// Audit Logger
// -----------------------------------------------------------------------------
function log_activity(PDO $pdo, string $action, string $targetId, string $targetName, string $performedBy, string $details): void {
    try {
        $stmt = $pdo->prepare("INSERT INTO `audit_logs` (`id`, `timestamp`, `action`, `target_id`, `target_name`, `performed_by`, `details`) VALUES (?, NOW(), ?, ?, ?, ?, ?)");
        $id = 'log_' . bin2hex(random_bytes(8));
        $stmt->execute([$id, $action, $targetId, $targetName, $performedBy, $details]);
    } catch (Exception $e) {
        // Silently skip audit failures
    }
}
