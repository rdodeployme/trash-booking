<?php
/* ============================================================================
   POST /api/photos.php
   ----------------------------------------------------------------------------
   Attaches optional photos to a booking that already exists. Photos are an
   aid, never a requirement, and no price depends on one — so this endpoint is
   deliberately separate from booking.php. If it fails, the booking stands.

   Body: { "reference": "TR-260810-AB12C",
           "photos": [ { "name": "...", "dataUrl": "data:image/jpeg;base64,..." } ] }

   The browser resizes and re-encodes to JPEG before sending. Anything that is
   not a decodable image is rejected here regardless of what it claims to be.
   ========================================================================== */

declare(strict_types=1);

require __DIR__ . '/pricing.php';   // for trash_json_response()
$cfg = require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    trash_json_response(['error' => 'POST required'], 405);
}

/* Photos need a bigger ceiling than the booking endpoint's 64 KB. */
$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') {
    trash_json_response(['error' => 'No photos received.'], 400);
}
if (strlen($raw) > $cfg['maxPhotoPayloadBytes']) {
    trash_json_response(['error' => 'Those photos are too large.'], 413);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    trash_json_response(['error' => 'Photos could not be read.'], 400);
}

/* ---- The reference must be one we issued, and the booking must exist ------ */

$reference = (string)($data['reference'] ?? '');
if (!preg_match('/^TR-[0-9]{6}-[A-Z0-9]{5}$/', $reference)) {
    trash_json_response(['error' => 'Unknown booking reference.'], 422);
}

$bookingFile = rtrim($cfg['bookingStorePath'], '/') . '/' . $reference . '.json';
if (!is_file($bookingFile)) {
    trash_json_response(['error' => 'Unknown booking reference.'], 404);
}

$incoming = is_array($data['photos'] ?? null) ? $data['photos'] : [];
if (!$incoming) {
    trash_json_response(['error' => 'No photos received.'], 400);
}
$incoming = array_slice($incoming, 0, $cfg['maxPhotos']);

/* ---- Decode, verify, write ---------------------------------------------- */

$dir = rtrim($cfg['photoStorePath'], '/');
if (!is_dir($dir)) { @mkdir($dir, 0750, true); }

$saved = [];
$index = 0;

foreach ($incoming as $photo) {
    $index++;
    $dataUrl = (string)($photo['dataUrl'] ?? '');

    if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $dataUrl, $m)) {
        continue;   // not something we produced — skip it silently
    }

    $binary = base64_decode(substr($dataUrl, strlen($m[0])), true);
    if ($binary === false || $binary === '') { continue; }
    if (strlen($binary) > $cfg['maxPhotoBytes']) { continue; }

    /* Trust the bytes, not the label: this must actually decode as an image. */
    $info = @getimagesizefromstring($binary);
    if ($info === false || empty($info[0]) || empty($info[1])) { continue; }
    if (!in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) { continue; }

    $ext = $info[2] === IMAGETYPE_PNG ? 'png' : ($info[2] === IMAGETYPE_WEBP ? 'webp' : 'jpg');
    $filename = $reference . '-' . $index . '.' . $ext;

    if (@file_put_contents($dir . '/' . $filename, $binary, LOCK_EX) === false) {
        error_log('trash: could not write photo ' . $filename . ' to ' . $dir);
        continue;
    }
    @chmod($dir . '/' . $filename, 0640);
    $saved[] = ['file' => $filename, 'width' => $info[0], 'height' => $info[1], 'bytes' => strlen($binary)];
}

if (!$saved) {
    trash_json_response(['error' => 'None of those photos could be saved.'], 422);
}

/* ---- Record them against the booking ------------------------------------ */

$record = json_decode((string)file_get_contents($bookingFile), true);
if (is_array($record)) {
    $record['photos'] = array_merge($record['photos'] ?? [], $saved);
    $record['photoCount'] = count($record['photos']);
    @file_put_contents(
        $bookingFile,
        json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
}

trash_json_response(['reference' => $reference, 'saved' => count($saved)]);
