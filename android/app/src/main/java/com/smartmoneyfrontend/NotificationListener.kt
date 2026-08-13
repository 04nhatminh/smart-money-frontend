package com.smartmoneyfrontend
import android.widget.Toast

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.bridge.Arguments
import android.app.Notification
import org.json.JSONObject

class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"

        // Loc so bo truoc khi luu vao queue ben vung, tranh chat/spam chiem cho.
        // Loc chinh xac (cham diem) van nam o phia JS.
        private val FINANCE_KEYWORDS = listOf(
            "bank", "vcb", "vietcom", "vietin", "bidv", "agribank", "techcom",
            "tcb", "mbbank", "mbmobile", "vpbank", "acb", "sacombank", "tpbank",
            "hdbank", "shb", "vib", "msb", "ocb", "scb", "seabank", "eximbank",
            "cake", "timo", "tnex", "momo", "zalopay", "shopeepay",
            "viettelmoney", "viettelpay", "moca", "pay", "digibank"
        )

        private val MONEY_REGEX =
            Regex("""[-+]?\s*\d[\d.,]*\s*(₫|đ|d|vnd|vnđ)""", RegexOption.IGNORE_CASE)
    }

    private fun isLikelyFinance(pkg: String, title: String, text: String): Boolean {
        val p = pkg.lowercase()
        val t = title.lowercase()
        if (FINANCE_KEYWORDS.any { p.contains(it) || t.contains(it) }) return true
        return MONEY_REGEX.containsMatchIn(text)
    }

    override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "🔥 SERVICE CREATED")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "✅ LISTENER CONNECTED")
    }

    // May Xiaomi/Oppo/Vivo... hay kill service khi user vuot tat app.
    // Chu dong xin bind lai de tiep tuc bat thong bao ngan hang.
    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "⚠️ LISTENER DISCONNECTED → requestRebind")
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                requestRebind(
                    android.content.ComponentName(this, NotificationListener::class.java)
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ requestRebind failed", e)
        }
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

            // Chi tao WritableMap (native object cua RN bridge) khi React dang
            // chay. Trong process headless (app bi kill, he thong restart rieng
            // listener) viec tao map co the nem exception -> mat luon thong bao
            // truoc khi kip luu queue.
            val module = NotificationModule.instance
            var delivered = false
            if (module != null) {
                val map = Arguments.createMap().apply {
                    putString("title", title)
                    putString("text", text)
                    putString("package", sbn.packageName)
                    putDouble("timestamp", sbn.postTime.toDouble())
                }
                delivered = module.sendNotificationEvent(map)
            }

            // App dong / React chua chay -> luu ben vung de xu ly khi app mo lai
            if (!delivered && text.isNotBlank() &&
                isLikelyFinance(sbn.packageName, title, text)
            ) {
                NotificationQueue.add(applicationContext, JSONObject().apply {
                    put("title", title)
                    put("text", text)
                    put("package", sbn.packageName)
                    put("timestamp", sbn.postTime)
                })
            }

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error reading notification", e)
        }
    }
}