<?php
session_start();

// --- SECURITY & CONFIGURATION ---
define('ACCESS_PASSWORD', 'PureHerbex2026!'); // Change this to your preferred login password
$db_file = 'whatsapp_db.php';

// Meta Credentials (needed to send replies)
$access_token = "EAAa0oH3M7CYBRmNij6bQHxQZBp0OgdYbqedMF9XRQFDEElnilxUi3ygW9qsygpf7YN1Ok3ZAi9T2ZCuV8XuWNq8GxbAMgsNwGEIVQzCytgCEGYWdFbfhZCcHbxZANwIe222pjnVSgedDPxe9NwPZCgb6CfO4hn2Em5Tr5AWWdMEWZBvFRv3QmGhla1QDb98PQZDZD";
$phone_number_id = "1242577412261554"; // Replace with your production Phone Number ID if different

// --- HELPER FUNCTIONS ---
function read_db($file) {
    if (!file_exists($file)) {
        return ['contacts' => []];
    }
    $content = file_get_contents($file);
    $json_content = substr($content, 40); // Strip PHP security header
    $data = json_decode($json_content, true);
    return $data ? $data : ['contacts' => []];
}

function write_db($file, $data) {
    $header = "<?php http_response_code(403); exit; ?>\n";
    $content = $header . json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents($file, $content);
}

// Handle Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: inbox.php");
    exit;
}

// Handle Login Form Submit
if (isset($_POST['login_password'])) {
    if ($_POST['login_password'] === ACCESS_PASSWORD) {
        $_SESSION['authenticated'] = true;
        header("Location: inbox.php");
        exit;
    } else {
        $error = "Incorrect password. Please try again.";
    }
}

// Check Authentication
if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pure Herbex WhatsApp - Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Outfit', sans-serif; }
        </style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
            
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-4 border border-emerald-500/20">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h1 class="text-2xl font-bold tracking-tight">Pure Herbex Inbox</h1>
                <p class="text-slate-400 text-sm mt-1">Enter your password to access your WhatsApp messages</p>
            </div>

            <?php if (isset($error)): ?>
                <div class="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                    <?php echo $error; ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="inbox.php">
                <div class="space-y-4">
                    <div>
                        <input type="password" name="login_password" placeholder="••••••••" required 
                               class="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-center text-lg tracking-widest">
                    </div>
                    <button type="submit" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-center">
                        Unlock Conversations
                    </button>
                </div>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Load Database
$db = read_db($db_file);

// Handle Send Reply Action via AJAX / POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'send_reply') {
    $to_phone = $_POST['to_phone'];
    $reply_text = trim($_POST['reply_text']);

    if ($to_phone && $reply_text) {
        $url = "https://graph.facebook.com/v20.0/{$phone_number_id}/messages";
        $headers = [
            "Authorization: Bearer {$access_token}",
            "Content-Type: application/json"
        ];
        $payload = [
            "messaging_product" => "whatsapp",
            "recipient_type" => "individual",
            "to" => $to_phone,
            "type" => "text",
            "text" => [
                "preview_url" => false,
                "body" => $reply_text
            ]
        ];

        // Send API call to Meta
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $resp_data = json_decode($response, true);

        if ($http_code === 200) {
            $msg_id = $resp_data['messages'][0]['id'] ?? 'N/A';
            
            // Save reply to database
            $db['contacts'][$to_phone]['messages'][] = [
                'id' => $msg_id,
                'sender' => 'me',
                'text' => $reply_text,
                'timestamp' => time(),
                'status' => 'sent'
            ];
            write_db($db_file, $db);

            echo json_encode(['status' => 'success', 'msg_id' => $msg_id]);
        } else {
            $error_info = $resp_data['error']['message'] ?? 'API request failed';
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => $error_info]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing fields']);
    }
    exit;
}

// Fetch Active Chat phone number from query parameters
$active_phone = $_GET['chat'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pure Herbex - WhatsApp Inbox</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">

    <!-- Top Navigation Header -->
    <header class="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 font-bold">
                PH
            </div>
            <div>
                <h1 class="font-bold text-lg leading-none">Pure Herbex</h1>
                <span class="text-xs text-emerald-400 flex items-center mt-1">
                    <span class="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                    WhatsApp API Live
                </span>
            </div>
        </div>
        
        <div class="flex items-center space-x-4">
            <a href="inbox.php" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all">Refresh Chat</a>
            <a href="inbox.php?logout=1" class="text-xs text-rose-400 hover:text-rose-300">Sign Out</a>
        </div>
    </header>

    <!-- Main Workspace Container -->
    <div class="flex flex-1 overflow-hidden">
        
        <!-- Left Contacts Sidebar -->
        <aside class="w-80 border-r border-slate-800/80 bg-slate-900/20 flex flex-col overflow-y-auto">
            <div class="p-4 shrink-0">
                <input type="text" id="search-bar" placeholder="Search conversations..." 
                       class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500">
            </div>
            
            <div class="flex-1 space-y-1 px-2 pb-4" id="contacts-list">
                <?php 
                if (empty($db['contacts'])) {
                    echo '<p class="text-center text-slate-600 text-sm mt-8">No messages received yet.</p>';
                } else {
                    // Sort contacts by latest message timestamp
                    uasort($db['contacts'], function($a, $b) {
                        $tA = end($a['messages'])['timestamp'] ?? 0;
                        $tB = end($b['messages'])['timestamp'] ?? 0;
                        return $tB <=> $tA;
                    });

                    foreach ($db['contacts'] as $phone => $contact) {
                        $latest_msg = end($contact['messages']);
                        $latest_text = $latest_msg['text'] ?? '';
                        $latest_time = isset($latest_msg['timestamp']) ? date('h:i A', $latest_msg['timestamp']) : '';
                        $is_active = ($active_phone === $phone);
                        ?>
                        <a href="inbox.php?chat=<?php echo $phone; ?>" 
                           class="flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all <?php echo $is_active ? 'bg-emerald-500/10 border border-emerald-500/20 text-slate-100' : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200' ?>">
                            <div class="w-10 h-10 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center font-bold">
                                <?php echo strtoupper(substr($contact['name'], 0, 1)); ?>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-baseline">
                                    <h3 class="font-semibold text-sm truncate text-slate-200"><?php echo htmlspecialchars($contact['name']); ?></h3>
                                    <span class="text-[10px] text-slate-500 shrink-0 ml-1"><?php echo $latest_time; ?></span>
                                </div>
                                <p class="text-xs truncate mt-0.5"><?php echo htmlspecialchars($latest_text); ?></p>
                            </div>
                        </a>
                        <?php
                    }
                }
                ?>
            </div>
        </aside>

        <!-- Right Chat Panel -->
        <main class="flex-1 flex flex-col bg-slate-950">
            <?php if ($active_phone && isset($db['contacts'][$active_phone])): 
                $contact = $db['contacts'][$active_phone];
                ?>
                
                <!-- Chat Header -->
                <div class="bg-slate-900/25 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shrink-0">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                            <?php echo strtoupper(substr($contact['name'], 0, 1)); ?>
                        </div>
                        <div>
                            <h2 class="font-bold text-sm leading-none"><?php echo htmlspecialchars($contact['name']); ?></h2>
                            <span class="text-[10px] text-slate-500 mt-1 block">+<?php echo $phone; ?></span>
                        </div>
                    </div>
                </div>

                <!-- Chat History Messages area -->
                <div class="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col" id="chat-messages">
                    <?php foreach ($contact['messages'] as $msg): 
                        $is_me = ($msg['sender'] === 'me');
                        $msg_time = date('h:i A', $msg['timestamp']);
                        ?>
                        <div class="flex <?php echo $is_me ? 'justify-end' : 'justify-start'; ?>">
                            <div class="max-w-[70%] rounded-2xl px-4 py-3 text-sm relative <?php echo $is_me ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'; ?>">
                                <p class="leading-relaxed whitespace-pre-wrap"><?php echo htmlspecialchars($msg['text']); ?></p>
                                <div class="flex items-center justify-end space-x-1 mt-1 text-[9px] <?php echo $is_me ? 'text-slate-800' : 'text-slate-500'; ?>">
                                    <span><?php echo $msg_time; ?></span>
                                    <?php if ($is_me): ?>
                                        <span class="capitalize">(<?php echo htmlspecialchars($msg['status'] ?? 'sent'); ?>)</span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <!-- Chat Input bar -->
                <div class="p-4 border-t border-slate-800/80 bg-slate-900/10 shrink-0">
                    <form id="reply-form" class="flex items-center space-x-2">
                        <input type="hidden" id="to-phone" value="<?php echo htmlspecialchars($active_phone); ?>">
                        <input type="text" id="reply-text" placeholder="Type a message..." required autocomplete="off"
                               class="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none">
                        <button type="submit" id="send-btn" class="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-semibold rounded-xl text-sm transition-all flex items-center justify-center">
                            Send
                        </button>
                    </form>
                </div>

            <?php else: ?>
                <!-- No Chat Selected Placeholder -->
                <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div class="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </div>
                    <h2 class="text-xl font-bold">No Conversation Selected</h2>
                    <p class="text-slate-500 text-sm mt-1 max-w-sm">Select a contact from the sidebar to view chat history and send replies.</p>
                </div>
            <?php endif; ?>
        </main>

    </div>

    <!-- Script Handling Live Chat Actions -->
    <script>
        // Scroll chat to the bottom
        const messageContainer = document.getElementById('chat-messages');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }

        // Live search filtering
        document.getElementById('search-bar').addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const contacts = document.querySelectorAll('#contacts-list a');
            contacts.forEach(contact => {
                const name = contact.querySelector('h3').textContent.toLowerCase();
                if (name.includes(query)) {
                    contact.style.display = 'flex';
                } else {
                    contact.style.display = 'none';
                }
            });
        });

        // AJAX Reply Submission
        const replyForm = document.getElementById('reply-form');
        if (replyForm) {
            replyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const toPhone = document.getElementById('to-phone').value;
                const replyText = document.getElementById('reply-text').value;
                const sendBtn = document.getElementById('send-btn');
                
                sendBtn.disabled = true;
                sendBtn.textContent = 'Sending...';

                const formData = new FormData();
                formData.append('action', 'send_reply');
                formData.append('to_phone', toPhone);
                formData.append('reply_text', replyText);

                fetch('inbox.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Reload the page to display the message instantly
                        window.location.reload();
                    } else {
                        alert('Error: ' + data.message);
                        sendBtn.disabled = false;
                        sendBtn.textContent = 'Send';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Network error. Failed to send message.');
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send';
                });
            });
        }
    </script>
</body>
</html>
