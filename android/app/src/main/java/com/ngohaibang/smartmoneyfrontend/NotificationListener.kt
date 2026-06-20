package com.ngohaibang.smartmoneyfrontend

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments

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

            val title = extras.getString("android.title") ?: ""
            val text = extras.getCharSequence("android.text")?.toString() ?: ""

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