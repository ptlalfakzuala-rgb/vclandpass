<?php
$pageTitle = 'Delete Land Pass - Confirmation';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();
$id = trim($_GET['id'] ?? '');

if (empty($id)) {
    flash('error', 'Land Pass ID missing.');
    header('Location: dashboard.php');
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM `land_passes` WHERE `id` = ? LIMIT 1");
$stmt->execute([$id]);
$pass = $stmt->fetch();

if (!$pass) {
    flash('error', 'Land Pass not found.');
    header('Location: dashboard.php');
    exit;
}

// Permission check
if (!is_authority() && $pass['village_id'] !== $user['village_id'] && $pass['created_by'] !== $user['uid']) {
    flash('error', 'You do not have permission to delete this pass.');
    header('Location: dashboard.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_delete'])) {
    $csrf = $_POST['csrf_token'] ?? '';
    if (!verify_csrf($csrf)) {
        flash('error', 'Security session expired. Please try again.');
    } else {
        $stmt = $pdo->prepare("DELETE FROM `land_passes` WHERE `id` = ?");
        $stmt->execute([$id]);

        log_activity($pdo, 'DELETE_PASS', $id, $pass['pass_number'], $user['display_name'], "Permanently deleted Land Pass for {$pass['owner_name']} ({$pass['pass_number']})");
        flash('info', "Land Pass {$pass['pass_number']} for {$pass['owner_name']} permanently deleted from database.");
        header('Location: dashboard.php');
        exit;
    }
}

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 520px; margin: 40px auto;">
  <div class="card" style="border-top: 4px solid #ef4444;">
    <div class="card-header" style="background-color: #fef2f2;">
      <h2 style="color: #991b1b; font-size: 1.1rem;">Warning: Delete Land Pass Record</h2>
    </div>
    <div class="card-body">
      <p style="font-size: 0.9rem; color: var(--neutral-800); margin-bottom: 16px;">
        Are you sure you want to permanently delete Land Pass <strong><?php echo htmlspecialchars($pass['pass_number']); ?></strong> issued to <strong><?php echo htmlspecialchars($pass['owner_name']); ?></strong>?
      </p>

      <div style="background-color: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); padding: 12px; margin-bottom: 20px; font-size: 0.825rem;">
        <div><strong>Type:</strong> <?php echo $pass['pass_type'] === 'huan_ram' ? 'Huan Ram (Agricultural)' : 'In Hmun (Residential)'; ?></div>
        <div><strong>Location:</strong> <?php echo htmlspecialchars($pass['location_address'] ?: 'N/A'); ?></div>
        <div><strong>Date of Issue:</strong> <?php echo htmlspecialchars($pass['issue_date']); ?></div>
      </div>

      <p style="font-size: 0.775rem; color: #b91c1c; margin-bottom: 20px;">
        &bull; This operation is permanent and will remove the official land record from your MySQL database.
      </p>

      <form method="POST" action="delete_pass.php?id=<?php echo urlencode($id); ?>" style="display: flex; gap: 10px; justify-content: flex-end;">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
        <a href="dashboard.php" class="btn btn-secondary">Cancel</a>
        <button type="submit" name="confirm_delete" value="1" class="btn btn-danger" style="padding: 9px 20px;">
          Yes, Delete Permanently
        </button>
      </form>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
