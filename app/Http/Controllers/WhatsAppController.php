
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pusher\Pusher;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    private $pusher;

    public function __construct()
    {
        // Initialize Pusher with your credentials
        $this->pusher = new Pusher(
            '490510485d3b7c3874d4', // key
            'c8de19bc5b9972bf6a16', // secret (you'll need to add this to your .env)
            '1912308', // app_id
            [
                'cluster' => 'ap4',
                'useTLS' => true
            ]
        );
    }

    /**
     * Handle webhook verification (GET request from Facebook)
     */
    public function verify(Request $request)
    {
        $verifyToken = env('WHATSAPP_VERIFY_TOKEN', 'your_verify_token');
        $mode = $request->query('hub.mode');
        $token = $request->query('hub.verify_token');
        $challenge = $request->query('hub.challenge');

        Log::info('Webhook verification attempt', [
            'mode' => $mode,
            'token' => $token,
            'challenge' => $challenge
        ]);

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('Webhook verified successfully');
            return response($challenge, 200);
        }

        Log::warning('Webhook verification failed');
        return response('Forbidden', 403);
    }

    /**
     * Handle incoming WhatsApp messages (POST request from Facebook)
     */
    public function webhook(Request $request)
    {
        try {
            $data = $request->all();
            Log::info('Webhook received data:', $data);

            // Check if this is a WhatsApp message webhook
            if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
                foreach ($data['entry'] as $entry) {
                    if (isset($entry['changes'])) {
                        foreach ($entry['changes'] as $change) {
                            if ($change['field'] === 'messages' && isset($change['value']['messages'])) {
                                foreach ($change['value']['messages'] as $message) {
                                    $this->processIncomingMessage($message, $change['value']);
                                }
                            }
                        }
                    }
                }
            }

            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            Log::error('Webhook processing error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Process individual incoming message and send to Pusher
     */
    private function processIncomingMessage($message, $value)
    {
        try {
            // Extract message details
            $messageText = $message['text']['body'] ?? '';
            $senderPhone = $message['from'] ?? '';
            $messageId = $message['id'] ?? '';
            $timestamp = $message['timestamp'] ?? time();

            // Try to get contact name from contacts array
            $contactName = $senderPhone;
            if (isset($value['contacts'])) {
                foreach ($value['contacts'] as $contact) {
                    if ($contact['wa_id'] === $senderPhone) {
                        $contactName = $contact['profile']['name'] ?? $senderPhone;
                        break;
                    }
                }
            }

            // Ensure phone number has + prefix
            if (!str_starts_with($senderPhone, '+')) {
                $senderPhone = '+' . $senderPhone;
            }

            // Prepare data to send to React app
            $pusherData = [
                'message' => $messageText,
                'from' => $senderPhone,
                'contact_name' => $contactName,
                'message_id' => $messageId,
                'timestamp' => $timestamp,
                'type' => 'text'
            ];

            Log::info('Sending message to Pusher:', $pusherData);

            // Send to Pusher channel that your React app is listening to
            $this->pusher->trigger('fastwapi-channel', 'message-event', $pusherData);

            Log::info('Message sent to Pusher successfully');

        } catch (\Exception $e) {
            Log::error('Error processing message: ' . $e->getMessage());
        }
    }
}
