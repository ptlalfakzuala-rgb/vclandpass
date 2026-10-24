<?php
$pageTitle = 'Master Authority Management - Full System Control';
require_once __DIR__ . '/config.php';
require_authority();
$pdo = get_db();

$user = current_user();

// Handle User Approval / Rejection
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action_type'])) {
    $targetUid = trim($_POST['target_uid'] ?? '');
    $actionType = trim($_POST['action_type'] ?? '');
    $csrf = $_POST['csrf_token'] ?? '';

    if (verify_csrf($csrf) && !empty($targetUid)) {
        if ($actionType === 'approve') {
            $stmt = $pdo->prepare("UPDATE `users` SET `status` = 'approved', `approved_at` = NOW(), `approved_by` = 'Master Authority' WHERE `uid` = ?");
            $stmt->execute([$targetUid]);
            log_activity($pdo, 'AUTHORITY_APPROVE_USER', $targetUid, $targetUid, 'Full Authority', 'Approved secretary registration for lifetime live status');
            flash('success', "Secretary account ($targetUid) approved! Account is now Live for Lifetime.");
        } elseif ($actionType === 'reject') {
            $stmt = $pdo->prepare("UPDATE `users` SET `status` = 'rejected' WHERE `uid` = ?");
            $stmt->execute([$targetUid]);
            log_activity($pdo, 'AUTHORITY_REJECT_USER', $targetUid, $targetUid, 'Full Authority', 'Rejected secretary registration');
            flash('info', "Secretary account ($targetUid) rejected.");
        }
        header('Location: authority.php');
        exit;
    }
}

// Fetch all registered users
$users = $pdo->query("SELECT * FROM `users` ORDER BY `created_at` DESC")->fetchAll();

// Statistics across all councils
$totalPasses = $pdo->query("SELECT COUNT(*) FROM `land_passes`")->fetchColumn();
$totalVillages = $pdo->query("SELECT COUNT(*) FROM `villages`")->fetchColumn();
$totalUsers = count($users);

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 1100px; margin: 0 auto;">
  <!-- Authority Banner -->
  <div style="background: linear-gradient(135deg, #022c22, #064e3b); color: #ffffff; padding: 20px 24px; border-radius: var(--radius-lg); margin-bottom: 24px; border: 1px solid var(--gold-600); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
    <div>
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #fde68a;">Master Authority Control Center</h2>
      <p style="font-size: 0.8rem; color: #a7f3d0; margin-top: 2px;">
        Key 785392 &bull; Review registrations, verify ₹299 lifetime portal payments, and manage database
      </p>
    </div>
    <div style="display: flex; gap: 8px;">
      <a href="export.php" class="btn btn-gold btn-sm">&#10515; Download Full MySQL Dump</a>
      <a href="dashboard.php" class="btn btn-secondary btn-sm" style="background:#ffffff; color:#064e3b;">Return to Dashboard</a>
    </div>
  </div>

  <!-- Overall Stat Counters -->
  <div class="stat-grid">
    <div class="stat-card">
      <div>
        <div class="stat-label">Total Registered Councils</div>
        <div class="stat-number"><?php echo (int)$totalVillages; ?></div>
      </div>
      <div style="font-size: 24px;">&#127963;</div>
    </div>
    <div class="stat-card">
      <div>
        <div class="stat-label">Total Secretaries</div>
        <div class="stat-number"><?php echo (int)$totalUsers; ?></div>
      </div>
      <div style="font-size: 24px;">&#128100;</div>
    </div>
    <div class="stat-card">
      <div>
        <div class="stat-label">Total Passes in Database</div>
        <div class="stat-number" style="color:#047857;"><?php echo (int)$totalPasses; ?></div>
      </div>
      <div style="font-size: 24px;">&#128220;</div>
    </div>
  </div>

  <!-- Users Table -->
  <div class="card">
    <div class="card-header">
      <h3>Registered Council Secretaries &amp; Payment Verifications</h3>
      <span class="badge badge-live">Live Registry</span>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Secretary Name</th>
            <th>Contact Phone</th>
            <th>Village Council</th>
            <th>Payment Proof</th>
            <th>Status</th>
            <th>Registered At</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($users as $u): ?>
            <tr>
              <td style="font-family: var(--font-mono); font-weight: bold; color: var(--primary-900);">
                <?php echo htmlspecialchars($u['username']); ?>
              </td>
              <td><?php echo htmlspecialchars($u['display_name']); ?></td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;"><?php echo htmlspecialchars($u['phone_number'] ?: '-'); ?></td>
              <td style="font-weight: 600;"><?php echo htmlspecialchars($u['village_name'] ?: 'Mizoram VC'); ?></td>
              <td>
                <?php if (!empty($u['payment_screenshot_url'])): ?>
                  <a href="<?php echo htmlspecialchars($u['payment_screenshot_url']); ?>" target="_blank" class="btn btn-secondary btn-sm" style="padding: 3px 8px; font-size: 0.7rem;">
                    &#128065; View Proof
                  </a>
                <?php else: ?>
                  <span style="font-size: 0.75rem; color: #888888;">No File</span>
                <?php endif; ?>
              </td>
              <td>
                <?php if ($u['status'] === 'approved'): ?>
                  <span class="badge badge-live">Approved (Live)</span>
                <?php elseif ($u['status'] === 'pending'): ?>
                  <span class="badge badge-pending">Pending Review</span>
                <?php else: ?>
                  <span class="badge" style="background:#fee2e2; color:#991b1b;">Rejected</span>
                <?php endif; ?>
              </td>
              <td style="font-size: 0.75rem; color: #666666; font-family: var(--font-mono);">
                <?php echo htmlspecialchars($u['created_at']); ?>
              </td>
              <td style="text-align: right;">
                <?php if ($u['user_type'] !== 'authority'): ?>
                  <form method="POST" action="authority.php" style="display: inline-block;">
                    <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
                    <input type="hidden" name="target_uid" value="<?php echo htmlspecialchars($u['uid']); ?>">
                    <?php if ($u['status'] !== 'approved'): ?>
                      <button type="submit" name="action_type" value="approve" class="btn btn-primary btn-sm" style="background:#059669; padding: 3px 8px; font-size: 0.7rem;">
                        Approve
                      </button>
                    <?php endif; ?>
                    <?php if ($u['status'] !== 'rejected'): ?>
                      <button type="submit" name="action_type" value="reject" class="btn btn-danger btn-sm" style="padding: 3px 8px; font-size: 0.7rem;">
                        Reject
                      </button>
                    <?php endif; ?>
                  </form>
                <?php else: ?>
                  <span style="font-size: 0.75rem; color: #888888; font-weight: bold;">Authority</span>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
