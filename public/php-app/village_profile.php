<?php
$pageTitle = 'Village Council Profile & Land Pass Settings';
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$user = current_user();
$currentVillage = get_current_village($pdo);

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf_token'] ?? '';
    $villageName = trim($_POST['village_name'] ?? '');
    $blockName = trim($_POST['block_name'] ?? '');
    $districtName = trim($_POST['district_name'] ?? '');
    $stateName = trim($_POST['state_name'] ?? 'Mizoram');
    $pinCode = trim($_POST['pin_code'] ?? '');
    $huanRamPrefix = trim($_POST['huan_ram_prefix'] ?? 'MZ-05-SPH-HR-');
    $inHmunPrefix = trim($_POST['in_hmun_prefix'] ?? 'MZ-05-SPH-IH-');
    $startHR = (int)($_POST['starting_huan_ram_number'] ?? 1001);
    $startIH = (int)($_POST['starting_in_hmun_number'] ?? 1001);
    $presidentName = trim($_POST['president_name'] ?? '');
    $secretaryName = trim($_POST['secretary_name'] ?? '');
    $conditions = trim($_POST['conditions_and_terms'] ?? '');

    if (!verify_csrf($csrf)) {
        $error = 'Security session expired. Please submit the form again.';
    } elseif (empty($villageName)) {
        $error = 'Village Council Name is mandatory.';
    } else {
        // Handle Logo Upload
        $logoUrl = $currentVillage['logo_url'] ?? '';
        if (!empty($_FILES['logo_file']['name']) && $_FILES['logo_file']['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['logo_file']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp'])) {
                $newLogoName = 'logo_' . time() . '.' . $ext;
                if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
                move_uploaded_file($_FILES['logo_file']['tmp_name'], UPLOAD_DIR . $newLogoName);
                $logoUrl = UPLOAD_URL . $newLogoName;
            }
        }

        $stmt = $pdo->prepare("UPDATE `villages` SET
            `village_name` = ?,
            `block_name` = ?,
            `district_name` = ?,
            `state_name` = ?,
            `pin_code` = ?,
            `huan_ram_prefix` = ?,
            `in_hmun_prefix` = ?,
            `starting_pass_number` = ?,
            `starting_huan_ram_number` = ?,
            `starting_in_hmun_number` = ?,
            `president_name` = ?,
            `secretary_name` = ?,
            `conditions_and_terms` = ?,
            `logo_url` = ?,
            `updated_at` = NOW()
            WHERE `id` = ?");

        $stmt->execute([
            $villageName,
            $blockName,
            $districtName,
            $stateName,
            $pinCode,
            $huanRamPrefix,
            $inHmunPrefix,
            $startHR,
            $startHR,
            $startIH,
            $presidentName,
            $secretaryName,
            $conditions,
            $logoUrl,
            $currentVillage['id']
        ]);

        log_activity($pdo, 'UPDATE_VILLAGE_PROFILE', $currentVillage['id'], $villageName, $user['display_name'], "Updated Village Council configuration and starting numbers (HR: $startHR, IH: $startIH)");
        flash('success', "Village Council profile updated successfully with Starting Pass Numbers (HR: $startHR, IH: $startIH)!");
        header('Location: village_profile.php');
        exit;
    }
}

// Refresh current village details
$currentVillage = get_current_village($pdo);

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 820px; margin: 0 auto;">
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="background-color: var(--primary-50);">
      <div>
        <h2 style="color: var(--primary-900);">Village Council Profile &amp; Land Pass Settings</h2>
        <p style="font-size: 0.8rem; color: var(--neutral-600);">
          Configure Council Address, Starting Pass Numbers, Serial Prefixes, Signatories, and Custom Bylaws
        </p>
      </div>
    </div>
    <div class="card-body">
      <?php if ($error): ?>
        <div class="flash-message flash-error">
          <span><?php echo htmlspecialchars($error); ?></span>
        </div>
      <?php endif; ?>

      <form method="POST" action="village_profile.php" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

        <!-- Section 1: Council Address -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          1. Council Office &amp; Address Particulars
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Village Council Name *</label>
            <input type="text" name="village_name" value="<?php echo htmlspecialchars($currentVillage['village_name']); ?>" required class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">RD Block Name</label>
            <input type="text" name="block_name" value="<?php echo htmlspecialchars($currentVillage['block_name']); ?>" class="form-control" placeholder="e.g. Bilkhawthlir RD Block">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">District Name</label>
            <input type="text" name="district_name" value="<?php echo htmlspecialchars($currentVillage['district_name']); ?>" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">PIN Code</label>
            <input type="text" name="pin_code" value="<?php echo htmlspecialchars($currentVillage['pin_code']); ?>" class="form-control" placeholder="e.g. 796091">
          </div>
        </div>

        <!-- Section 2: Pass Numbering & Starting Numbers -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 24px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          2. Pass Numbering Prefixes &amp; Starting Numbers (Mandatory)
        </h3>

        <div class="form-grid-2">
          <!-- Huan Ram -->
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #064e3b; font-size: 0.85rem;">Huan Ram Pass (Agricultural)</strong>
              <span class="badge badge-huan-ram">Output Preview</span>
            </div>
            <div class="form-group">
              <label class="form-label" style="color: #064e3b;">Serial Prefix</label>
              <input type="text" name="huan_ram_prefix" value="<?php echo htmlspecialchars($currentVillage['huan_ram_prefix']); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
            </div>
            <div class="form-group" style="margin-bottom: 6px;">
              <label class="form-label" style="color: #064e3b;">Starting Land Pass Number *</label>
              <input type="number" name="starting_huan_ram_number" min="1" value="<?php echo htmlspecialchars($currentVillage['starting_huan_ram_number']); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
            </div>
            <div style="font-size: 0.75rem; color: #047857; margin-top: 6px; font-family: var(--font-mono);">
              Next First Output: <strong><?php echo htmlspecialchars($currentVillage['huan_ram_prefix'] . $currentVillage['starting_huan_ram_number']); ?></strong>
            </div>
          </div>

          <!-- In Hmun -->
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md); padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #1e40af; font-size: 0.85rem;">In Hmun Pass (Residential)</strong>
              <span class="badge badge-in-hmun">Output Preview</span>
            </div>
            <div class="form-group">
              <label class="form-label" style="color: #1e40af;">Serial Prefix</label>
              <input type="text" name="in_hmun_prefix" value="<?php echo htmlspecialchars($currentVillage['in_hmun_prefix']); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
            </div>
            <div class="form-group" style="margin-bottom: 6px;">
              <label class="form-label" style="color: #1e40af;">Starting Land Pass Number *</label>
              <input type="number" name="starting_in_hmun_number" min="1" value="<?php echo htmlspecialchars($currentVillage['starting_in_hmun_number']); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
            </div>
            <div style="font-size: 0.75rem; color: #1d4ed8; margin-top: 6px; font-family: var(--font-mono);">
              Next First Output: <strong><?php echo htmlspecialchars($currentVillage['in_hmun_prefix'] . $currentVillage['starting_in_hmun_number']); ?></strong>
            </div>
          </div>
        </div>

        <!-- Section 3: Signatories & Logo -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 24px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          3. Council Officials &amp; Official Seal Logo
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">President Name</label>
            <input type="text" name="president_name" value="<?php echo htmlspecialchars($currentVillage['president_name']); ?>" class="form-control" placeholder="e.g. Lalthansanga">
          </div>

          <div class="form-group">
            <label class="form-label">Secretary Name</label>
            <input type="text" name="secretary_name" value="<?php echo htmlspecialchars($currentVillage['secretary_name']); ?>" class="form-control" placeholder="e.g. C. Lalramnghaka">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Village Council Logo / Rubber Stamp Seal</label>
          <div style="display: flex; gap: 14px; align-items: center; margin-top: 6px;">
            <?php if (!empty($currentVillage['logo_url'])): ?>
              <img src="<?php echo htmlspecialchars($currentVillage['logo_url']); ?>" alt="Current Logo" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid var(--neutral-300); border-radius: 8px; padding: 2px;">
            <?php endif; ?>
            <input type="file" name="logo_file" accept="image/*" class="form-control" style="flex: 1;">
          </div>
        </div>

        <!-- Section 4: Terms & Restrictions -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 24px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 4px;">
          4. Land Pass Conditions &amp; Terms (Bylaws)
        </h3>

        <div class="form-group">
          <textarea name="conditions_and_terms" rows="7" class="form-control"><?php echo htmlspecialchars($currentVillage['conditions_and_terms']); ?></textarea>
        </div>

        <div style="margin-top: 24px; text-align: right;">
          <button type="submit" class="btn btn-primary" style="padding: 10px 28px; font-size: 0.95rem;">
            Save Village Council Profile &rarr;
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
