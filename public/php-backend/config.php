<?php
/**
 * Village Council Land Pass Management System
 * PHP Storage Backend Configuration
 * 
 * Supports two storage modes:
 * 1. MySQL Database (Recommended for production / cPanel / Shared Hosting)
 * 2. Flat-file JSON Storage (Zero-configuration fallback in ./data/ folder)
 */

// Allow Cross-Origin Resource Sharing (CORS) from any frontend origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
} else {
    header("Access-Control-Allow-Origin: *");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');

// -----------------------------------------------------------------------------
// Database Settings (Update these for your MySQL server in cPanel / XAMPP)
// -----------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'landpass_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');

// Data directory for JSON storage fallback
define('DATA_DIR', __DIR__ . '/data');

// Secret key for authentication tokens / signatures
define('APP_SECRET_KEY', 'mizoram_vc_landpass_secret_2026');

// -----------------------------------------------------------------------------
// Database Connection Helper
// -----------------------------------------------------------------------------
class Database {
    private static ?PDO $pdo = null;
    private static bool $triedConnection = false;
    private static bool $usingJsonFallback = false;

    public static function getConnection(): ?PDO {
        if (self::$triedConnection) {
            return self::$pdo;
        }

        self::$triedConnection = true;

        // Try connecting to MySQL
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            self::$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            self::$usingJsonFallback = false;
            return self::$pdo;
        } catch (PDOException $e) {
            // MySQL connection failed or not yet configured -> fallback to JSON file storage
            self::$pdo = null;
            self::$usingJsonFallback = true;
            return null;
        }
    }

    public static function isJsonFallback(): bool {
        self::getConnection();
        return self::$usingJsonFallback;
    }
}

// -----------------------------------------------------------------------------
// JSON File Storage Helper (Fallback when MySQL is not configured)
// -----------------------------------------------------------------------------
class JsonStorage {
    private static function ensureDirectory(): void {
        if (!is_dir(DATA_DIR)) {
            mkdir(DATA_DIR, 0755, true);
            // Protect data folder with .htaccess
            file_put_contents(DATA_DIR . '/.htaccess', "Deny from all\n");
        }
    }

    public static function read(string $collection): array {
        self::ensureDirectory();
        $file = DATA_DIR . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $collection) . '.json';
        if (!file_exists($file)) {
            return [];
        }
        $content = file_get_contents($file);
        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

    public static function write(string $collection, array $data): bool {
        self::ensureDirectory();
        $file = DATA_DIR . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $collection) . '.json';
        return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
    }

    public static function saveItem(string $collection, string $idKey, array $item): bool {
        $items = self::read($collection);
        $id = $item[$idKey] ?? null;
        if (!$id) return false;

        $found = false;
        foreach ($items as $idx => $existing) {
            if (isset($existing[$idKey]) && $existing[$idKey] === $id) {
                $items[$idx] = array_merge($existing, $item);
                $found = true;
                break;
            }
        }
        if (!$found) {
            $items[] = $item;
        }
        return self::write($collection, $items);
    }

    public static function deleteItem(string $collection, string $idKey, string $id): bool {
        $items = self::read($collection);
        $filtered = array_values(array_filter($items, fn($it) => ($it[$idKey] ?? '') !== $id));
        return self::write($collection, $filtered);
    }
}
