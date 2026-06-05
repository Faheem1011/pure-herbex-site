<?php
// PHP Webhook handler for WhatsApp Business Cloud API.
// Placed in the public/ folder of Next.js to bypass static export constraints on Hostinger.

$verify_token = 'pure_herbex_secret_token';
$db_file = 'whatsapp_db.php';

// Helper function to read the secure PHP-based JSON database
function read_db($file) {
    if (!file_exists($file)) {
        return ['contacts' => []];
    }
    $content = file_get_contents($file);
    // Strip the PHP security header: "<?php http_response_code(403); exit; ?>\n" (39 chars + newline)
    $json_content = substr($content, 40);
    $data = json_decode($json_content, true);
    return $data ? $data : ['contacts' => []];
}

// Helper function to write to the secure PHP-based JSON database
function write_db($file, $data) {
    $header = "<?php http_response_code(403); exit; ?>\n";
    $content = $header . json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents($file, $content);
}

// 1. GET Request: Webhook Verification
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['hub_mode']) && isset($_GET['hub_verify_token'])) {
        $mode = $_GET['hub_mode'];
        $token = $_GET['hub_verify_token'];
        $challenge = isset($_GET['hub_challenge']) ? $_GET['hub_challenge'] : '';

        if ($mode === 'subscribe' && $token === $verify_token) {
            header('Content-Type: text/plain');
            http_response_code(200);
            echo $challenge;
            exit;
        } else {
            http_response_code(403);
            echo 'Forbidden';
            exit;
        }
    }
}

// 2. POST Request: Receive WhatsApp Events
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data) {
        // Log raw webhook data for security/debugging
        file_put_contents('whatsapp_raw_log.log', date('Y-m-d H:i:s') . ' - ' . $input . PHP_EOL, FILE_APPEND);

        if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
            $entry = $data['entry'][0] ?? null;
            $change = $entry['changes'][0] ?? null;
            $value = $change['value'] ?? null;

            $db = read_db($db_file);

            // Handle incoming message replies from customers
            if (isset($value['messages'])) {
                $message = $value['messages'][0];
                $from = $message['from'] ?? ''; // Sender's phone number
                $text = $message['text']['body'] ?? '(Media / Non-text message)';
                $timestamp = $message['timestamp'] ?? time();
                $msg_id = $message['id'] ?? '';

                // If contact doesn't exist, initialize them
                if (!isset($db['contacts'][$from])) {
                    // Try to resolve contact name from metadata
                    $profile_name = $value['contacts'][0]['profile']['name'] ?? 'WhatsApp Contact';
                    $db['contacts'][$from] = [
                        'name' => $profile_name,
                        'phone' => $from,
                        'messages' => []
                    ];
                }

                // Append the incoming message
                $db['contacts'][$from]['messages'][] = [
                    'id' => $msg_id,
                    'sender' => 'them',
                    'text' => $text,
                    'timestamp' => intval($timestamp),
                    'status' => 'received'
                ];

                write_db($db_file, $db);
            }

            // Handle status updates for sent messages (sent, delivered, read)
            if (isset($value['statuses'])) {
                $status = $value['statuses'][0];
                $recipient_id = $status['recipient_id'] ?? '';
                $msg_id = $status['id'] ?? '';
                $msg_status = $status['status'] ?? ''; // "sent", "delivered", "read"

                if (isset($db['contacts'][$recipient_id])) {
                    foreach ($db['contacts'][$recipient_id]['messages'] as &$msg) {
                        if ($msg['id'] === $msg_id) {
                            $msg['status'] = $msg_status;
                            break;
                        }
                    }
                    write_db($db_file, $db);
                }
            }
        }

        http_response_code(200);
        echo json_encode(['status' => 'success']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

http_response_code(400);
echo 'Bad Request';
exit;
