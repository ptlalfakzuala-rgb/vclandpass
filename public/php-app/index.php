<?php
$pageTitle = 'Land Pass Verification & Official Registry';
require_once __DIR__ . '/header.php';

$verifyNumber = trim($_GET['pass_number'] ?? '');
$foundPass = null;
$searched = false;

if (!empty($verifyNumber) && $pdo) {
    $searched = true;
    $stmt = $pdo->prepare("SELECT * FROM `land_passes` WHERE `pass_number` = ? LIMIT 1");
    $stmt->execute([$verifyNumber]);
    $foundPass = $stmt->fetch();
}
?>

<div style="max-width: 900px; margin: 0 auto;">
  <!-- Public Verification Panel -->
  <div class="card" style="border-top: 4px solid var(--primary-700);">
    <div class="card-header" style="background-color: var(--primary-50);">
      <div>
        <h2 style="color: var(--primary-900);">Official Land Pass Verification Portal</h2>
        <p style="font-size: 0.8rem; color: var(--neutral-600); margin-top: 2px;">
          Search and verify authenticity of Huan Ram and In Hmun Land Pass certificates issued by <?php echo htmlspecialchars($currentVillage['village_name']); ?>
        </p>
      </div>
    </div>
    <div class="card-body">
      <form method="GET" action="index.php" style="display: flex; gap: 10px; flex-wrap: wrap;">
        <input 
          type="text" 
          name="pass_number" 
          placeholder="Enter Pass Number (e.g. <?php echo htmlspecialchars($currentVillage['huan_ram_prefix'] . $currentVillage['starting_huan_ram_number']); ?>)" 
          value="<?php echo htmlspecialchars($verifyNumber); ?>" 
          required 
          class="form-control" 
          style="flex: 1; min-width: 260px; font-family: var(--font-mono); font-weight: bold;"
        >
        <button type="submit" class="btn btn-primary" style="padding: 10px 24px;">
          Verify Pass
        </button>
      </form>

      <?php if ($searched): ?>
        <div style="margin-top: 20px;">
          <?php if ($foundPass): ?>
            <div style="background-color: #ecfdf5; border: 2px solid #059669; border-radius: var(--radius-md); padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <div>
                  <span class="badge badge-live">Verified Official Land Pass</span>
                  <span class="badge <?php echo $foundPass['pass_type'] === 'huan_ram' ? 'badge-huan-ram' : 'badge-in-hmun'; ?>" style="margin-left: 6px;">
                    <?php echo $foundPass['pass_type'] === 'huan_ram' ? 'Huan Ram (Agricultural)' : 'In Hmun (Residential)'; ?>
                  </span>
                </div>
                <div style="font-family: var(--font-mono); font-weight: 800; font-size: 1.1rem; color: #064e3b;">
                  <?php echo htmlspecialchars($foundPass['pass_number']); ?>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 0.85rem;">
                <div><strong>Landholder Name:</strong><br><?php echo htmlspecialchars($foundPass['owner_name']); ?></div>
                <div><strong>Father's / Mother's Name:</strong><br><?php echo htmlspecialchars($foundPass['parent_name'] ?: 'N/A'); ?></div>
                <div><strong>Area Dimension:</strong><br><?php echo htmlspecialchars($foundPass['area_size'] ?: 'As per boundary survey'); ?></div>
                <div><strong>Date of Issue:</strong><br><?php echo htmlspecialchars($foundPass['issue_date']); ?></div>
                <div style="grid-column: 1 / -1;"><strong>Location:</strong><br><?php echo htmlspecialchars($foundPass['location_address'] ?: 'Within Village Council jurisdiction'); ?></div>
              </div>

              <div style="margin-top: 14px; text-align: right;">
                <a href="print_pass.php?id=<?php echo urlencode($foundPass['id']); ?>" target="_blank" class="btn btn-primary btn-sm">
                  View &amp; Print Official Certificate &rarr;
                </a>
              </div>
            </div>
          <?php else: ?>
            <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: var(--radius-md); padding: 16px; color: #991b1b;">
              <strong>Record Not Found:</strong> No land pass record found matching number "<strong><?php echo htmlspecialchars($verifyNumber); ?></strong>". Please verify the number or contact the Village Council Secretary.
            </div>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- Quick Access Portal Cards -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px;">
    <!-- Card 1: Secretary Login -->
    <div class="card">
      <div class="card-body" style="text-align: center; padding: 30px 20px;">
        <div style="width: 50px; height: 50px; background-color: var(--primary-50); color: var(--primary-800); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 20px; font-weight: bold;">
          VC
        </div>
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">Council Secretary Portal</h3>
        <p style="font-size: 0.8rem; color: var(--neutral-600); margin-bottom: 20px;">
          Issue new Land Passes, configure custom starting numbers, update boundary surveys, and print official certificates.
        </p>
        <?php if (is_logged_in()): ?>
          <a href="dashboard.php" class="btn btn-primary" style="width: 100%;">Open Secretary Dashboard</a>
        <?php else: ?>
          <a href="login.php" class="btn btn-primary" style="width: 100%;">Secretary Login</a>
        <?php endif; ?>
      </div>
    </div>

    <!-- Card 2: New Council Registration -->
    <div class="card">
      <div class="card-body" style="text-align: center; padding: 30px 20px;">
        <div style="width: 50px; height: 50px; background-color: var(--gold-100); color: var(--gold-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 20px; font-weight: bold;">
          ₹
        </div>
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">New Council Registration</h3>
        <p style="font-size: 0.8rem; color: var(--neutral-600); margin-bottom: 20px;">
          Register your Village Council Secretary account with one-time ₹299 lifetime access verification.
        </p>
        <a href="register.php" class="btn btn-gold" style="width: 100%;">Register Village Council</a>
      </div>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
