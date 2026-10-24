<?php
$pageTitle = 'Edit Land Pass - Village Council';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();
$currentVillage = get_current_village($pdo);

$id = trim($_GET['id'] ?? '');
if (empty($id)) {
    flash('error', 'Land Pass ID missing.');
    header('Location: dashboard.php');
    exit;
}

// Fetch existing pass
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
    flash('error', 'You do not have permission to edit this pass.');
    header('Location: dashboard.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf_token'] ?? '';
    $passNumber = trim($_POST['pass_number'] ?? '');
    $ownerName = trim($_POST['owner_name'] ?? '');
    $parentName = trim($_POST['parent_name'] ?? '');
    $contactNumber = trim($_POST['contact_number'] ?? '');
    $locationAddress = trim($_POST['location_address'] ?? '');
    $areaSize = trim($_POST['area_size'] ?? '');
    $boundaryNorth = trim($_POST['boundary_north'] ?? '');
    $boundaryEast = trim($_POST['boundary_east'] ?? '');
    $boundaryWest = trim($_POST['boundary_west'] ?? '');
    $boundarySouth = trim($_POST['boundary_south'] ?? '');
    $issueDate = trim($_POST['issue_date'] ?? date('Y-m-d'));
    $notes = trim($_POST['notes'] ?? '');

    if (!verify_csrf($csrf)) {
        $error = 'Security session expired. Please submit the form again.';
    } elseif (empty($passNumber) || empty($ownerName)) {
        $error = 'Pass Number and Landholder Name are required.';
    } else {
        $stmt = $pdo->prepare("UPDATE `land_passes` SET
            `pass_number` = ?,
            `owner_name` = ?,
            `parent_name` = ?,
            `contact_number` = ?,
            `location_address` = ?,
            `area_size` = ?,
            `boundary_north` = ?,
            `boundary_east` = ?,
            `boundary_west` = ?,
            `boundary_south` = ?,
            `issue_date` = ?,
            `notes` = ?,
            `updated_at` = NOW()
            WHERE `id` = ?");

        $stmt->execute([
            $passNumber,
            $ownerName,
            $parentName,
            $contactNumber,
            $locationAddress,
            $areaSize,
            $boundaryNorth,
            $boundaryEast,
            $boundaryWest,
            $boundarySouth,
            $issueDate,
            $notes,
            $id
        ]);

        log_activity($pdo, 'UPDATE_PASS', $id, $passNumber, $user['display_name'], "Updated Land Pass details for $ownerName ($passNumber)");
        flash('success', "Land Pass $passNumber updated successfully!");
        header("Location: view_pass.php?id=" . urlencode($id));
        exit;
    }
}

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 800px; margin: 0 auto;">
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="background-color: var(--primary-50);">
      <div>
        <h2 style="color: var(--primary-900);">Edit Land Pass: <?php echo htmlspecialchars($pass['pass_number']); ?></h2>
        <p style="font-size: 0.8rem; color: var(--neutral-600);">
          Landholder: <?php echo htmlspecialchars($pass['owner_name']); ?>
        </p>
      </div>
      <div>
        <a href="view_pass.php?id=<?php echo urlencode($id); ?>" class="btn btn-secondary btn-sm">&larr; Back to Details</a>
      </div>
    </div>
    <div class="card-body">
      <?php if ($error): ?>
        <div class="flash-message flash-error">
          <span><?php echo htmlspecialchars($error); ?></span>
        </div>
      <?php endif; ?>

      <form method="POST" action="edit_pass.php?id=<?php echo urlencode($id); ?>">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Pass Number *</label>
            <input type="text" name="pass_number" value="<?php echo htmlspecialchars($_POST['pass_number'] ?? $pass['pass_number']); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
          </div>

          <div class="form-group">
            <label class="form-label">Date of Issue *</label>
            <input type="date" name="issue_date" value="<?php echo htmlspecialchars($_POST['issue_date'] ?? $pass['issue_date']); ?>" required class="form-control">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Landholder Full Name *</label>
            <input type="text" name="owner_name" value="<?php echo htmlspecialchars($_POST['owner_name'] ?? $pass['owner_name']); ?>" required class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Father's / Mother's Name</label>
            <input type="text" name="parent_name" value="<?php echo htmlspecialchars($_POST['parent_name'] ?? $pass['parent_name']); ?>" class="form-control">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input type="text" name="contact_number" value="<?php echo htmlspecialchars($_POST['contact_number'] ?? $pass['contact_number']); ?>" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Area / Dimensions</label>
            <input type="text" name="area_size" value="<?php echo htmlspecialchars($_POST['area_size'] ?? $pass['area_size']); ?>" class="form-control">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Location Address</label>
          <input type="text" name="location_address" value="<?php echo htmlspecialchars($_POST['location_address'] ?? $pass['location_address']); ?>" class="form-control">
        </div>

        <h3 style="font-size: 0.875rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 20px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          Boundary Survey Particulars (Ramri)
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">North Boundary (Hmar lam ri) *</label>
            <input type="text" name="boundary_north" value="<?php echo htmlspecialchars($_POST['boundary_north'] ?? $pass['boundary_north']); ?>" required class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">South Boundary (Chhim lam ri) *</label>
            <input type="text" name="boundary_south" value="<?php echo htmlspecialchars($_POST['boundary_south'] ?? $pass['boundary_south']); ?>" required class="form-control">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">East Boundary (Chhak lam ri) *</label>
            <input type="text" name="boundary_east" value="<?php echo htmlspecialchars($_POST['boundary_east'] ?? $pass['boundary_east']); ?>" required class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">West Boundary (Thlang lam ri) *</label>
            <input type="text" name="boundary_west" value="<?php echo htmlspecialchars($_POST['boundary_west'] ?? $pass['boundary_west']); ?>" required class="form-control">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control"><?php echo htmlspecialchars($_POST['notes'] ?? $pass['notes']); ?></textarea>
        </div>

        <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
          <a href="view_pass.php?id=<?php echo urlencode($id); ?>" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" style="padding: 10px 24px;">Save Updates &rarr;</button>
        </div>
      </form>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
