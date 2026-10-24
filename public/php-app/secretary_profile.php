<?php
$pageTitle = 'Secretary Profile Management';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();
$currentVillage = get_current_village($pdo);

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf_token'] ?? '';
    $displayName = trim($_POST['display_name'] ?? '');
    $phoneNumber = trim($_POST['phone_number'] ?? '');
    $newPassword = $_POST['new_password'] ?? '';

    if (!verify_csrf($csrf)) {
        $error = 'Security session expired. Please try again.';
    } elseif (empty($displayName)) {
        $error = 'Full Name is required.';
    } else {
        if (!empty($newPassword)) {
            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE `users` SET `display_name` = ?, `phone_number` = ?, `password_hash` = ? WHERE `uid` = ?");
            $stmt->execute([$displayName, $phoneNumber, $hash, $user['uid']]);
        } else {
            $stmt = $pdo->prepare("UPDATE `users` SET `display_name` = ?, `phone_number` = ? WHERE `uid` = ?");
            $stmt->execute([$displayName, $phoneNumber, $user['uid']]);
        }

        $_SESSION['display_name'] = $displayName;
        $_SESSION['phone_number'] = $phoneNumber;

        log_activity($pdo, 'UPDATE_PROFILE', $user['uid'], $user['username'], $displayName, "Secretary updated profile information");
        flash('success', 'Secretary profile updated successfully!');
        header('Location: secretary_profile.php');
        exit;
    }
}

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 650px; margin: 0 auto;">
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="background-color: var(--primary-50);">
      <div>
        <h2 style="color: var(--primary-900);">Secretary Profile</h2>
        <p style="font-size: 0.8rem; color: var(--neutral-600);">
          Manage your account credentials and contact details
        </p>
      </div>
    </div>
    <div class="card-body">
      <?php if ($error): ?>
        <div class="flash-message flash-error">
          <span><?php echo htmlspecialchars($error); ?></span>
        </div>
      <?php endif; ?>

      <form method="POST" action="secretary_profile.php">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

        <div class="form-group">
          <label class="form-label">Username (Permanent)</label>
          <input type="text" value="<?php echo htmlspecialchars($user['username']); ?>" disabled class="form-control" style="background-color: var(--neutral-100); font-family: var(--font-mono);">
        </div>

        <div class="form-group">
          <label class="form-label">Associated Village Council</label>
          <input type="text" value="<?php echo htmlspecialchars($currentVillage['village_name']); ?>" disabled class="form-control" style="background-color: var(--neutral-100); font-weight: bold; color: var(--primary-900);">
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Full Name of Secretary *</label>
            <input type="text" name="display_name" value="<?php echo htmlspecialchars($_POST['display_name'] ?? $user['display_name']); ?>" required class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Contact Phone Number</label>
            <input type="text" name="phone_number" value="<?php echo htmlspecialchars($_POST['phone_number'] ?? $user['phone_number']); ?>" class="form-control">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Change Password (Leave blank to keep existing)</label>
          <input type="password" name="new_password" placeholder="Enter new password if changing" class="form-control">
        </div>

        <div style="margin-top: 24px; text-align: right;">
          <button type="submit" class="btn btn-primary" style="padding: 10px 24px;">
            Save Profile Updates &rarr;
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
