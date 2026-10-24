<?php
require_once __DIR__ . '/config.php';
$pdo = get_db();
$currentVillage = get_current_village($pdo);
$user = current_user();
$pageTitle = $pageTitle ?? $currentVillage['village_name'] . ' - Land Pass Portal';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><?php echo htmlspecialchars($pageTitle); ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>
<body>

<header class="site-header">
  <div class="header-top">
    <!-- Brand / Village Council Seal -->
    <a href="index.php" class="brand-wrapper">
      <div class="brand-logo-frame">
        <?php if (!empty($currentVillage['logo_url'])): ?>
          <img src="<?php echo htmlspecialchars($currentVillage['logo_url']); ?>" alt="Council Logo">
        <?php else: ?>
          <div class="brand-logo-placeholder">VC<br><span style="font-size:7px; font-weight:normal;">COURT</span></div>
        <?php endif; ?>
      </div>
      <div class="brand-titles">
        <h1><?php echo htmlspecialchars($currentVillage['village_name']); ?></h1>
        <p>
          <?php echo htmlspecialchars(!empty($currentVillage['block_name']) ? $currentVillage['block_name'] . ', ' : ''); ?>
          <?php echo htmlspecialchars($currentVillage['district_name']); ?>, Mizoram
          <?php echo htmlspecialchars(!empty($currentVillage['pin_code']) ? ' - ' . $currentVillage['pin_code'] : ''); ?>
        </p>
      </div>
    </a>

    <!-- Navigation Links -->
    <nav class="header-nav">
      <a href="index.php" class="nav-link">Home / Verify</a>

      <?php if (is_logged_in() || is_authority()): ?>
        <a href="dashboard.php" class="nav-link">Land Passes</a>
        <?php if (is_authority() || (isset($user['status']) && $user['status'] === 'approved')): ?>
          <a href="issue_pass.php" class="nav-link nav-btn-primary">+ Issue Land Pass</a>
        <?php endif; ?>
        <a href="village_profile.php" class="nav-link">Council Profile</a>
        <a href="secretary_profile.php" class="nav-link">Secretary</a>
        <a href="audit_logs.php" class="nav-link">Audit Trail</a>
        <?php if (is_authority()): ?>
          <a href="authority.php" class="nav-link" style="color:#fde68a; font-weight:bold;">Authority Panel</a>
        <?php endif; ?>
        <a href="logout.php" class="nav-link" style="color:#fca5a5;">Logout</a>
      <?php else: ?>
        <a href="login.php" class="nav-link">Secretary Login</a>
        <a href="register.php" class="nav-link nav-btn-primary">Register Account</a>
      <?php endif; ?>
    </nav>
  </div>

  <!-- Sub-header status bar -->
  <div class="sub-nav-bar no-print">
    <div class="sub-nav-content">
      <div>
        <span>Starting Pass No: </span>
        <strong style="color:#ffffff;">
          HR: <?php echo htmlspecialchars($currentVillage['huan_ram_prefix'] . $currentVillage['starting_huan_ram_number']); ?> | 
          IH: <?php echo htmlspecialchars($currentVillage['in_hmun_prefix'] . $currentVillage['starting_in_hmun_number']); ?>
        </strong>
      </div>
      <div>
        <?php if (is_logged_in()): ?>
          <span>Logged in as: <strong><?php echo htmlspecialchars($user['display_name']); ?></strong> (<?php echo htmlspecialchars($user['user_type']); ?>)</span>
        <?php else: ?>
          <span>Public Access &bull; Land Pass QR Verification</span>
        <?php endif; ?>
      </div>
    </div>
  </div>
</header>

<main class="main-container">
  <!-- Flash Notification Messages -->
  <?php foreach (get_flash() as $flash): ?>
    <div class="flash-message flash-<?php echo htmlspecialchars($flash['type']); ?>">
      <span><?php echo htmlspecialchars($flash['message']); ?></span>
    </div>
  <?php endforeach; ?>
