<?php
// PHP Webhook handler for WhatsApp Business Cloud API.
// Placed in the public/ folder of Next.js to bypass static export constraints on Hostinger.

$verify_token = 'pure_herbex_secret_token';

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
    // Read raw JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if ($data) {
        // Log the payload to a file for review
        file_put_contents('whatsapp_webhook_log.json', $input . PHP_EOL, FILE_APPEND);

        // Process message updates or status changes here
        if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
            $entry = $data['entry'][0] ?? null;
            $change = $entry['changes'][0] ?? null;
            $value = $change['value'] ?? null;

            // Handle incoming message replies
            if (isset($value['messages'])) {
                $message = $value['messages'][0];
                $from = $message['from'] ?? '';
                $text = $message['text']['body'] ?? '';
                
                // Write a log of replies
                $log_line = sprintf("[%s] Reply from %s: %s\n", date('Y-m-d H:i:s'), $from, $text);
                file_put_contents('whatsapp_replies.log', $log_line, FILE_APPEND);
            }

            // Handle message status updates (sent, delivered, read)
            if (isset($value['statuses'])) {
                $status = $value['statuses'][0];
                $recipient_id = $status['recipient_id'] ?? '';
                $msg_status = $status['status'] ?? '';

                $log_line = sprintf("[%s] Msg to %s: %s\n", date('Y-m-d H:i:s'), $recipient_id, $msg_status);
                file_put_contents('whatsapp_status.log', $log_line, FILE_APPEND);
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
