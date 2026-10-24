<?php
/**
 * Village Council Land Pass Management System
 * Production PHP REST API Storage Endpoint
 * 
 * Handles all CRUD operations, full data synchronization, and MySQL/JSON storage.
 */

require_once __DIR__ . '/config.php';

// Helper to read incoming JSON payload
function getJsonPayload(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Helper to send JSON response
function jsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$payload = getJsonPayload();
if (empty($action) && isset($payload['action'])) {
    $action = $payload['action'];
}

$pdo = Database::getConnection();
$isJson = Database::isJsonFallback();

switch ($action) {
    // -------------------------------------------------------------------------
    // 1. Healthcheck & Storage Status
    // -------------------------------------------------------------------------
    case 'status':
    case 'ping':
        $passCount = 0;
        $villageCount = 0;
        $userCount = 0;
        $logCount = 0;

        if ($pdo) {
            try {
                $passCount = (int)$pdo->query("SELECT COUNT(*) FROM `land_passes`")->fetchColumn();
                $villageCount = (int)$pdo->query("SELECT COUNT(*) FROM `villages`")->fetchColumn();
                $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
                $logCount = (int)$pdo->query("SELECT COUNT(*) FROM `audit_logs`")->fetchColumn();
            } catch (Exception $e) {
                // Tables might not exist yet
            }
        } else {
            $passCount = count(JsonStorage::read('land_passes'));
            $villageCount = count(JsonStorage::read('villages'));
            $userCount = count(JsonStorage::read('users'));
            $logCount = count(JsonStorage::read('audit_logs'));
        }

        jsonResponse([
            'success' => true,
            'status' => 'online',
            'php_version' => PHP_VERSION,
            'storage_engine' => $pdo ? 'MySQL (Relational)' : 'JSON File Storage (Fallback)',
            'database_connected' => $pdo !== null,
            'counts' => [
                'passes' => $passCount,
                'villages' => $villageCount,
                'users' => $userCount,
                'logs' => $logCount,
            ],
            'server_time' => date('c'),
            'message' => $pdo ? 'PHP MySQL Database connection is active and operational.' : 'Operating with zero-setup PHP JSON file storage. MySQL can be configured anytime in config.php.'
        ]);
        break;

    // -------------------------------------------------------------------------
    // 2. Land Passes: Get, Save, Delete
    // -------------------------------------------------------------------------
    case 'get_passes':
        $villageId = $_GET['village_id'] ?? null;
        $passType = $_GET['pass_type'] ?? null;

        if ($pdo) {
            $sql = "SELECT * FROM `land_passes` WHERE 1=1";
            $params = [];
            if ($villageId) {
                $sql .= " AND `village_id` = ?";
                $params[] = $villageId;
            }
            if ($passType) {
                $sql .= " AND `pass_type` = ?";
                $params[] = $passType;
            }
            $sql .= " ORDER BY `created_at` DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            // Format column names to camelCase for React app
            $passes = array_map(function ($row) {
                return [
                    'id' => $row['id'],
                    'passNumber' => $row['pass_number'],
                    'passType' => $row['pass_type'],
                    'ownerName' => $row['owner_name'],
                    'parentName' => $row['parent_name'] ?? '',
                    'contactNumber' => $row['contact_number'] ?? '',
                    'locationAddress' => $row['location_address'] ?? '',
                    'villageId' => $row['village_id'],
                    'villageName' => $row['village_name'] ?? '',
                    'areaDimension' => $row['area_dimension'] ?? '',
                    'boundaryNorth' => $row['boundary_north'] ?? '',
                    'boundaryEast' => $row['boundary_east'] ?? '',
                    'boundaryWest' => $row['boundary_west'] ?? '',
                    'boundarySouth' => $row['boundary_south'] ?? '',
                    'issueDate' => $row['issue_date'],
                    'validUpto' => $row['valid_upto'] ?? '',
                    'createdBy' => $row['created_by'] ?? 'secretary',
                    'approvalStatus' => $row['approval_status'] ?? 'pending_approval',
                    'createdAt' => $row['created_at'],
                    'updatedAt' => $row['updated_at'],
                    'syncedToCloud' => true,
                ];
            }, $rows);

            jsonResponse(['success' => true, 'passes' => $passes]);
        } else {
            $passes = JsonStorage::read('land_passes');
            if ($villageId) {
                $passes = array_values(array_filter($passes, fn($p) => ($p['villageId'] ?? '') === $villageId));
            }
            if ($passType) {
                $passes = array_values(array_filter($passes, fn($p) => ($p['passType'] ?? '') === $passType));
            }
            jsonResponse(['success' => true, 'passes' => $passes]);
        }
        break;

    case 'save_pass':
        $pass = $payload['pass'] ?? $payload;
        if (empty($pass['id']) || empty($pass['passNumber'])) {
            jsonResponse(['success' => false, 'error' => 'Missing pass id or passNumber'], 400);
        }

        if ($pdo) {
            $sql = "INSERT INTO `land_passes` (
                `id`, `pass_number`, `pass_type`, `owner_name`, `parent_name`, `contact_number`,
                `location_address`, `village_id`, `village_name`, `area_dimension`,
                `boundary_north`, `boundary_east`, `boundary_west`, `boundary_south`,
                `issue_date`, `valid_upto`, `created_by`, `approval_status`, `created_at`, `updated_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                `pass_number` = VALUES(`pass_number`),
                `pass_type` = VALUES(`pass_type`),
                `owner_name` = VALUES(`owner_name`),
                `parent_name` = VALUES(`parent_name`),
                `contact_number` = VALUES(`contact_number`),
                `location_address` = VALUES(`location_address`),
                `village_id` = VALUES(`village_id`),
                `village_name` = VALUES(`village_name`),
                `area_dimension` = VALUES(`area_dimension`),
                `boundary_north` = VALUES(`boundary_north`),
                `boundary_east` = VALUES(`boundary_east`),
                `boundary_west` = VALUES(`boundary_west`),
                `boundary_south` = VALUES(`boundary_south`),
                `issue_date` = VALUES(`issue_date`),
                `valid_upto` = VALUES(`valid_upto`),
                `approval_status` = VALUES(`approval_status`),
                `updated_at` = VALUES(`updated_at`)";

            $stmt = $pdo->prepare($sql);
            $now = date('Y-m-d H:i:s');
            $stmt->execute([
                $pass['id'],
                $pass['passNumber'],
                $pass['passType'] ?? 'huan_ram',
                $pass['ownerName'] ?? '',
                $pass['parentName'] ?? '',
                $pass['contactNumber'] ?? '',
                $pass['locationAddress'] ?? '',
                $pass['villageId'] ?? 'village_default',
                $pass['villageName'] ?? '',
                $pass['areaDimension'] ?? '',
                $pass['boundaryNorth'] ?? '',
                $pass['boundaryEast'] ?? '',
                $pass['boundaryWest'] ?? '',
                $pass['boundarySouth'] ?? '',
                !empty($pass['issueDate']) ? substr($pass['issueDate'], 0, 10) : date('Y-m-d'),
                !empty($pass['validUpto']) ? substr($pass['validUpto'], 0, 10) : null,
                $pass['createdBy'] ?? 'secretary',
                $pass['approvalStatus'] ?? 'pending_approval',
                !empty($pass['createdAt']) ? date('Y-m-d H:i:s', strtotime($pass['createdAt'])) : $now,
                $now
            ]);
        } else {
            JsonStorage::saveItem('land_passes', 'id', $pass);
        }

        jsonResponse(['success' => true, 'message' => 'Land Pass saved successfully', 'pass' => $pass]);
        break;

    case 'delete_pass':
        $id = $payload['id'] ?? $_GET['id'] ?? '';
        if (!$id) {
            jsonResponse(['success' => false, 'error' => 'Missing pass id'], 400);
        }

        if ($pdo) {
            $stmt = $pdo->prepare("DELETE FROM `land_passes` WHERE `id` = ?");
            $stmt->execute([$id]);
        } else {
            JsonStorage::deleteItem('land_passes', 'id', $id);
        }

        jsonResponse(['success' => true, 'message' => 'Land Pass permanently deleted']);
        break;

    // -------------------------------------------------------------------------
    // 3. Village Profiles: Get & Save
    // -------------------------------------------------------------------------
    case 'get_villages':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM `villages` ORDER BY `village_name` ASC");
            $rows = $stmt->fetchAll();
            $villages = array_map(function ($row) {
                return [
                    'id' => $row['id'],
                    'villageName' => $row['village_name'],
                    'blockName' => $row['block_name'] ?? '',
                    'districtName' => $row['district_name'] ?? 'Mizoram',
                    'stateName' => $row['state_name'] ?? 'Mizoram',
                    'pinCode' => $row['pin_code'] ?? '',
                    'huanRamPrefix' => $row['huan_ram_prefix'] ?? 'MZ-VC-HR-',
                    'inHmunPrefix' => $row['in_hmun_prefix'] ?? 'MZ-VC-IH-',
                    'startingPassNumber' => (int)($row['starting_pass_number'] ?? 1001),
                    'startingHuanRamNumber' => (int)($row['starting_huan_ram_number'] ?? 1001),
                    'startingInHmunNumber' => (int)($row['starting_in_hmun_number'] ?? 1001),
                    'logoUrl' => $row['logo_url'] ?? '',
                    'emblemLogoUrl' => $row['emblem_logo_url'] ?? '',
                    'conditionsAndTerms' => $row['conditions_and_terms'] ?? '',
                    'presidentName' => $row['president_name'] ?? '',
                    'updatedAt' => $row['updated_at'],
                ];
            }, $rows);
            jsonResponse(['success' => true, 'villages' => $villages]);
        } else {
            jsonResponse(['success' => true, 'villages' => JsonStorage::read('villages')]);
        }
        break;

    case 'save_village':
        $village = $payload['village'] ?? $payload;
        if (empty($village['id']) || empty($village['villageName'])) {
            jsonResponse(['success' => false, 'error' => 'Missing village id or villageName'], 400);
        }

        if ($pdo) {
            $sql = "INSERT INTO `villages` (
                `id`, `village_name`, `block_name`, `district_name`, `state_name`, `pin_code`,
                `huan_ram_prefix`, `in_hmun_prefix`, `starting_pass_number`, `starting_huan_ram_number`, `starting_in_hmun_number`,
                `logo_url`, `emblem_logo_url`, `conditions_and_terms`, `president_name`, `updated_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                `village_name` = VALUES(`village_name`),
                `block_name` = VALUES(`block_name`),
                `district_name` = VALUES(`district_name`),
                `state_name` = VALUES(`state_name`),
                `pin_code` = VALUES(`pin_code`),
                `huan_ram_prefix` = VALUES(`huan_ram_prefix`),
                `in_hmun_prefix` = VALUES(`in_hmun_prefix`),
                `starting_pass_number` = VALUES(`starting_pass_number`),
                `starting_huan_ram_number` = VALUES(`starting_huan_ram_number`),
                `starting_in_hmun_number` = VALUES(`starting_in_hmun_number`),
                `logo_url` = VALUES(`logo_url`),
                `emblem_logo_url` = VALUES(`emblem_logo_url`),
                `conditions_and_terms` = VALUES(`conditions_and_terms`),
                `president_name` = VALUES(`president_name`),
                `updated_at` = VALUES(`updated_at`)";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $village['id'],
                $village['villageName'],
                $village['blockName'] ?? '',
                $village['districtName'] ?? 'Mizoram',
                $village['stateName'] ?? 'Mizoram',
                $village['pinCode'] ?? '',
                $village['huanRamPrefix'] ?? 'MZ-VC-HR-',
                $village['inHmunPrefix'] ?? 'MZ-VC-IH-',
                (int)($village['startingPassNumber'] ?? 1001),
                (int)($village['startingHuanRamNumber'] ?? 1001),
                (int)($village['startingInHmunNumber'] ?? 1001),
                $village['logoUrl'] ?? null,
                $village['emblemLogoUrl'] ?? null,
                $village['conditionsAndTerms'] ?? null,
                $village['presidentName'] ?? '',
                date('Y-m-d H:i:s')
            ]);
        } else {
            JsonStorage::saveItem('villages', 'id', $village);
        }

        jsonResponse(['success' => true, 'message' => 'Village Profile saved to PHP storage', 'village' => $village]);
        break;

    // -------------------------------------------------------------------------
    // 4. Users: Get, Save, Authenticate
    // -------------------------------------------------------------------------
    case 'get_users':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM `users` ORDER BY `created_at` DESC");
            $rows = $stmt->fetchAll();
            $users = array_map(function ($row) {
                return [
                    'uid' => $row['uid'],
                    'username' => $row['username'],
                    'displayName' => $row['display_name'],
                    'phoneNumber' => $row['phone_number'] ?? '',
                    'villageId' => $row['village_id'] ?? '',
                    'villageName' => $row['village_name'] ?? '',
                    'userType' => $row['user_type'] ?? 'secretary',
                    'status' => $row['status'] ?? 'pending',
                    'paymentScreenshotUrl' => $row['payment_screenshot_url'] ?? '',
                    'createdAt' => $row['created_at'],
                    'approvedAt' => $row['approved_at'] ?? null,
                ];
            }, $rows);
            jsonResponse(['success' => true, 'users' => $users]);
        } else {
            jsonResponse(['success' => true, 'users' => JsonStorage::read('users')]);
        }
        break;

    case 'save_user':
        $user = $payload['user'] ?? $payload;
        if (empty($user['uid']) || empty($user['username'])) {
            jsonResponse(['success' => false, 'error' => 'Missing uid or username'], 400);
        }

        if ($pdo) {
            $sql = "INSERT INTO `users` (
                `uid`, `username`, `password_hash`, `display_name`, `phone_number`,
                `village_id`, `village_name`, `user_type`, `status`, `payment_screenshot_url`,
                `created_at`, `approved_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                `display_name` = VALUES(`display_name`),
                `phone_number` = VALUES(`phone_number`),
                `village_id` = VALUES(`village_id`),
                `village_name` = VALUES(`village_name`),
                `status` = VALUES(`status`),
                `payment_screenshot_url` = VALUES(`payment_screenshot_url`),
                `approved_at` = VALUES(`approved_at`)";

            $stmt = $pdo->prepare($sql);
            $now = date('Y-m-d H:i:s');
            $stmt->execute([
                $user['uid'],
                $user['username'],
                $user['passwordHash'] ?? null,
                $user['displayName'] ?? $user['username'],
                $user['phoneNumber'] ?? '',
                $user['villageId'] ?? null,
                $user['villageName'] ?? '',
                $user['userType'] ?? 'secretary',
                $user['status'] ?? 'pending',
                $user['paymentScreenshotUrl'] ?? null,
                !empty($user['createdAt']) ? date('Y-m-d H:i:s', strtotime($user['createdAt'])) : $now,
                !empty($user['approvedAt']) ? date('Y-m-d H:i:s', strtotime($user['approvedAt'])) : null,
            ]);
        } else {
            JsonStorage::saveItem('users', 'uid', $user);
        }

        jsonResponse(['success' => true, 'message' => 'User account stored in PHP database']);
        break;

    // -------------------------------------------------------------------------
    // 5. Audit Logs
    // -------------------------------------------------------------------------
    case 'get_logs':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM `audit_logs` ORDER BY `timestamp` DESC LIMIT 200");
            $logs = $stmt->fetchAll();
            jsonResponse(['success' => true, 'logs' => $logs]);
        } else {
            jsonResponse(['success' => true, 'logs' => JsonStorage::read('audit_logs')]);
        }
        break;

    case 'log_activity':
        $log = $payload['log'] ?? $payload;
        $id = $log['id'] ?? ('log_' . microtime(true));

        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO `audit_logs` (`id`, `timestamp`, `action`, `target_id`, `target_name`, `performed_by`, `details`) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                date('Y-m-d H:i:s'),
                $log['action'] ?? 'UNKNOWN',
                $log['targetId'] ?? $log['target_id'] ?? '',
                $log['targetName'] ?? $log['target_name'] ?? '',
                $log['performedBy'] ?? $log['performed_by'] ?? 'Secretary',
                $log['details'] ?? ''
            ]);
        } else {
            $log['id'] = $id;
            $log['timestamp'] = date('c');
            $allLogs = JsonStorage::read('audit_logs');
            array_unshift($allLogs, $log);
            if (count($allLogs) > 500) $allLogs = array_slice($allLogs, 0, 500);
            JsonStorage::write('audit_logs', $allLogs);
        }

        jsonResponse(['success' => true, 'message' => 'Activity logged']);
        break;

    // -------------------------------------------------------------------------
    // 6. Transfer All Data (Bulk migration from Frontend/Firebase to PHP Storage)
    // -------------------------------------------------------------------------
    case 'transfer_all':
        $passes = $payload['passes'] ?? [];
        $villages = $payload['villages'] ?? [];
        $users = $payload['users'] ?? [];
        $logs = $payload['logs'] ?? [];

        $transferredPasses = 0;
        $transferredVillages = 0;
        $transferredUsers = 0;
        $transferredLogs = 0;

        // Villages
        foreach ($villages as $v) {
            if (empty($v['id'])) continue;
            if ($pdo) {
                $sql = "INSERT INTO `villages` (`id`, `village_name`, `block_name`, `district_name`, `state_name`, `pin_code`, `huan_ram_prefix`, `in_hmun_prefix`, `starting_pass_number`, `starting_huan_ram_number`, `starting_in_hmun_number`, `logo_url`, `emblem_logo_url`, `conditions_and_terms`, `president_name`, `updated_at`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE `village_name`=VALUES(`village_name`), `huan_ram_prefix`=VALUES(`huan_ram_prefix`), `in_hmun_prefix`=VALUES(`in_hmun_prefix`), `starting_pass_number`=VALUES(`starting_pass_number`), `starting_huan_ram_number`=VALUES(`starting_huan_ram_number`), `starting_in_hmun_number`=VALUES(`starting_in_hmun_number`), `logo_url`=VALUES(`logo_url`), `conditions_and_terms`=VALUES(`conditions_and_terms`), `president_name`=VALUES(`president_name`)";
                $pdo->prepare($sql)->execute([
                    $v['id'], $v['villageName'] ?? '', $v['blockName'] ?? '', $v['districtName'] ?? 'Mizoram', $v['stateName'] ?? 'Mizoram', $v['pinCode'] ?? '',
                    $v['huanRamPrefix'] ?? 'MZ-VC-HR-', $v['inHmunPrefix'] ?? 'MZ-VC-IH-', (int)($v['startingPassNumber'] ?? 1001), (int)($v['startingHuanRamNumber'] ?? 1001), (int)($v['startingInHmunNumber'] ?? 1001),
                    $v['logoUrl'] ?? null, $v['emblemLogoUrl'] ?? null, $v['conditionsAndTerms'] ?? null, $v['presidentName'] ?? '', date('Y-m-d H:i:s')
                ]);
            } else {
                JsonStorage::saveItem('villages', 'id', $v);
            }
            $transferredVillages++;
        }

        // Passes
        foreach ($passes as $p) {
            if (empty($p['id']) || empty($p['passNumber'])) continue;
            if ($pdo) {
                $sql = "INSERT INTO `land_passes` (`id`, `pass_number`, `pass_type`, `owner_name`, `parent_name`, `contact_number`, `location_address`, `village_id`, `village_name`, `area_dimension`, `boundary_north`, `boundary_east`, `boundary_west`, `boundary_south`, `issue_date`, `valid_upto`, `created_by`, `approval_status`, `created_at`, `updated_at`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE `pass_number`=VALUES(`pass_number`), `owner_name`=VALUES(`owner_name`), `area_dimension`=VALUES(`area_dimension`), `approval_status`=VALUES(`approval_status`), `updated_at`=VALUES(`updated_at`)";
                $pdo->prepare($sql)->execute([
                    $p['id'], $p['passNumber'], $p['passType'] ?? 'huan_ram', $p['ownerName'] ?? '', $p['parentName'] ?? '', $p['contactNumber'] ?? '', $p['locationAddress'] ?? '',
                    $p['villageId'] ?? 'village_default', $p['villageName'] ?? '', $p['areaDimension'] ?? '', $p['boundaryNorth'] ?? '', $p['boundaryEast'] ?? '', $p['boundaryWest'] ?? '', $p['boundarySouth'] ?? '',
                    !empty($p['issueDate']) ? substr($p['issueDate'], 0, 10) : date('Y-m-d'), !empty($p['validUpto']) ? substr($p['validUpto'], 0, 10) : null,
                    $p['createdBy'] ?? 'secretary', $p['approvalStatus'] ?? 'live', date('Y-m-d H:i:s'), date('Y-m-d H:i:s')
                ]);
            } else {
                JsonStorage::saveItem('land_passes', 'id', $p);
            }
            $transferredPasses++;
        }

        // Users
        foreach ($users as $u) {
            if (empty($u['uid'])) continue;
            if ($pdo) {
                $sql = "INSERT INTO `users` (`uid`, `username`, `display_name`, `phone_number`, `village_id`, `village_name`, `user_type`, `status`, `payment_screenshot_url`, `created_at`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`), `status`=VALUES(`status`), `payment_screenshot_url`=VALUES(`payment_screenshot_url`)";
                $pdo->prepare($sql)->execute([
                    $u['uid'], $u['username'] ?? $u['displayName'], $u['displayName'] ?? $u['username'], $u['phoneNumber'] ?? '', $u['villageId'] ?? null, $u['villageName'] ?? '',
                    $u['userType'] ?? 'secretary', $u['status'] ?? 'approved', $u['paymentScreenshotUrl'] ?? null, date('Y-m-d H:i:s')
                ]);
            } else {
                JsonStorage::saveItem('users', 'uid', $u);
            }
            $transferredUsers++;
        }

        // Logs
        foreach ($logs as $l) {
            if (empty($l['id'])) continue;
            if ($pdo) {
                try {
                    $pdo->prepare("INSERT IGNORE INTO `audit_logs` (`id`, `timestamp`, `action`, `target_id`, `target_name`, `performed_by`, `details`) VALUES (?, ?, ?, ?, ?, ?, ?)")
                        ->execute([$l['id'], date('Y-m-d H:i:s'), $l['action'] ?? 'LOG', $l['targetId'] ?? '', $l['targetName'] ?? '', $l['performedBy'] ?? 'Secretary', $l['details'] ?? '']);
                } catch (Exception $e) {}
            } else {
                JsonStorage::saveItem('audit_logs', 'id', $l);
            }
            $transferredLogs++;
        }

        jsonResponse([
            'success' => true,
            'storage_engine' => $pdo ? 'MySQL' : 'JSON Files',
            'message' => "Successfully transferred {$transferredPasses} Passes, {$transferredVillages} Villages, {$transferredUsers} Users, and {$transferredLogs} Audit Logs into PHP Backend storage!",
            'transferred' => [
                'passes' => $transferredPasses,
                'villages' => $transferredVillages,
                'users' => $transferredUsers,
                'logs' => $transferredLogs,
            ]
        ]);
        break;

    // -------------------------------------------------------------------------
    // 7. Export MySQL SQL Dump
    // -------------------------------------------------------------------------
    case 'export_sql':
        header('Content-Type: text/plain; charset=UTF-8');
        header('Content-Disposition: attachment; filename="village_council_landpass_backup_' . date('Y-m-d_His') . '.sql"');

        $passes = $pdo ? $pdo->query("SELECT * FROM `land_passes`")->fetchAll() : JsonStorage::read('land_passes');
        $villages = $pdo ? $pdo->query("SELECT * FROM `villages`")->fetchAll() : JsonStorage::read('villages');
        $users = $pdo ? $pdo->query("SELECT * FROM `users`")->fetchAll() : JsonStorage::read('users');
        $logs = $pdo ? $pdo->query("SELECT * FROM `audit_logs`")->fetchAll() : JsonStorage::read('audit_logs');

        echo "-- =========================================================================\n";
        echo "-- Village Council Land Pass Management System - Database Dump\n";
        echo "-- Exported on: " . date('Y-m-d H:i:s') . "\n";
        echo "-- =========================================================================\n\n";

        // Read schema
        if (file_exists(__DIR__ . '/schema.sql')) {
            echo file_get_contents(__DIR__ . '/schema.sql');
            echo "\n\n";
        }

        echo "-- Dumping data for `villages`\n";
        foreach ($villages as $v) {
            $id = addslashes($v['id'] ?? '');
            $name = addslashes($v['villageName'] ?? $v['village_name'] ?? '');
            $hr = addslashes($v['huanRamPrefix'] ?? $v['huan_ram_prefix'] ?? 'MZ-VC-HR-');
            $ih = addslashes($v['inHmunPrefix'] ?? $v['in_hmun_prefix'] ?? 'MZ-VC-IH-');
            $spn = (int)($v['startingPassNumber'] ?? $v['starting_pass_number'] ?? 1001);
            $shr = (int)($v['startingHuanRamNumber'] ?? $v['starting_huan_ram_number'] ?? 1001);
            $sih = (int)($v['startingInHmunNumber'] ?? $v['starting_in_hmun_number'] ?? 1001);
            $terms = addslashes($v['conditionsAndTerms'] ?? $v['conditions_and_terms'] ?? '');
            $pres = addslashes($v['presidentName'] ?? $v['president_name'] ?? '');
            echo "INSERT INTO `villages` (`id`, `village_name`, `huan_ram_prefix`, `in_hmun_prefix`, `starting_pass_number`, `starting_huan_ram_number`, `starting_in_hmun_number`, `conditions_and_terms`, `president_name`) VALUES ('$id', '$name', '$hr', '$ih', $spn, $shr, $sih, '$terms', '$pres') ON DUPLICATE KEY UPDATE `village_name`=VALUES(`village_name`);\n";
        }

        echo "\n-- Dumping data for `land_passes`\n";
        foreach ($passes as $p) {
            $id = addslashes($p['id'] ?? '');
            $num = addslashes($p['passNumber'] ?? $p['pass_number'] ?? '');
            $type = addslashes($p['passType'] ?? $p['pass_type'] ?? 'huan_ram');
            $owner = addslashes($p['ownerName'] ?? $p['owner_name'] ?? '');
            $parent = addslashes($p['parentName'] ?? $p['parent_name'] ?? '');
            $phone = addslashes($p['contactNumber'] ?? $p['contact_number'] ?? '');
            $addr = addslashes($p['locationAddress'] ?? $p['location_address'] ?? '');
            $vid = addslashes($p['villageId'] ?? $p['village_id'] ?? '');
            $vname = addslashes($p['villageName'] ?? $p['village_name'] ?? '');
            $dim = addslashes($p['areaDimension'] ?? $p['area_dimension'] ?? '');
            $bn = addslashes($p['boundaryNorth'] ?? $p['boundary_north'] ?? '');
            $be = addslashes($p['boundaryEast'] ?? $p['boundary_east'] ?? '');
            $bw = addslashes($p['boundaryWest'] ?? $p['boundary_west'] ?? '');
            $bs = addslashes($p['boundarySouth'] ?? $p['boundary_south'] ?? '');
            $date = addslashes(substr($p['issueDate'] ?? $p['issue_date'] ?? date('Y-m-d'), 0, 10));
            $stat = addslashes($p['approvalStatus'] ?? $p['approval_status'] ?? 'live');
            echo "INSERT INTO `land_passes` (`id`, `pass_number`, `pass_type`, `owner_name`, `parent_name`, `contact_number`, `location_address`, `village_id`, `village_name`, `area_dimension`, `boundary_north`, `boundary_east`, `boundary_west`, `boundary_south`, `issue_date`, `approval_status`) VALUES ('$id', '$num', '$type', '$owner', '$parent', '$phone', '$addr', '$vid', '$vname', '$dim', '$bn', '$be', '$bw', '$bs', '$date', '$stat') ON DUPLICATE KEY UPDATE `owner_name`=VALUES(`owner_name`);\n";
        }
        exit;

    default:
        jsonResponse([
            'success' => false,
            'error' => 'Unknown action: ' . htmlspecialchars($action),
            'available_actions' => [
                'status', 'get_passes', 'save_pass', 'delete_pass',
                'get_villages', 'save_village',
                'get_users', 'save_user',
                'get_logs', 'log_activity',
                'transfer_all', 'export_sql'
            ]
        ], 404);
        break;
}
