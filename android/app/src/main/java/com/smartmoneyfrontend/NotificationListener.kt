package com.smartmoneyfrontend
import android.widget.Toast

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments
import android.app.Notification

class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"
    }

    override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "🔥 SERVICE CREATED")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "✅ LISTENER CONNECTED")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)

        if (sbn == null) return

        try {

            val extras = sbn.notification.extras


            val title =
                extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""

            val textBuilder = StringBuilder()

            extras.getCharSequence(Notification.EXTRA_TEXT)?.let {
                textBuilder.append(it).append("\n")
            }

            extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.let {
                textBuilder.append(it).append("\n")
            }

            // Đọc Conversation Notification
            val bundleArray = extras.getParcelableArray(Notification.EXTRA_MESSAGES)

            val text = when {
                bundleArray != null -> {
                    Notification.MessagingStyle.Message
                        .getMessagesFromBundleArray(bundleArray)
                        .joinToString("\n") { it.text?.toString().orEmpty() }
                }

                !extras.getCharSequence(Notification.EXTRA_BIG_TEXT).isNullOrBlank() ->
                    extras.getCharSequence(Notification.EXTRA_BIG_TEXT).toString()

                else ->
                    extras.getCharSequence(Notification.EXTRA_TEXT)?.toString().orEmpty()
            }

            Log.d(TAG, "TITLE = $title")
            Log.d(TAG, "TEXT  = $text")

            Log.d(TAG, "📩 Notification: $title | $text")

            val map = Arguments.createMap().apply {
                putString("title", title)
                putString("text", text)
                putString("package", sbn.packageName)
                putDouble("timestamp", sbn.postTime.toDouble())
            }

            NotificationModule.instance?.sendNotificationEvent(map)

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error reading notification", e)
        }
    }
}