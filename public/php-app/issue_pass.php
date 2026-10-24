<?php
$pageTitle = 'Issue New Land Pass - Village Council';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();
$currentVillage = get_current_village($pdo);

$passType = trim($_GET['type'] ?? 'huan_ram');
if (!in_array($passType, ['huan_ram', 'in_hmun'])) {
    $passType = 'huan_ram';
}

// Generate automatic next sequential pass number
$autoPassNumber = get_next_pass_number($pdo, $currentVillage['id'], $passType);

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf_token'] ?? '';
    $passType = trim($_POST['pass_type'] ?? 'huan_ram');
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
        // Check if pass number is already taken
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `land_passes` WHERE `pass_number` = ?");
        $stmt->execute([$passNumber]);
        if ($stmt->fetchColumn() > 0) {
            $error = "Land Pass Number '$passNumber' is already issued. Please use a unique number.";
        } else {
            $id = 'pass_' . time() . '_' . bin2hex(random_bytes(3));
            $stmt = $pdo->prepare("INSERT INTO `land_passes` (
                `id`, `pass_number`, `pass_type`, `owner_name`, `parent_name`, `contact_number`,
                `location_address`, `village_id`, `village_name`, `area_size`,
                `boundary_north`, `boundary_east`, `boundary_west`, `boundary_south`,
                `issue_date`, `created_by`, `approval_status`, `notes`, `created_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, NOW())");

            $stmt->execute([
                $id,
                $passNumber,
                $passType,
                $ownerName,
                $parentName,
                $contactNumber,
                $locationAddress,
                $currentVillage['id'],
                $currentVillage['village_name'],
                $areaSize,
                $boundaryNorth,
                $boundaryEast,
                $boundaryWest,
                $boundarySouth,
                $issueDate,
                $user['uid'],
                $notes
            ]);

            log_activity($pdo, 'CREATE_PASS', $id, $passNumber, $user['display_name'], "Issued $passType Land Pass for $ownerName ($passNumber)");
            flash('success', "New Land Pass $passNumber for $ownerName has been successfully issued and saved to MySQL!");
            header("Location: view_pass.php?id=" . urlencode($id));
            exit;
        }
    }
}

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 800px; margin: 0 auto;">
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="background-color: var(--primary-50);">
      <div>
        <h2 style="color: var(--primary-900);">Issue Official Land Pass Certificate</h2>
        <p style="font-size: 0.8rem; color: var(--neutral-600);">
          Issuing authority: <?php echo htmlspecialchars($currentVillage['village_name']); ?>
        </p>
      </div>
      <div>
        <a href="dashboard.php" class="btn btn-secondary btn-sm">&larr; Back to Registry</a>
      </div>
    </div>
    <div class="card-body">
      <?php if ($error): ?>
        <div class="flash-message flash-error">
          <span><?php echo htmlspecialchars($error); ?></span>
        </div>
      <?php endif; ?>

      <!-- Quick Type Switcher -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <a href="issue_pass.php?type=huan_ram" class="btn <?php echo $passType === 'huan_ram' ? 'btn-primary' : 'btn-secondary'; ?>" style="flex: 1;">
          Huan Ram Pass (Agricultural)
        </a>
        <a href="issue_pass.php?type=in_hmun" class="btn <?php echo $passType === 'in_hmun' ? 'btn-primary' : 'btn-secondary'; ?>" style="flex: 1;">
          In Hmun Pass (Residential)
        </a>
      </div>

      <form method="POST" action="issue_pass.php?type=<?php echo urlencode($passType); ?>">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
        <input type="hidden" name="pass_type" value="<?php echo htmlspecialchars($passType); ?>">

        <!-- Section 1: Certificate Serial & Type -->
        <h3 style="font-size: 0.875rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          1. Serial Pass Number &amp; Date
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Official Pass Number *</label>
            <input 
              type="text" 
              name="pass_number" 
              value="<?php echo htmlspecialchars($_POST['pass_number'] ?? $autoPassNumber); ?>" 
              required 
              class="form-control" 
              style="font-family: var(--font-mono); font-weight: bold; color: var(--primary-900); font-size: 1rem;"
            >
            <div class="form-help">Calculated automatically from your starting number. You may also edit if needed.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Date of Issue *</label>
            <input 
              type="date" 
              name="issue_date" 
              value="<?php echo htmlspecialchars($_POST['issue_date'] ?? date('Y-m-d')); ?>" 
              required 
              class="form-control"
            >
          </div>
        </div>

        <!-- Section 2: Landholder Particulars -->
        <h3 style="font-size: 0.875rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 20px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          2. Landholder Particulars
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Landholder Full Name *</label>
            <input 
              type="text" 
              name="owner_name" 
              placeholder="e.g. Lalhmangaiha" 
              required 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['owner_name'] ?? ''); ?>"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Father's / Mother's / Husband's Name</label>
            <input 
              type="text" 
              name="parent_name" 
              placeholder="e.g. Rohlira (L)" 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['parent_name'] ?? ''); ?>"
            >
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Contact Phone Number</label>
            <input 
              type="text" 
              name="contact_number" 
              placeholder="e.g. 9862123456" 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['contact_number'] ?? ''); ?>"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Land Area / Dimensions</label>
            <input 
              type="text" 
              name="area_size" 
              placeholder="e.g. 2.5 Bighas or 60 x 80 feet" 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['area_size'] ?? ''); ?>"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Land Location / Veng / Field Address</label>
          <input 
            type="text" 
            name="location_address" 
            placeholder="e.g. Venglai Ram, Saiphai" 
            class="form-control" 
            value="<?php echo htmlspecialchars($_POST['location_address'] ?? ''); ?>"
          >
        </div>

        <!-- Section 3: Boundary Survey Particulars (Ramri) -->
        <h3 style="font-size: 0.875rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 20px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          3. Boundary Survey Particulars (Ramri Te)
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">North Boundary (Hmar lam ri) *</label>
            <input 
              type="text" 
              name="boundary_north" 
              placeholder="e.g. Kawngpui lian / Ramri lung" 
              required 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['boundary_north'] ?? ''); ?>"
            >
          </div>

          <div class="form-group">
            <label class="form-label">South Boundary (Chhim lam ri) *</label>
            <input 
              type="text" 
              name="boundary_south" 
              placeholder="e.g. Tiau lui / Thanga ram" 
              required 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['boundary_south'] ?? ''); ?>"
            >
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">East Boundary (Chhak lam ri) *</label>
            <input 
              type="text" 
              name="boundary_east" 
              placeholder="e.g. Lalthanzama huan" 
              required 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['boundary_east'] ?? ''); ?>"
            >
          </div>

          <div class="form-group">
            <label class="form-label">West Boundary (Thlang lam ri) *</label>
            <input 
              type="text" 
              name="boundary_west" 
              placeholder="e.g. Puia ramri / Kawrte" 
              required 
              class="form-control" 
              value="<?php echo htmlspecialchars($_POST['boundary_west'] ?? ''); ?>"
            >
          </div>
        </div>

        <!-- Section 4: Notes -->
        <div class="form-group">
          <label class="form-label">Special Conditions / Notes</label>
          <textarea name="notes" placeholder="Any special council remarks or resolution number..." class="form-control"><?php echo htmlspecialchars($_POST['notes'] ?? ''); ?></textarea>
        </div>

        <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
          <a href="dashboard.php" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" style="padding: 10px 28px; font-size: 0.95rem;">
            Save &amp; Issue Land Pass Certificate &rarr;
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
