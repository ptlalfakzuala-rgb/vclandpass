<?php
$pageTitle = 'Land Pass Certificate Details';
require_once __DIR__ . '/config.php';
$pdo = get_db();

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
    header('Location: index.php');
    exit;
}

$village = get_current_village($pdo, $pass['village_id']);

require_once __DIR__ . '/header.php';
?>

<div style="max-width: 840px; margin: 0 auto;">
  <!-- Action Header Bar -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;" class="no-print">
    <div>
      <a href="dashboard.php" class="btn btn-secondary btn-sm">&larr; Back to Dashboard</a>
    </div>
    <div style="display: flex; gap: 10px;">
      <a href="print_pass.php?id=<?php echo urlencode($id); ?>" target="_blank" class="btn btn-primary" style="padding: 9px 22px;">
        &#128424; Print Official A4 Certificate
      </a>
      <?php if (is_logged_in()): ?>
        <a href="edit_pass.php?id=<?php echo urlencode($id); ?>" class="btn btn-secondary btn-sm">Edit</a>
        <a href="delete_pass.php?id=<?php echo urlencode($id); ?>" class="btn btn-danger btn-sm">Delete</a>
      <?php endif; ?>
    </div>
  </div>

  <!-- Certificate Preview Card -->
  <div class="pass-certificate-wrapper">
    <div class="pass-certificate">
      <!-- Certificate Header -->
      <div class="cert-header">
        <div style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
          <?php if (!empty($village['logo_url'])): ?>
            <img src="<?php echo htmlspecialchars($village['logo_url']); ?>" alt="Logo" class="cert-emblem">
          <?php else: ?>
            <div style="border: 2px solid #064e3b; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #064e3b; font-size: 11px; text-align: center;">
              VC<br>SEAL
            </div>
          <?php endif; ?>
        </div>

        <div class="cert-title-center">
          <h1><?php echo htmlspecialchars($village['village_name']); ?></h1>
          <h2>OFFICE OF THE VILLAGE COUNCIL</h2>
          <p>
            <?php echo htmlspecialchars(!empty($village['block_name']) ? $village['block_name'] . ', ' : ''); ?>
            <?php echo htmlspecialchars($village['district_name']); ?>, Mizoram
            <?php echo htmlspecialchars(!empty($village['pin_code']) ? ' - ' . $village['pin_code'] : ''); ?>
          </p>
        </div>

        <div style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
          <div style="border: 2px solid #064e3b; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #064e3b; font-size: 9px; text-align: center; text-transform: uppercase;">
            STATE<br>EMBLEM
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 12px 0 16px 0;">
        <span style="display: inline-block; background-color: #064e3b; color: #ffffff; padding: 4px 18px; border-radius: 4px; font-weight: 700; font-size: 0.95rem; letter-spacing: 1px; text-transform: uppercase;">
          <?php echo $pass['pass_type'] === 'huan_ram' ? 'HUAN RAM NEIHNA LEHKHA' : 'IN HMUN NEIHNA LEHKHA'; ?>
        </span>
      </div>

      <!-- Pass Serial Meta -->
      <div class="cert-meta-bar">
        <div><strong>Pass No:</strong> <span style="color: #064e3b; font-weight: 800;"><?php echo htmlspecialchars($pass['pass_number']); ?></span></div>
        <div><strong>Issue Date:</strong> <?php echo htmlspecialchars($pass['issue_date']); ?></div>
      </div>

      <!-- Landholder Details Table -->
      <table class="cert-particulars">
        <tr>
          <td class="label">Landholder Name</td>
          <td>: <strong><?php echo htmlspecialchars($pass['owner_name']); ?></strong></td>
        </tr>
        <tr>
          <td class="label">Father's / Mother's Name</td>
          <td>: <?php echo htmlspecialchars($pass['parent_name'] ?: 'N/A'); ?></td>
        </tr>
        <tr>
          <td class="label">Contact Phone Number</td>
          <td>: <?php echo htmlspecialchars($pass['contact_number'] ?: 'N/A'); ?></td>
        </tr>
        <tr>
          <td class="label">Location / Veng / Field</td>
          <td>: <?php echo htmlspecialchars($pass['location_address'] ?: 'Saiphai Village Area'); ?></td>
        </tr>
        <tr>
          <td class="label">Land Dimensions / Area</td>
          <td>: <?php echo htmlspecialchars($pass['area_size'] ?: 'As per boundary survey'); ?></td>
        </tr>
      </table>

      <!-- Boundary Survey (Ramri) -->
      <div class="cert-boundaries-box">
        <h4>Ramri (Land Boundaries):</h4>
        <div class="cert-boundaries-grid">
          <div><strong>Hmar lam (North):</strong> <?php echo htmlspecialchars($pass['boundary_north']); ?></div>
          <div><strong>Chhim lam (South):</strong> <?php echo htmlspecialchars($pass['boundary_south']); ?></div>
          <div><strong>Chhak lam (East):</strong> <?php echo htmlspecialchars($pass['boundary_east']); ?></div>
          <div><strong>Thlang lam (West):</strong> <?php echo htmlspecialchars($pass['boundary_west']); ?></div>
        </div>
      </div>

      <!-- Village Terms & Bylaws -->
      <div class="cert-terms-box">
        <strong>Conditions &amp; Restrictions:</strong><br>
        <?php echo nl2br(htmlspecialchars($village['conditions_and_terms'])); ?>
      </div>

      <!-- Official Signatures -->
      <div class="cert-signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div style="font-size: 0.825rem; font-weight: 700;">
            <?php echo htmlspecialchars($pass['secretary_signatory'] ?: ($village['secretary_name'] ?: 'Secretary')); ?>
          </div>
          <div style="font-size: 0.75rem; color: #525252;">Secretary, Village Council</div>
        </div>

        <div style="text-align: center;">
          <div class="sig-seal-box">
            OFFICIAL<br>VC RUBBER<br>SEAL
          </div>
        </div>

        <div class="sig-block">
          <div class="sig-line"></div>
          <div style="font-size: 0.825rem; font-weight: 700;">
            <?php echo htmlspecialchars($pass['president_signatory'] ?: ($village['president_name'] ?: 'President')); ?>
          </div>
          <div style="font-size: 0.75rem; color: #525252;">President, Village Council</div>
        </div>
      </div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
