/**
 * PHP Storage Backend Connector & Synchronization Service
 * 
 * Allows the React application to use a PHP + MySQL or PHP + JSON backend
 * on cPanel, XAMPP, Apache, Nginx, or any standard PHP shared hosting server.
 */

import { LandPass, VillageConfig, UserProfile, AuditLog } from '../types';

export interface PhpStorageConfig {
  enabled: boolean;
  apiUrl: string;
  autoSync: boolean;
  lastConnected?: string;
}

const STORAGE_KEY = 'mizoram_vc_php_storage_config';
export const DEFAULT_PHP_URL = '/php-backend/api.php';

export function getPhpStorageConfig(): PhpStorageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? false,
        apiUrl: parsed.apiUrl || DEFAULT_PHP_URL,
        autoSync: parsed.autoSync ?? false,
        lastConnected: parsed.lastConnected,
      };
    }
  } catch {}

  return {
    enabled: false,
    apiUrl: DEFAULT_PHP_URL,
    autoSync: false,
  };
}

export function savePhpStorageConfig(config: Partial<PhpStorageConfig>): PhpStorageConfig {
  const current = getPhpStorageConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export interface PhpConnectionResult {
  success: boolean;
  message: string;
  phpVersion?: string;
  storageEngine?: string;
  databaseConnected?: boolean;
  counts?: {
    passes: number;
    villages: number;
    users: number;
    logs: number;
  };
  serverTime?: string;
}

/**
 * Ping and verify connection to the PHP API
 */
export async function testPhpConnection(customUrl?: string): Promise<PhpConnectionResult> {
  const config = getPhpStorageConfig();
  const targetUrl = customUrl?.trim() || config.apiUrl || DEFAULT_PHP_URL;

  try {
    const endpoint = targetUrl.includes('?') 
      ? `${targetUrl}&action=status` 
      : `${targetUrl}?action=status`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`PHP Server responded with HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      savePhpStorageConfig({ lastConnected: new Date().toISOString() });
      return {
        success: true,
        message: data.message || 'Connected to PHP Storage successfully!',
        phpVersion: data.php_version,
        storageEngine: data.storage_engine,
        databaseConnected: data.database_connected,
        counts: data.counts,
        serverTime: data.server_time,
      };
    } else {
      return {
        success: false,
        message: data.error || 'PHP server returned an error.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.name === 'AbortError' 
        ? 'Connection timed out (PHP server did not respond within 6s).' 
        : `Cannot reach PHP endpoint at ${targetUrl}: ${err.message || 'Network error'}`,
    };
  }
}

/**
 * Save single Land Pass to PHP Backend
 */
export async function savePassToPHP(pass: LandPass): Promise<boolean> {
  const config = getPhpStorageConfig();
  if (!config.enabled && !config.autoSync) return false;

  try {
    const endpoint = config.apiUrl.includes('?') 
      ? `${config.apiUrl}&action=save_pass` 
      : `${config.apiUrl}?action=save_pass`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (e) {
    console.warn('Failed to sync pass to PHP:', e);
    return false;
  }
}

/**
 * Delete Land Pass from PHP Backend
 */
export async function deletePassFromPHP(id: string): Promise<boolean> {
  const config = getPhpStorageConfig();
  if (!config.enabled && !config.autoSync) return false;

  try {
    const endpoint = config.apiUrl.includes('?') 
      ? `${config.apiUrl}&action=delete_pass` 
      : `${config.apiUrl}?action=delete_pass`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (e) {
    console.warn('Failed to delete pass from PHP:', e);
    return false;
  }
}

/**
 * Save Village Council Profile to PHP Backend
 */
export async function saveVillageToPHP(village: VillageConfig): Promise<boolean> {
  const config = getPhpStorageConfig();
  if (!config.enabled && !config.autoSync) return false;

  try {
    const endpoint = config.apiUrl.includes('?') 
      ? `${config.apiUrl}&action=save_village` 
      : `${config.apiUrl}?action=save_village`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ village }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (e) {
    console.warn('Failed to sync village to PHP:', e);
    return false;
  }
}

/**
 * Save User account to PHP Backend
 */
export async function saveUserToPHP(user: UserProfile): Promise<boolean> {
  const config = getPhpStorageConfig();
  if (!config.enabled && !config.autoSync) return false;

  try {
    const endpoint = config.apiUrl.includes('?') 
      ? `${config.apiUrl}&action=save_user` 
      : `${config.apiUrl}?action=save_user`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (e) {
    console.warn('Failed to sync user to PHP:', e);
    return false;
  }
}

/**
 * Save Audit Log to PHP Backend
 */
export async function saveAuditLogToPHP(log: AuditLog): Promise<boolean> {
  const config = getPhpStorageConfig();
  if (!config.enabled && !config.autoSync) return false;

  try {
    const endpoint = config.apiUrl.includes('?') 
      ? `${config.apiUrl}&action=log_activity` 
      : `${config.apiUrl}?action=log_activity`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (e) {
    console.warn('Failed to sync audit log to PHP:', e);
    return false;
  }
}

export interface PhpTransferResult {
  success: boolean;
  message: string;
  storageEngine?: string;
  counts?: {
    passes: number;
    villages: number;
    users: number;
    logs: number;
  };
}

/**
 * Bulk Transfer all Data into PHP Backend
 */
export async function transferAllDataToPHP(
  passes: LandPass[],
  villages: VillageConfig[],
  users: UserProfile[],
  logs: AuditLog[] = []
): Promise<PhpTransferResult> {
  const config = getPhpStorageConfig();
  const endpoint = config.apiUrl.includes('?') 
    ? `${config.apiUrl}&action=transfer_all` 
    : `${config.apiUrl}?action=transfer_all`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passes,
        villages,
        users,
        logs,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      savePhpStorageConfig({ lastConnected: new Date().toISOString() });
      return {
        success: true,
        message: data.message || `Successfully transferred records into PHP Storage Backend!`,
        storageEngine: data.storage_engine,
        counts: data.transferred,
      };
    } else {
      return {
        success: false,
        message: data.error || 'PHP server rejected transfer data.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to transfer data to PHP backend: ${err.message}`,
    };
  }
}

/**
 * Generates ready-to-run MySQL INSERT statements that the user can run in phpMyAdmin
 */
export function generateMySqlDump(
  passes: LandPass[],
  villages: VillageConfig[],
  users: UserProfile[],
  logs: AuditLog[] = []
): string {
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${str}'`;
  };

  const lines: string[] = [];
  lines.push('-- =========================================================================');
  lines.push('-- Mizoram Village Council Land Pass Management System');
  lines.push('-- Exported MySQL Database Dump for PHP / MySQL Backend');
  lines.push(`-- Generated At: ${new Date().toISOString()}`);
  lines.push('-- =========================================================================\n');
  lines.push('SET NAMES utf8mb4;');
  lines.push('SET FOREIGN_KEY_CHECKS = 0;\n');

  // Villages
  lines.push('-- -------------------------------------------------------------------------');
  lines.push('-- Table: villages');
  lines.push('-- -------------------------------------------------------------------------');
  for (const v of villages) {
    const id = sanitize(v.id);
    const name = sanitize(v.villageName);
    const block = sanitize(v.blockName || '');
    const dist = sanitize(v.districtName || 'Mizoram');
    const state = sanitize(v.stateName || 'Mizoram');
    const pin = sanitize(v.pinCode || '');
    const hr = sanitize(v.huanRamPrefix || 'MZ-VC-HR-');
    const ih = sanitize(v.inHmunPrefix || 'MZ-VC-IH-');
    const spn = Number(v.startingPassNumber) || 1001;
    const shr = Number(v.startingHuanRamNumber) || 1001;
    const sih = Number(v.startingInHmunNumber) || 1001;
    const logo = sanitize(v.logoUrl || null);
    const emblem = sanitize(v.emblemLogoUrl || null);
    const terms = sanitize(v.conditionsAndTerms || null);
    const pres = sanitize(v.presidentName || '');

    lines.push(
      `INSERT INTO \`villages\` (\`id\`, \`village_name\`, \`block_name\`, \`district_name\`, \`state_name\`, \`pin_code\`, \`huan_ram_prefix\`, \`in_hmun_prefix\`, \`starting_pass_number\`, \`starting_huan_ram_number\`, \`starting_in_hmun_number\`, \`logo_url\`, \`emblem_logo_url\`, \`conditions_and_terms\`, \`president_name\`) ` +
      `VALUES (${id}, ${name}, ${block}, ${dist}, ${state}, ${pin}, ${hr}, ${ih}, ${spn}, ${shr}, ${sih}, ${logo}, ${emblem}, ${terms}, ${pres}) ` +
      `ON DUPLICATE KEY UPDATE \`village_name\`=VALUES(\`village_name\`), \`huan_ram_prefix\`=VALUES(\`huan_ram_prefix\`), \`in_hmun_prefix\`=VALUES(\`in_hmun_prefix\`), \`starting_pass_number\`=VALUES(\`starting_pass_number\`), \`starting_huan_ram_number\`=VALUES(\`starting_huan_ram_number\`), \`starting_in_hmun_number\`=VALUES(\`starting_in_hmun_number\`);`
    );
  }

  // Users
  lines.push('\n-- -------------------------------------------------------------------------');
  lines.push('-- Table: users');
  lines.push('-- -------------------------------------------------------------------------');
  for (const u of users) {
    const uid = sanitize(u.uid);
    const username = sanitize(u.username || u.displayName);
    const displayName = sanitize(u.displayName || u.username);
    const phone = sanitize(u.phoneNumber || '');
    const vid = sanitize(u.villageId || null);
    const vname = sanitize(u.villageName || '');
    const utype = sanitize(u.userType || 'secretary');
    const status = sanitize(u.status || 'approved');
    const shot = sanitize(u.paymentScreenshotUrl || null);

    lines.push(
      `INSERT INTO \`users\` (\`uid\`, \`username\`, \`display_name\`, \`phone_number\`, \`village_id\`, \`village_name\`, \`user_type\`, \`status\`, \`payment_screenshot_url\`) ` +
      `VALUES (${uid}, ${username}, ${displayName}, ${phone}, ${vid}, ${vname}, ${utype}, ${status}, ${shot}) ` +
      `ON DUPLICATE KEY UPDATE \`display_name\`=VALUES(\`display_name\`), \`status\`=VALUES(\`status\`);`
    );
  }

  // Land Passes
  lines.push('\n-- -------------------------------------------------------------------------');
  lines.push('-- Table: land_passes');
  lines.push('-- -------------------------------------------------------------------------');
  for (const p of passes) {
    const id = sanitize(p.id);
    const num = sanitize(p.passNumber);
    const type = sanitize(p.passType || 'huan_ram');
    const owner = sanitize(p.ownerName);
    const parent = sanitize(p.parentName || '');
    const phone = sanitize(p.contactNumber || '');
    const addr = sanitize(p.locationAddress || '');
    const vid = sanitize(p.villageId || 'village_default');
    const vname = sanitize(p.villageName || '');
    const dim = sanitize(p.areaSize || '');
    const bn = sanitize(p.boundaryNorth || '');
    const be = sanitize(p.boundaryEast || '');
    const bw = sanitize(p.boundaryWest || '');
    const bs = sanitize(p.boundarySouth || '');
    const date = sanitize(p.issueDate ? p.issueDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
    const valid = 'NULL';
    const creator = sanitize(p.createdBy || 'secretary');
    const status = sanitize(p.approvalStatus || 'live');

    lines.push(
      `INSERT INTO \`land_passes\` (\`id\`, \`pass_number\`, \`pass_type\`, \`owner_name\`, \`parent_name\`, \`contact_number\`, \`location_address\`, \`village_id\`, \`village_name\`, \`area_dimension\`, \`boundary_north\`, \`boundary_east\`, \`boundary_west\`, \`boundary_south\`, \`issue_date\`, \`valid_upto\`, \`created_by\`, \`approval_status\`) ` +
      `VALUES (${id}, ${num}, ${type}, ${owner}, ${parent}, ${phone}, ${addr}, ${vid}, ${vname}, ${dim}, ${bn}, ${be}, ${bw}, ${bs}, ${date}, ${valid}, ${creator}, ${status}) ` +
      `ON DUPLICATE KEY UPDATE \`pass_number\`=VALUES(\`pass_number\`), \`owner_name\`=VALUES(\`owner_name\`), \`approval_status\`=VALUES(\`approval_status\`);`
    );
  }

  lines.push('\nSET FOREIGN_KEY_CHECKS = 1;');
  return lines.join('\n');
}

/**
 * Trigger browser download of generated MySQL dump
 */
export function downloadMySqlDumpFile(
  passes: LandPass[],
  villages: VillageConfig[],
  users: UserProfile[],
  logs: AuditLog[] = []
): void {
  const sql = generateMySqlDump(passes, villages, users, logs);
  const blob = new Blob([sql], { type: 'application/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `village_council_landpass_db_${new Date().toISOString().substring(0, 10)}.sql`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
