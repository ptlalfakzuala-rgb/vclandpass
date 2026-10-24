<?php
$message = null;
$status = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['run_install'])) {
    $host = trim($_POST['db_host'] ?? 'localhost');
    $name = trim($_POST['db_name'] ?? 'landpass_db');
    $user = trim($_POST['db_user'] ?? 'root');
    $pass = $_POST['db_pass'] ?? '';
    $port = trim($_POST['db_port'] ?? '3306');

    try {
        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // Create database
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        $pdo->exec("USE `{$name}`;");

        // Run schema.sql
        $schemaFile = __DIR__ . '/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $pdo->exec($sql);

            // Update config.php
            $configFile = __DIR__ . '/config.php';
            if (is_writable($configFile)) {
                $content = file_get_contents($configFile);
                $content = preg_replace("/define\('DB_HOST', '.*?'\);/", "define('DB_HOST', '{$host}');", $content);
                $content = preg_replace("/define\('DB_NAME', '.*?'\);/", "define('DB_NAME', '{$name}');", $content);
                $content = preg_replace("/define\('DB_USER', '.*?'\);/", "define('DB_USER', '{$user}');", $content);
                $content = preg_replace("/define\('DB_PASS', '.*?'\);/", "define('DB_PASS', '{$pass}');", $content);
                $content = preg_replace("/define\('DB_PORT', '.*?'\);/", "define('DB_PORT', '{$port}');", $content);
                file_put_contents($configFile, $content);
            }

            $message = "Database '{$name}' and all tables (villages, users, land_passes, audit_logs) were created successfully!";
            $status = 'success';
        } else {
            $message = "Error: schema.sql not found in " . __DIR__;
            $status = 'error';
        }
    } catch (PDOException $e) {
        $message = "MySQL Connection Error: " . $e->getMessage();
        $status = 'error';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>1-Click Web Installer - Village Council Land Pass</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>
<body style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">

<div style="max-width: 500px; width: 100%; background: #ffffff; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--neutral-200); overflow: hidden;">
  <div style="background: var(--primary-950); color: #ffffff; padding: 24px; text-align: center; border-bottom: 2px solid var(--gold-600);">
    <h1 style="font-size: 1.25rem; font-family: var(--font-serif); margin-bottom: 4px; color: #ffffff;">Village Council Land Pass Portal</h1>
    <p style="font-size: 0.775rem; color: #a7f3d0;">1-Click PHP &amp; MySQL Web Server Installer</p>
  </div>

  <div style="padding: 24px;">
    <?php if ($message): ?>
      <div class="flash-message flash-<?php echo $status === 'success' ? 'success' : 'error'; ?>">
        <span><?php echo htmlspecialchars($message); ?></span>
      </div>
      <?php if ($status === 'success'): ?>
        <div style="text-align: center; margin-top: 20px;">
          <a href="login.php" class="btn btn-primary" style="padding: 12px 24px; width: 100%;">
            Go to Login &amp; Dashboard &rarr;
          </a>
        </div>
      <?php endif; ?>
    <?php endif; ?>

    <?php if ($status !== 'success'): ?>
      <p style="font-size: 0.825rem; color: var(--neutral-600); margin-bottom: 20px;">
        Enter your MySQL database credentials (from cPanel MySQL Databases or local XAMPP) to automatically create all tables:
      </p>

      <form method="POST" action="install.php">
        <div class="form-group">
          <label class="form-label">Database Host</label>
          <input type="text" name="db_host" value="<?php echo htmlspecialchars($_POST['db_host'] ?? 'localhost'); ?>" required class="form-control">
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Database Name</label>
            <input type="text" name="db_name" value="<?php echo htmlspecialchars($_POST['db_name'] ?? 'landpass_db'); ?>" required class="form-control" style="font-family: var(--font-mono);">
          </div>
          <div class="form-group">
            <label class="form-label">Port</label>
            <input type="text" name="db_port" value="<?php echo htmlspecialchars($_POST['db_port'] ?? '3306'); ?>" required class="form-control" style="font-family: var(--font-mono);">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">MySQL Username</label>
            <input type="text" name="db_user" value="<?php echo htmlspecialchars($_POST['db_user'] ?? 'root'); ?>" required class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">MySQL Password</label>
            <input type="password" name="db_pass" placeholder="Password" class="form-control">
          </div>
        </div>

        <button type="submit" name="run_install" value="1" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px; font-weight: bold;">
          Install &amp; Create MySQL Tables &rarr;
        </button>
      </form>
    <?php endif; ?>
  </div>
</div>

</body>
</html>
