<?php
require_once __DIR__ . '/config.php';
require_login();
$pdo = get_db();

$format = $_GET['format'] ?? 'sql';

if ($format === 'csv') {
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="village_council_land_passes_' . date('Y-m-d') . '.csv"');

    $output = fopen('php://output', 'w');
    fputcsv($output, [
        'Pass Number', 'Pass Type', 'Landholder Name', 'Father/Mother Name',
        'Contact Number', 'Location Address', 'Village Council',
        'Area Size', 'North Boundary', 'East Boundary', 'West Boundary', 'South Boundary',
        'Issue Date', 'Approval Status'
    ]);

    $stmt = $pdo->query("SELECT * FROM `land_passes` ORDER BY `issue_date` DESC");
    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['pass_number'],
            $row['pass_type'],
            $row['owner_name'],
            $row['parent_name'],
            $row['contact_number'],
            $row['location_address'],
            $row['village_name'],
            $row['area_size'],
            $row['boundary_north'],
            $row['boundary_east'],
            $row['boundary_west'],
            $row['boundary_south'],
            $row['issue_date'],
            $row['approval_status'],
        ]);
    }
    fclose($output);
    exit;
}

// SQL Format (Default)
header('Content-Type: text/plain; charset=UTF-8');
header('Content-Disposition: attachment; filename="landpass_mysql_backup_' . date('Y-m-d_His') . '.sql"');

echo "-- =========================================================================\n";
echo "-- Village Council Land Pass Management System - Full MySQL Backup\n";
echo "-- Exported on: " . date('Y-m-d H:i:s') . "\n";
echo "-- =========================================================================\n\n";

if (file_exists(__DIR__ . '/schema.sql')) {
    echo file_get_contents(__DIR__ . '/schema.sql');
    echo "\n\n";
}

// Dump Current Live Passes
$passes = $pdo->query("SELECT * FROM `land_passes`")->fetchAll();
echo "-- -------------------------------------------------------------------------\n";
echo "-- Current Land Passes (" . count($passes) . " records)\n";
echo "-- -------------------------------------------------------------------------\n";
foreach ($passes as $p) {
    $id = addslashes($p['id']);
    $num = addslashes($p['pass_number']);
    $type = addslashes($p['pass_type']);
    $owner = addslashes($p['owner_name']);
    $parent = addslashes($p['parent_name'] ?? '');
    $phone = addslashes($p['contact_number'] ?? '');
    $addr = addslashes($p['location_address'] ?? '');
    $vid = addslashes($p['village_id']);
    $vname = addslashes($p['village_name'] ?? '');
    $area = addslashes($p['area_size'] ?? '');
    $bn = addslashes($p['boundary_north'] ?? '');
    $be = addslashes($p['boundary_east'] ?? '');
    $bw = addslashes($p['boundary_west'] ?? '');
    $bs = addslashes($p['boundary_south'] ?? '');
    $date = addslashes($p['issue_date']);
    $creator = addslashes($p['created_by'] ?? 'secretary');
    $status = addslashes($p['approval_status'] ?? 'live');

    echo "INSERT INTO `land_passes` (`id`, `pass_number`, `pass_type`, `owner_name`, `parent_name`, `contact_number`, `location_address`, `village_id`, `village_name`, `area_size`, `boundary_north`, `boundary_east`, `boundary_west`, `boundary_south`, `issue_date`, `created_by`, `approval_status`) VALUES ('$id', '$num', '$type', '$owner', '$parent', '$phone', '$addr', '$vid', '$vname', '$area', '$bn', '$be', '$bw', '$bs', '$date', '$creator', '$status') ON DUPLICATE KEY UPDATE `owner_name`=VALUES(`owner_name`);\n";
}
exit;
