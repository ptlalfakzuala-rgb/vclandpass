<?php
require_once __DIR__ . '/config.php';
$pdo = get_db();

$id = trim($_GET['id'] ?? '');
if (empty($id)) {
    die("Land Pass ID is missing.");
}

$stmt = $pdo->prepare("SELECT * FROM `land_passes` WHERE `id` = ? LIMIT 1");
$stmt->execute([$id]);
$pass = $stmt->fetch();

if (!$pass) {
    die("Land Pass record not found.");
}

$village = get_current_village($pdo, $pass['village_id']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Land Pass - <?php echo htmlspecialchars($pass['pass_number']); ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <style>
    body {
      background-color: #f3f4f6;
      padding: 20px 0;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .no-print-bar {
        display: none !important;
      }
    }
    .print-a4-page {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>

<!-- Top Browser Control Bar (Hidden when printed) -->
<div class="no-print-bar no-print" style="max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; background: #064e3b; color: #ffffff; padding: 10px 16px; border-radius: 8px;">
  <div>
    <strong>Official Land Pass Certificate View</strong> &bull; Pass No: <?php echo htmlspecialchars($pass['pass_number']); ?>
  </div>
  <div style="display: flex; gap: 8px;">
    <button onclick="window.print()" class="btn btn-gold btn-sm" style="font-weight: bold;">
      &#128424; Print Certificate / Save as PDF
    </button>
    <a href="view_pass.php?id=<?php echo urlencode($id); ?>" class="btn btn-secondary btn-sm" style="background:#ffffff; color:#064e3b;">
      &larr; Return to Portal
    </a>
  </div>
</div>

<div class="print-a4-page">
  <div class="pass-certificate" style="border: 4px double #064e3b; padding: 24px; min-height: 1000px; position: relative;">
    
    <!-- Watermark Background -->
    <div style="position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; font-weight: 900; color: rgba(6, 78, 59, 0.04); text-transform: uppercase; letter-spacing: 4px; pointer-events: none; text-align: center; width: 100%;">
      <?php echo htmlspecialchars($village['village_name']); ?><br>OFFICIAL RECORD
    </div>

    <!-- Certificate Header -->
    <div class="cert-header" style="border-bottom: 2px solid #064e3b; padding-bottom: 12px; margin-bottom: 16px;">
      <!-- Left Logo -->
      <div style="width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <?php if (!empty($village['logo_url'])): ?>
          <img src="<?php echo htmlspecialchars($village['logo_url']); ?>" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;">
        <?php else: ?>
          <div style="border: 2px solid #064e3b; width: 65px; height: 65px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #064e3b; font-size: 11px; text-align: center;">
            VC<br>COURT
          </div>
        <?php endif; ?>
      </div>

      <!-- Center Title -->
      <div class="cert-title-center" style="text-align: center; flex: 1;">
        <h1 style="font-size: 1.45rem; color: #064e3b; margin: 0; font-weight: 800; letter-spacing: 0.5px;">
          <?php echo htmlspecialchars($village['village_name']); ?>
        </h1>
        <h2 style="font-size: 1.05rem; color: #92400e; margin: 2px 0 0 0; font-weight: 700;">
          OFFICE OF THE VILLAGE COUNCIL
        </h2>
        <p style="font-size: 0.8rem; color: #404040; margin: 2px 0 0 0;">
          <?php echo htmlspecialchars(!empty($village['block_name']) ? $village['block_name'] . ', ' : ''); ?>
          <?php echo htmlspecialchars($village['district_name']); ?>, Mizoram
          <?php echo htmlspecialchars(!empty($village['pin_code']) ? ' - ' . $village['pin_code'] : ''); ?>
        </p>
      </div>

      <!-- Right Emblem -->
      <div style="width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <?php if (!empty($village['emblem_logo_url'])): ?>
          <img src="<?php echo htmlspecialchars($village['emblem_logo_url']); ?>" alt="Emblem" style="width: 70px; height: 70px; object-fit: contain;">
        <?php else: ?>
          <div style="border: 2px solid #064e3b; width: 65px; height: 65px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #064e3b; font-size: 9px; text-align: center; text-transform: uppercase;">
            STATE<br>EMBLEM
          </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- Certificate Badge Title -->
    <div style="text-align: center; margin: 14px 0 16px 0;">
      <span style="display: inline-block; background-color: #064e3b; color: #ffffff; padding: 4px 22px; border-radius: 4px; font-weight: 700; font-size: 0.95rem; letter-spacing: 1px; text-transform: uppercase;">
        <?php echo $pass['pass_type'] === 'huan_ram' ? 'HUAN RAM NEIHNA LEHKHA' : 'IN HMUN NEIHNA LEHKHA'; ?>
      </span>
    </div>

    <!-- Pass Serial Bar -->
    <div class="cert-meta-bar" style="display: flex; justify-content: space-between; font-size: 0.85rem; font-family: var(--font-mono); border-bottom: 1px dashed #cccccc; padding-bottom: 8px; margin-bottom: 16px;">
      <div><strong>Pass No:</strong> <span style="color: #064e3b; font-weight: 800;"><?php echo htmlspecialchars($pass['pass_number']); ?></span></div>
      <div><strong>Date of Issue:</strong> <?php echo htmlspecialchars($pass['issue_date']); ?></div>
    </div>

    <!-- Particulars Table -->
    <table class="cert-particulars" style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.875rem;">
      <tr>
        <td style="width: 32%; font-weight: bold; padding: 6px 8px; color: #333333;">Landholder Name</td>
        <td style="padding: 6px 8px;">: <strong><?php echo htmlspecialchars($pass['owner_name']); ?></strong></td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 6px 8px; color: #333333;">Father's / Mother's Name</td>
        <td style="padding: 6px 8px;">: <?php echo htmlspecialchars($pass['parent_name'] ?: 'N/A'); ?></td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 6px 8px; color: #333333;">Contact Phone</td>
        <td style="padding: 6px 8px;">: <?php echo htmlspecialchars($pass['contact_number'] ?: 'N/A'); ?></td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 6px 8px; color: #333333;">Location / Address</td>
        <td style="padding: 6px 8px;">: <?php echo htmlspecialchars($pass['location_address'] ?: 'Saiphai Village Council Jurisdiction'); ?></td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding: 6px 8px; color: #333333;">Area / Dimensions</td>
        <td style="padding: 6px 8px;">: <?php echo htmlspecialchars($pass['area_size'] ?: 'As per recorded boundary survey'); ?></td>
      </tr>
    </table>

    <!-- Boundaries Box -->
    <div class="cert-boundaries-box" style="border: 1px solid #064e3b; border-radius: 4px; padding: 12px; margin-bottom: 16px; background-color: #fafdfb;">
      <h4 style="font-size: 0.8rem; font-weight: 800; color: #064e3b; text-transform: uppercase; margin: 0 0 8px 0;">
        Ramri (Land Boundaries):
      </h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 0.825rem;">
        <div><strong>Hmar lam (North):</strong> <?php echo htmlspecialchars($pass['boundary_north']); ?></div>
        <div><strong>Chhim lam (South):</strong> <?php echo htmlspecialchars($pass['boundary_south']); ?></div>
        <div><strong>Chhak lam (East):</strong> <?php echo htmlspecialchars($pass['boundary_east']); ?></div>
        <div><strong>Thlang lam (West):</strong> <?php echo htmlspecialchars($pass['boundary_west']); ?></div>
      </div>
    </div>

    <!-- Conditions -->
    <div class="cert-terms-box" style="font-size: 0.725rem; color: #525252; line-height: 1.4; margin-bottom: 24px; background-color: #fcfcfc; padding: 10px; border-left: 3px solid #065f46; white-space: pre-line;">
      <strong>Conditions &amp; Restrictions:</strong>
      <?php echo htmlspecialchars($village['conditions_and_terms']); ?>
    </div>

    <!-- Signatures -->
    <div class="cert-signatures" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; text-align: center;">
      <div class="sig-block" style="width: 200px;">
        <div style="border-top: 1px solid #000000; margin-bottom: 4px;"></div>
        <div style="font-size: 0.825rem; font-weight: 700;">
          <?php echo htmlspecialchars($pass['secretary_signatory'] ?: ($village['secretary_name'] ?: 'Secretary')); ?>
        </div>
        <div style="font-size: 0.75rem; color: #525252;">Secretary, Village Council</div>
      </div>

      <div style="text-align: center;">
        <div style="width: 80px; height: 80px; border: 1px dashed #888888; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #737373; text-transform: uppercase;">
          OFFICIAL<br>VC RUBBER<br>SEAL
        </div>
      </div>

      <div class="sig-block" style="width: 200px;">
        <div style="border-top: 1px solid #000000; margin-bottom: 4px;"></div>
        <div style="font-size: 0.825rem; font-weight: 700;">
          <?php echo htmlspecialchars($pass['president_signatory'] ?: ($village['president_name'] ?: 'President')); ?>
        </div>
        <div style="font-size: 0.75rem; color: #525252;">President, Village Council</div>
      </div>
    </div>

  </div>
</div>

</body>
</html>
