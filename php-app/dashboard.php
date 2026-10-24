<?php
$pageTitle = 'Land Pass Registry Dashboard';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();
$currentVillage = get_current_village($pdo);

// Filtering & Search
$filterType = trim($_GET['type'] ?? 'all');
$searchTerm = trim($_GET['q'] ?? '');

$sql = "SELECT * FROM `land_passes` WHERE 1=1";
$params = [];

// Scoping: Secretary only sees passes belonging to their village / user ID
if (!is_authority()) {
    $sql .= " AND (`village_id` = ? OR `created_by` = ?)";
    $params[] = $user['village_id'];
    $params[] = $user['uid'];
}

if ($filterType === 'huan_ram' || $filterType === 'in_hmun') {
    $sql .= " AND `pass_type` = ?";
    $params[] = $filterType;
}

if (!empty($searchTerm)) {
    $sql .= " AND (`pass_number` LIKE ? OR `owner_name` LIKE ? OR `parent_name` LIKE ? OR `contact_number` LIKE ? OR `location_address` LIKE ? OR `boundary_north` LIKE ? OR `boundary_east` LIKE ? OR `boundary_west` LIKE ? OR `boundary_south` LIKE ?)";
    $kw = "%$searchTerm%";
    for ($i = 0; $i < 9; $i++) {
        $params[] = $kw;
    }
}

$sql .= " ORDER BY `created_at` DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$passes = $stmt->fetchAll();

// Statistics
$statSql = "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN `pass_type` = 'huan_ram' THEN 1 ELSE 0 END) as huan_ram,
    SUM(CASE WHEN `pass_type` = 'in_hmun' THEN 1 ELSE 0 END) as in_hmun
    FROM `land_passes` WHERE 1=1";
$statParams = [];
if (!is_authority()) {
    $statSql .= " AND (`village_id` = ? OR `created_by` = ?)";
    $statParams[] = $user['village_id'];
    $statParams[] = $user['uid'];
}
$statStmt = $pdo->prepare($statSql);
$statStmt->execute($statParams);
$stats = $statStmt->fetch() ?: ['total' => 0, 'huan_ram' => 0, 'in_hmun' => 0];

require_once __DIR__ . '/header.php';
?>

<!-- Statistics Counters -->
<div class="stat-grid">
  <div class="stat-card">
    <div>
      <div class="stat-label">Total Passes Issued</div>
      <div class="stat-number"><?php echo (int)($stats['total'] ?? 0); ?></div>
    </div>
    <div style="font-size: 28px; color: var(--primary-700);">&equiv;</div>
  </div>

  <div class="stat-card">
    <div>
      <div class="stat-label">Huan Ram (Agricultural)</div>
      <div class="stat-number" style="color: #047857;"><?php echo (int)($stats['huan_ram'] ?? 0); ?></div>
    </div>
    <div style="font-size: 28px; color: #047857;">&#9752;</div>
  </div>

  <div class="stat-card">
    <div>
      <div class="stat-label">In Hmun (Residential)</div>
      <div class="stat-number" style="color: #1e40af;"><?php echo (int)($stats['in_hmun'] ?? 0); ?></div>
    </div>
    <div style="font-size: 28px; color: #1e40af;">&#8962;</div>
  </div>
</div>

<!-- Main Registry Card -->
<div class="card">
  <div class="card-header">
    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
      <h2>Land Pass Registry</h2>
      <!-- Type Filter Tabs -->
      <div style="display: flex; gap: 6px;">
        <a href="dashboard.php?type=all&q=<?php echo urlencode($searchTerm); ?>" class="btn btn-sm <?php echo $filterType === 'all' ? 'btn-primary' : 'btn-secondary'; ?>">
          All (<?php echo (int)$stats['total']; ?>)
        </a>
        <a href="dashboard.php?type=huan_ram&q=<?php echo urlencode($searchTerm); ?>" class="btn btn-sm <?php echo $filterType === 'huan_ram' ? 'btn-primary' : 'btn-secondary'; ?>">
          Huan Ram (<?php echo (int)$stats['huan_ram']; ?>)
        </a>
        <a href="dashboard.php?type=in_hmun&q=<?php echo urlencode($searchTerm); ?>" class="btn btn-sm <?php echo $filterType === 'in_hmun' ? 'btn-primary' : 'btn-secondary'; ?>">
          In Hmun (<?php echo (int)$stats['in_hmun']; ?>)
        </a>
      </div>
    </div>

    <div>
      <a href="issue_pass.php" class="btn btn-primary btn-sm">+ Issue New Land Pass</a>
      <a href="export.php" class="btn btn-secondary btn-sm" title="Download SQL/CSV Backup">&#10515; Export Data</a>
    </div>
  </div>

  <!-- Search Filter Form -->
  <div style="padding: 16px 20px; background-color: #fafafa; border-bottom: 1px solid var(--neutral-200);">
    <form method="GET" action="dashboard.php" style="display: flex; gap: 10px; flex-wrap: wrap;">
      <input type="hidden" name="type" value="<?php echo htmlspecialchars($filterType); ?>">
      <input 
        type="text" 
        name="q" 
        placeholder="Search by pass number, owner name, father/mother, contact phone, or location..." 
        value="<?php echo htmlspecialchars($searchTerm); ?>" 
        class="form-control" 
        style="flex: 1; min-width: 250px;"
      >
      <button type="submit" class="btn btn-primary btn-sm">Search</button>
      <?php if (!empty($searchTerm)): ?>
        <a href="dashboard.php?type=<?php echo urlencode($filterType); ?>" class="btn btn-secondary btn-sm">Clear Search</a>
      <?php endif; ?>
    </form>
  </div>

  <!-- Passes Table -->
  <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Pass Number</th>
          <th>Pass Type</th>
          <th>Landholder Name</th>
          <th>Father / Mother</th>
          <th>Contact</th>
          <th>Area / Size</th>
          <th>Issue Date</th>
          <th>Status</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (!empty($passes)): ?>
          <?php foreach ($passes as $p): ?>
            <tr>
              <td style="font-family: var(--font-mono); font-weight: 700; color: #064e3b;">
                <?php echo htmlspecialchars($p['pass_number']); ?>
              </td>
              <td>
                <span class="badge <?php echo $p['pass_type'] === 'huan_ram' ? 'badge-huan-ram' : 'badge-in-hmun'; ?>">
                  <?php echo $p['pass_type'] === 'huan_ram' ? 'Huan Ram' : 'In Hmun'; ?>
                </span>
              </td>
              <td style="font-weight: 600; color: var(--neutral-900);">
                <?php echo htmlspecialchars($p['owner_name']); ?>
              </td>
              <td style="color: var(--neutral-600);">
                <?php echo htmlspecialchars($p['parent_name'] ?: '-'); ?>
              </td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">
                <?php echo htmlspecialchars($p['contact_number'] ?: '-'); ?>
              </td>
              <td>
                <?php echo htmlspecialchars($p['area_size'] ?: 'Survey Area'); ?>
              </td>
              <td style="font-family: var(--font-mono); font-size: 0.8rem;">
                <?php echo htmlspecialchars($p['issue_date']); ?>
              </td>
              <td>
                <span class="badge badge-live">Live</span>
              </td>
              <td style="text-align: right; white-space: nowrap;">
                <a href="view_pass.php?id=<?php echo urlencode($p['id']); ?>" class="btn btn-secondary btn-sm" title="View details">View</a>
                <a href="print_pass.php?id=<?php echo urlencode($p['id']); ?>" target="_blank" class="btn btn-primary btn-sm" title="Print official A4 certificate">Print</a>
                <a href="edit_pass.php?id=<?php echo urlencode($p['id']); ?>" class="btn btn-secondary btn-sm" title="Edit">Edit</a>
                <a href="delete_pass.php?id=<?php echo urlencode($p['id']); ?>" class="btn btn-danger btn-sm" title="Delete">Delete</a>
              </td>
            </tr>
          <?php endforeach; ?>
        <?php else: ?>
          <tr>
            <td colspan="9" style="text-align: center; padding: 40px 20px; color: var(--neutral-600);">
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--neutral-800); margin-bottom: 6px;">No Land Passes Found</div>
              <p style="font-size: 0.825rem; margin-bottom: 16px;">
                <?php if (!empty($searchTerm)): ?>
                  No records match your search query "<?php echo htmlspecialchars($searchTerm); ?>".
                <?php else: ?>
                  No land passes have been issued yet for your village council profile.
                <?php endif; ?>
              </p>
              <a href="issue_pass.php" class="btn btn-primary btn-sm">+ Issue First Land Pass</a>
            </td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
