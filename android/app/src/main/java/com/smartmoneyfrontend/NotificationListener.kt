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

        // Bo qua thong bao do chinh app nay ban ra. Khi nguoi dung tao giao dich
        // o noi khac (vd: web), server day push ve may -> listener bat lai chinh
        // no va tao them mot pending trung lap voi giao dich vua tao.
        if (sbn.packageName == packageName) {
            Log.d(TAG, "⏭️ Skip own notification")
            return
        }

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
                !extras.getCharSequence(Notification.EXTRA_BIG_TEXT).isNullOrBlank() ->
                    extras.getCharSequence(Notification.EXTRA_BIG_TEXT).toString()

                !extras.getCharSequence(Notification.EXTRA_TEXT).isNullOrBlank() ->
                    extras.getCharSequence(Notification.EXTRA_TEXT).toString()

                bundleArray != null ->
                    Notification.MessagingStyle.Message
                        .getMessagesFromBundleArray(bundleArray)
                        .lastOrNull()
                        ?.text
                        ?.toString()
                        .orEmpty()

                else -> ""
            }
            
            Log.d(TAG, "ID = ${sbn.id}")
            Log.d(TAG, "TAG = ${sbn.tag}")
            Log.d(TAG, "GROUP = ${sbn.notification.group}")
            Log.d(TAG, "IS_GROUP = ${sbn.notification.flags and Notification.FLAG_GROUP_SUMMARY != 0}")

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