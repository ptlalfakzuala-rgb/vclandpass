<?php
$pageTitle = 'Register Village Council Secretary - Lifetime Access';
require_once __DIR__ . '/config.php';
$pdo = get_db();

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $displayName = trim($_POST['display_name'] ?? '');
    $phoneNumber = trim($_POST['phone_number'] ?? '');
    $villageName = trim($_POST['village_name'] ?? '');
    $blockName = trim($_POST['block_name'] ?? '');
    $districtName = trim($_POST['district_name'] ?? 'Mizoram');
    $huanRamPrefix = trim($_POST['huan_ram_prefix'] ?? 'MZ-VC-HR-');
    $inHmunPrefix = trim($_POST['in_hmun_prefix'] ?? 'MZ-VC-IH-');
    $startHR = (int)($_POST['starting_huan_ram_number'] ?? 1001);
    $startIH = (int)($_POST['starting_in_hmun_number'] ?? 1001);
    $csrf = $_POST['csrf_token'] ?? '';

    if (!verify_csrf($csrf)) {
        $error = 'Security session expired. Please try again.';
    } elseif (empty($username) || empty($password) || empty($displayName) || empty($villageName)) {
        $error = 'Please fill in all mandatory fields (Username, Password, Name, Village Name).';
    } else {
        // Check if username exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM `users` WHERE `username` = ?");
        $stmt->execute([$username]);
        if ($stmt->fetchColumn() > 0) {
            $error = 'Username already registered. Please choose another username.';
        } else {
            // Handle Payment Proof File Upload
            $screenshotPath = '';
            if (!empty($_FILES['payment_screenshot']['name']) && $_FILES['payment_screenshot']['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES['payment_screenshot']['name'], PATHINFO_EXTENSION));
                $allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
                if (in_array($ext, $allowed)) {
                    $newFileName = 'proof_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                    if (!is_dir(UPLOAD_DIR)) {
                        mkdir(UPLOAD_DIR, 0755, true);
                    }
                    move_uploaded_file($_FILES['payment_screenshot']['tmp_name'], UPLOAD_DIR . $newFileName);
                    $screenshotPath = UPLOAD_URL . $newFileName;
                }
            }

            // Create Unique IDs
            $uid = 'sec_' . time() . '_' . bin2hex(random_bytes(3));
            $villageId = 'village_' . $uid;
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);

            // 1. Create Dedicated Village Record for this Secretary
            $stmt = $pdo->prepare("INSERT INTO `villages` (
                `id`, `village_name`, `block_name`, `district_name`, `state_name`, `pin_code`,
                `huan_ram_prefix`, `in_hmun_prefix`, `starting_pass_number`, `starting_huan_ram_number`, `starting_in_hmun_number`,
                `conditions_and_terms`, `secretary_name`
            ) VALUES (?, ?, ?, ?, 'Mizoram', '', ?, ?, ?, ?, ?, ?, ?)");

            $defaultTerms = "CONDITIONS & RESTRICTION:\n1. Huan ram / In hmun hi ramri ziah anga pek a ni a.\n2. An ri-te inkar chin a huam ang.\n3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.\n4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.";

            $stmt->execute([
                $villageId,
                $villageName,
                $blockName,
                $districtName,
                $huanRamPrefix ?: 'MZ-VC-HR-',
                $inHmunPrefix ?: 'MZ-VC-IH-',
                $startHR,
                $startHR,
                $startIH,
                $defaultTerms,
                $displayName
            ]);

            // 2. Insert User
            $stmt = $pdo->prepare("INSERT INTO `users` (
                `uid`, `username`, `password_hash`, `display_name`, `phone_number`,
                `village_id`, `village_name`, `user_type`, `status`, `payment_screenshot_url`, `created_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'secretary', 'approved', ?, NOW())");

            $stmt->execute([
                $uid,
                $username,
                $passwordHash,
                $displayName,
                $phoneNumber,
                $villageId,
                $villageName,
                $screenshotPath
            ]);

            log_activity($pdo, 'REGISTER_SECRETARY', $uid, $username, $displayName, "Registered new VC Secretary for $villageName");

            // Auto-login
            $_SESSION['user_uid'] = $uid;
            $_SESSION['username'] = $username;
            $_SESSION['display_name'] = $displayName;
            $_SESSION['phone_number'] = $phoneNumber;
            $_SESSION['village_id'] = $villageId;
            $_SESSION['village_name'] = $villageName;
            $_SESSION['user_type'] = 'secretary';
            $_SESSION['status'] = 'approved';
            $_SESSION['is_authority'] = false;

            flash('success', "Registration completed! Your Village Council profile for $villageName has been established with Starting Pass No. $startHR.");
            header('Location: dashboard.php');
            exit;
        }
    }
}

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 680px; margin: 30px auto;">
  <div class="card" style="border-top: 4px solid var(--gold-500);">
    <div class="card-header" style="background-color: var(--gold-100);">
      <div>
        <h2 style="color: var(--neutral-900);">Register Village Council Secretary Account</h2>
        <p style="font-size: 0.8rem; color: var(--neutral-700);">
          Lifetime access portal for issuing Land Passes (Huan Ram &amp; In Hmun)
        </p>
      </div>
      <span class="badge badge-huan-ram" style="background-color: #064e3b; color: #ffffff;">Lifetime Access</span>
    </div>
    <div class="card-body">
      <?php if ($error): ?>
        <div class="flash-message flash-error">
          <span><?php echo htmlspecialchars($error); ?></span>
        </div>
      <?php endif; ?>

      <form method="POST" action="register.php" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

        <!-- Section 1: Secretary Login Credentials -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid var(--neutral-200); padding-bottom: 6px;">
          1. Secretary Account Credentials
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Username *</label>
            <input type="text" name="username" placeholder="e.g. saiphai_sec" required class="form-control" value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
            <div class="form-help">Unique username for logging into this portal.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Secret Key / Password *</label>
            <input type="password" name="password" placeholder="Choose a strong password" required class="form-control">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Full Name of Secretary *</label>
            <input type="text" name="display_name" placeholder="e.g. C. Lalramnghaka" required class="form-control" value="<?php echo htmlspecialchars($_POST['display_name'] ?? ''); ?>">
          </div>

          <div class="form-group">
            <label class="form-label">Contact Mobile Number</label>
            <input type="text" name="phone_number" placeholder="e.g. 9862000000" class="form-control" value="<?php echo htmlspecialchars($_POST['phone_number'] ?? ''); ?>">
          </div>
        </div>

        <!-- Section 2: Village Council Details & Starting Numbers -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 20px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 6px;">
          2. Village Council Profile &amp; Starting Pass Numbers
        </h3>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Village Council Name *</label>
            <input type="text" name="village_name" placeholder="e.g. SAIPHAI VILLAGE COUNCIL" required class="form-control" value="<?php echo htmlspecialchars($_POST['village_name'] ?? ''); ?>">
          </div>

          <div class="form-group">
            <label class="form-label">RD Block Name</label>
            <input type="text" name="block_name" placeholder="e.g. Bilkhawthlir RD Block" class="form-control" value="<?php echo htmlspecialchars($_POST['block_name'] ?? ''); ?>">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">District Name</label>
            <input type="text" name="district_name" placeholder="e.g. Kolasib District" class="form-control" value="<?php echo htmlspecialchars($_POST['district_name'] ?? 'Kolasib District'); ?>">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group" style="background-color: #ecfdf5; padding: 12px; border-radius: var(--radius-md); border: 1px solid #a7f3d0;">
            <label class="form-label" style="color: #064e3b;">Huan Ram Serial Prefix</label>
            <input type="text" name="huan_ram_prefix" value="<?php echo htmlspecialchars($_POST['huan_ram_prefix'] ?? 'MZ-05-SPH-HR-'); ?>" class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
            <label class="form-label" style="margin-top: 8px; color: #064e3b;">Starting Huan Ram Number *</label>
            <input type="number" name="starting_huan_ram_number" min="1" value="<?php echo htmlspecialchars($_POST['starting_huan_ram_number'] ?? '1001'); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
          </div>

          <div class="form-group" style="background-color: #eff6ff; padding: 12px; border-radius: var(--radius-md); border: 1px solid #bfdbfe;">
            <label class="form-label" style="color: #1e40af;">In Hmun Serial Prefix</label>
            <input type="text" name="in_hmun_prefix" value="<?php echo htmlspecialchars($_POST['in_hmun_prefix'] ?? 'MZ-05-SPH-IH-'); ?>" class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
            <label class="form-label" style="margin-top: 8px; color: #1e40af;">Starting In Hmun Number *</label>
            <input type="number" name="starting_in_hmun_number" min="1" value="<?php echo htmlspecialchars($_POST['starting_in_hmun_number'] ?? '1001'); ?>" required class="form-control" style="font-family: var(--font-mono); font-weight: bold;">
          </div>
        </div>

        <!-- Section 3: Lifetime Verification Proof Upload -->
        <h3 style="font-size: 0.9rem; font-weight: 800; color: var(--primary-900); text-transform: uppercase; margin: 20px 0 12px 0; border-bottom: 1px solid var(--neutral-200); padding-bottom: 6px;">
          3. One-Time ₹299 Lifetime Portal Fee
        </h3>

        <div style="background-color: var(--neutral-50); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
          <p style="font-size: 0.8rem; color: var(--neutral-700); margin-bottom: 8px;">
            Pay ₹299 via Google Pay / PhonePe / Paytm / BHIM UPI to: <strong>ptlalfakzuala@okaxis</strong> (Authority Phone: <strong>7005504074</strong>).
          </p>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Upload Payment Screenshot / Receipt (Optional)</label>
            <input type="file" name="payment_screenshot" accept="image/*,.pdf" class="form-control">
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 0.95rem;">
          Complete Registration &amp; Enter Portal &rarr;
        </button>
      </form>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
