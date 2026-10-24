<?php
$pageTitle = 'Audit Trail & Compliance Log';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();

$sql = "SELECT * FROM `audit_logs` ORDER BY `timestamp` DESC LIMIT 150";
$logs = $pdo->query($sql)->fetchAll();

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 1000px; margin: 0 auto;">
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="background-color: var(--primary-50);">
      <div>
        <h2 style="color: var(--primary-900);">Audit Trail &amp; Compliance Activity Logs</h2>
        <p style="font-size: 0.8rem; color: var(--neutral-600);">
          Immutable chronological record of Land Pass operations, user authentication, and system events
        </p>
      </div>
      <div>
        <a href="dashboard.php" class="btn btn-secondary btn-sm">&larr; Back to Dashboard</a>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Target Name / ID</th>
            <th>Performed By</th>
            <th>Details &amp; Particulars</th>
          </tr>
        </thead>
        <tbody>
          <?php if (!empty($logs)): ?>
            <?php foreach ($logs as $log): ?>
              <tr>
                <td style="font-family: var(--font-mono); font-size: 0.775rem; color: #404040; white-space: nowrap;">
                  <?php echo htmlspecialchars($log['timestamp']); ?>
                </td>
                <td>
                  <span class="badge" style="background-color: #ecfdf5; color: #064e3b; font-weight: bold; font-family: var(--font-mono); font-size: 0.7rem;">
                    <?php echo htmlspecialchars($log['action']); ?>
                  </span>
                </td>
                <td style="font-weight: 600; color: #171717; font-size: 0.825rem;">
                  <?php echo htmlspecialchars($log['target_name'] ?: $log['target_id']); ?>
                </td>
                <td style="font-size: 0.8rem; color: #065f46; font-weight: 600;">
                  <?php echo htmlspecialchars($log['performed_by']); ?>
                </td>
                <td style="font-size: 0.8rem; color: #525252;">
                  <?php echo htmlspecialchars($log['details']); ?>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php else: ?>
            <tr>
              <td colspan="5" style="text-align: center; padding: 30px; color: #888888;">
                No audit logs recorded yet.
              </td>
            </tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
