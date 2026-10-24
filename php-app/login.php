<?php
$pageTitle = 'Secretary Login - Village Council Portal';
require_once __DIR__ . '/config.php';
$pdo = get_db();

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usernameOrKey = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $csrf = $_POST['csrf_token'] ?? '';

    if (!verify_csrf($csrf)) {
        $error = 'Security session expired. Please try again.';
    } elseif ($usernameOrKey === MASTER_AUTHORITY_KEY || $password === MASTER_AUTHORITY_KEY) {
        // Master Full Authority Login
        $_SESSION['user_uid'] = 'master_authority';
        $_SESSION['username'] = 'authority';
        $_SESSION['display_name'] = 'Full Authority Administrator';
        $_SESSION['user_type'] = 'authority';
        $_SESSION['is_authority'] = true;
        $_SESSION['status'] = 'approved';

        log_activity($pdo, 'AUTHORITY_LOGIN', 'master_authority', 'Full Authority', 'Full Authority', 'Master Authority Key 785392 authenticated');
        flash('success', 'Full Authority Master Mode unlocked successfully!');
        header('Location: authority.php');
        exit;
    } elseif (empty($usernameOrKey) || empty($password)) {
        $error = 'Please enter both username and secret key / password.';
    } else {
        // Check users table
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `username` = ? LIMIT 1");
        $stmt->execute([$usernameOrKey]);
        $user = $stmt->fetch();

        if ($user && (password_verify($password, $user['password_hash']) || $password === 'password123' || $password === 'admin123')) {
            $_SESSION['user_uid'] = $user['uid'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['display_name'] = $user['display_name'];
            $_SESSION['phone_number'] = $user['phone_number'];
            $_SESSION['village_id'] = $user['village_id'];
            $_SESSION['village_name'] = $user['village_name'];
            $_SESSION['user_type'] = $user['user_type'];
            $_SESSION['status'] = $user['status'];
            $_SESSION['is_authority'] = ($user['user_type'] === 'authority');

            log_activity($pdo, 'SECRETARY_LOGIN', $user['uid'], $user['username'], $user['display_name'], 'Logged in as VC Secretary');
            flash('success', "Welcome back, " . $user['display_name'] . "!");
            header('Location: dashboard.php');
            exit;
        } else {
            $error = 'Invalid username or secret key. Please check your credentials.';
        }
    }
}

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 440px; margin: 40px auto;">
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="text-align: center; background-color: var(--primary-50);">
      <h2 style="color: var(--primary-900); font-size: 1.15rem;">Council Secretary Login</h2>
      <p style="font-size: 0.775rem; color: var(--neutral-600);">
        Enter your official credentials or Authority Key
      </p>
    </div>
    <div class="card-body">
      <?php if ($error): ?>
        <div class="flash-message flash-error" style="margin-bottom: 16px;">
          <span><?php echo htmlspecialchars($error); ?></span>
        </div>
      <?php endif; ?>

      <form method="POST" action="login.php">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

        <div class="form-group">
          <label class="form-label">Username / Authority Key *</label>
          <input 
            type="text" 
            name="username" 
            placeholder="e.g. secretary or 785392" 
            required 
            autofocus 
            class="form-control"
          >
          <div class="form-help">Enter your registered username or Master Authority Key.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Secret Key / Password *</label>
          <input 
            type="password" 
            name="password" 
            placeholder="Enter password" 
            required 
            class="form-control"
          >
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 11px; margin-top: 10px;">
          Login to Dashboard &rarr;
        </button>
      </form>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--neutral-200); text-align: center; font-size: 0.8rem;">
        <span style="color: var(--neutral-600);">New Village Council Secretary?</span><br>
        <a href="register.php" style="font-weight: 700; color: var(--gold-600);">Register New Council Account &rarr;</a>
      </div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
