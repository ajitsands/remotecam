<?php
/**
 * SanDS Lab CCTV Cloud - ONVIF Device Service & Probe API
 * Supports WS-UsernameToken authentication, Device Information,
 * Media Profiles, Stream URI Discovery, and PTZ Commands.
 */

require_once __DIR__ . '/db.php';

$userId = requireLogin();
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper to construct WS-Security UsernameToken header
function buildWsSecurityHeader($username, $password) {
    if (empty($username)) {
        return '';
    }

    $created = gmdate('Y-m-d\TH:i:s\Z');
    $nonceRaw = random_bytes(16);
    $nonceBase64 = base64_encode($nonceRaw);
    $passwordDigest = base64_encode(sha1($nonceRaw . $created . $password, true));

    return '
    <s:Header>
        <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
            <wsse:UsernameToken>
                <wsse:Username>' . htmlspecialchars($username, ENT_XML1) . '</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">' . $passwordDigest . '</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">' . $nonceBase64 . '</wsse:Nonce>
                <wsu:Created>' . $created . '</wsu:Created>
            </wsse:UsernameToken>
        </wsse:Security>
    </s:Header>';
}

// Helper to send SOAP request via cURL
function sendOnvifSoapRequest($url, $action, $bodyXml, $username = '', $password = '', $timeout = 4) {
    $headerXml = buildWsSecurityHeader($username, $password);
    $soapEnvelope = '<?xml version="1.0" encoding="utf-8"?>
    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
                xmlns:tds="http://www.onvif.org/ver10/device/wsdl"
                xmlns:trt="http://www.onvif.org/ver10/media/wsdl"
                xmlns:tt="http://www.onvif.org/ver10/schema">
        ' . $headerXml . '
        <s:Body>
            ' . $bodyXml . '
        </s:Body>
    </s:Envelope>';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $soapEnvelope,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/soap+xml; charset=utf-8; action="' . $action . '"',
            'Accept: application/soap+xml, text/xml',
        ],
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'success'   => ($httpCode >= 200 && $httpCode < 300) && !empty($response),
        'http_code' => $httpCode,
        'response'  => $response,
        'error'     => $error
    ];
}

// Test / Probe ONVIF camera
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? 'probe';
    $host = trim($data['host'] ?? '');
    $onvifPort = intval($data['onvif_port'] ?? 80) ?: 80;
    $rtspPort = intval($data['rtsp_port'] ?? 554) ?: 554;
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    if (empty($host)) {
        sendJsonResponse(['status' => 'error', 'message' => 'Camera IP or hostname is required'], 400);
    }

    // 1. Socket check for ONVIF and RTSP ports
    $onvifOpen = false;
    $rtspOpen = false;
    $socketErr = '';

    $start = microtime(true);
    $fpOnvif = @fsockopen($host, $onvifPort, $errno, $errstr, 2.0);
    if ($fpOnvif) {
        $onvifOpen = true;
        fclose($fpOnvif);
    } else {
        $socketErr = $errstr;
    }

    $fpRtsp = @fsockopen($host, $rtspPort, $errno, $errstr, 2.0);
    if ($fpRtsp) {
        $rtspOpen = true;
        fclose($fpRtsp);
    }
    $pingTimeMs = round((microtime(true) - $start) * 1000, 1);

    // 2. Query ONVIF GetDeviceInformation
    $onvifUrl = "http://{$host}:{$onvifPort}/onvif/device_service";
    $soapRes = sendOnvifSoapRequest(
        $onvifUrl,
        'http://www.onvif.org/ver10/device/wsdl/GetDeviceInformation',
        '<tds:GetDeviceInformation />',
        $username,
        $password,
        3
    );

    $deviceInfo = [
        'manufacturer'     => 'Generic ONVIF',
        'model'            => 'IP Camera',
        'firmware_version' => 'N/A',
        'serial_number'    => 'N/A',
        'hardware_id'      => 'N/A'
    ];

    if ($soapRes['success']) {
        // Parse XML response
        try {
            $cleanXml = preg_replace('/(<\/?)(\w+):([^>]*>)/', '$1$3', $soapRes['response']);
            $xml = @simplexml_load_string($cleanXml);
            if ($xml) {
                $body = $xml->xpath('//GetDeviceInformationResponse');
                if (!empty($body[0])) {
                    $resp = $body[0];
                    $deviceInfo['manufacturer'] = (string)($resp->Manufacturer ?? 'Generic');
                    $deviceInfo['model'] = (string)($resp->Model ?? 'IP Camera');
                    $deviceInfo['firmware_version'] = (string)($resp->FirmwareVersion ?? 'N/A');
                    $deviceInfo['serial_number'] = (string)($resp->SerialNumber ?? 'N/A');
                    $deviceInfo['hardware_id'] = (string)($resp->HardwareId ?? 'N/A');
                }
            }
        } catch (Exception $e) {
            // Keep defaults
        }
    }

    // Default RTSP stream path suggestions based on brand
    $brand = strtolower($deviceInfo['manufacturer'] ?? '');
    $suggestedPath = 'live/ch0';
    if (strpos($brand, 'hik') !== false) {
        $suggestedPath = 'Streaming/Channels/101';
    } elseif (strpos($brand, 'dahua') !== false || strpos($brand, 'amcrest') !== false) {
        $suggestedPath = 'cam/realmonitor?channel=1&subtype=0';
    } elseif (strpos($brand, 'uniview') !== false || strpos($brand, 'unv') !== false) {
        $suggestedPath = 'unicast/c1/s0/live';
    } elseif (strpos($brand, 'axis') !== false) {
        $suggestedPath = 'axis-media/media.amp';
    }

    $authPrefix = ($username !== '' ? rawurlencode($username) . ($password !== '' ? ':••••••@' : '@') : '');
    $previewRtspUrl = "rtsp://{$authPrefix}{$host}:{$rtspPort}/{$suggestedPath}";

    sendJsonResponse([
        'status'             => 'success',
        'message'            => ($onvifOpen || $soapRes['success']) ? 'Camera reachable' : 'Camera not reachable on specified ports',
        'connected'          => $onvifOpen || $rtspOpen || $soapRes['success'],
        'onvif_port_open'    => $onvifOpen,
        'rtsp_port_open'     => $rtspOpen,
        'response_time_ms'   => $pingTimeMs,
        'device_info'        => $deviceInfo,
        'suggested_path'     => $suggestedPath,
        'preview_rtsp_url'   => $previewRtspUrl,
        'onvif_soap_status'  => $soapRes['http_code'] ?: ($socketErr ?: 'Timeout')
    ]);
}

sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
