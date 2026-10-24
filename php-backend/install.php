<?php
/**
 * Village Council Land Pass Management System
 * 1-Click PHP & MySQL Web Installer
 * 
 * Sets up MySQL tables automatically with zero command-line needed.
 */

require_once __DIR__ . '/config.php';

$message = null;
$status = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['run_install'])) {
    $host = trim($_POST['db_host'] ?? 'localhost');
    $name = trim($_POST['db_name'] ?? 'landpass_db');
    $user = trim($_POST['db_user'] ?? 'root');
    $pass = $_POST['db_pass'] ?? '';
    $port = trim($_POST['db_port'] ?? '3306');

    try {
        // Connect to MySQL server
        $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // Create database if not exists
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        $pdo->exec("USE `{$name}`;");

        // Execute schema.sql
        $schemaPath = __DIR__ . '/schema.sql';
        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);
            $pdo->exec($sql);
            $message = "Database and tables successfully created in MySQL! You can now use PHP Storage.";
            $status = 'success';

            // Also update config.php if writable
            $configFile = __DIR__ . '/config.php';
            if (is_writable($configFile)) {
                $configContent = file_get_contents($configFile);
                $configContent = preg_replace("/define\('DB_HOST', '.*?'\);/", "define('DB_HOST', '{$host}');", $configContent);
                $configContent = preg_replace("/define\('DB_NAME', '.*?'\);/", "define('DB_NAME', '{$name}');", $configContent);
                $configContent = preg_replace("/define\('DB_USER', '.*?'\);/", "define('DB_USER', '{$user}');", $configContent);
                $configContent = preg_replace("/define\('DB_PASS', '.*?'\);/", "define('DB_PASS', '{$pass}');", $configContent);
                $configContent = preg_replace("/define\('DB_PORT', '.*?'\);/", "define('DB_PORT', '{$port}');", $configContent);
                file_put_contents($configFile, $configContent);
            }
        } else {
            $message = "Error: schema.sql file not found in " . __DIR__;
            $status = 'error';
        }
    } catch (PDOException $e) {
        $message = "MySQL Connection failed: " . $e->getMessage();
        $status = 'error';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Village Council Land Pass - PHP &amp; MySQL Installer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-100 text-neutral-900 min-h-screen flex items-center justify-center p-4">
  <div class="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
    <div class="bg-emerald-950 p-6 text-white text-center">
      <h1 class="text-xl font-bold tracking-wide">Mizoram Village Council Portal</h1>
      <p class="text-xs text-emerald-300 mt-1">PHP &amp; MySQL Storage Backend 1-Click Installer</p>
    </div>

    <div class="p-6 space-y-6">
      <?php if ($message): ?>
        <div class="p-4 rounded-xl text-sm font-semibold <?php echo $status === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'; ?>">
          <?php echo htmlspecialchars($message); ?>
        </div>
      <?php endif; ?>

      <p class="text-xs text-neutral-600 leading-relaxed">
        This installer creates the required tables (<code class="font-mono bg-neutral-100 px-1 py-0.5 rounded">villages</code>, <code class="font-mono bg-neutral-100 px-1 py-0.5 rounded">users</code>, <code class="font-mono bg-neutral-100 px-1 py-0.5 rounded">land_passes</code>, <code class="font-mono bg-neutral-100 px-1 py-0.5 rounded">audit_logs</code>) in your MySQL database.
      </p>

      <form method="POST" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase text-neutral-700 mb-1">Database Host</label>
          <input type="text" name="db_host" value="<?php echo htmlspecialchars($_POST['db_host'] ?? DB_HOST); ?>" required class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold uppercase text-neutral-700 mb-1">Database Name</label>
            <input type="text" name="db_name" value="<?php echo htmlspecialchars($_POST['db_name'] ?? DB_NAME); ?>" required class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-neutral-700 mb-1">Port</label>
            <input type="text" name="db_port" value="<?php echo htmlspecialchars($_POST['db_port'] ?? DB_PORT); ?>" required class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold uppercase text-neutral-700 mb-1">MySQL Username</label>
            <input type="text" name="db_user" value="<?php echo htmlspecialchars($_POST['db_user'] ?? DB_USER); ?>" required class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-neutral-700 mb-1">MySQL Password</label>
            <input type="password" name="db_pass" placeholder="Password" class="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm">
          </div>
        </div>

        <button type="submit" name="run_install" class="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-sm">
          Install / Create MySQL Tables
        </button>
      </form>

      <div class="border-t border-neutral-200 pt-4 text-center">
        <a href="api.php?action=status" target="_blank" class="text-xs text-emerald-700 hover:underline font-bold">
          Check API Status (api.php?action=status) &rarr;
        </a>
      </div>
    </div>
  </div>
</body>
</html>
