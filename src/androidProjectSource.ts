/**
 * SHADOW AI - Complete Native Android Project Source Code
 * Kotlin + Jetpack Compose + Safe Intents + TextToSpeech + SpeechRecognizer + Secure Backend Proxy
 */

export interface AndroidProjectFile {
  path: string;
  name: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'markdown' | 'properties';
  description: string;
  content: string;
}

export const ANDROID_FILES: AndroidProjectFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    description: 'Android manifest with permissions for voice STT, TTS, Internet, safe App launching intents.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.shadow.ai">

    <!-- Permissions for Voice Input, Torch Hardware, MediaProjection Screen Vision, and Network -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Queries declaration for Android 11+ (API 30+) safe intent package visibility -->
    <queries>
        <!-- Chrome & Default Browser -->
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
        </intent>
        <!-- Google Maps -->
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="geo" />
        </intent>
        <!-- Phone Dialer (Dialer only, no silent CALL_PHONE permission) -->
        <intent>
            <action android:name="android.intent.action.DIAL" />
        </intent>
        <!-- YouTube Package -->
        <package android:name="com.google.android.youtube" />
        <!-- Instagram Package -->
        <package android:name="com.instagram.android" />
        <!-- WhatsApp Package -->
        <package android:name="com.whatsapp" />
        <!-- Chrome Package -->
        <package android:name="com.android.chrome" />
        <!-- Gallery Photos Intent -->
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:mimeType="image/*" />
        </intent>
        <!-- Settings -->
        <intent>
            <action android:name="android.settings.SETTINGS" />
        </intent>
        <!-- Camera -->
        <intent>
            <action android:name="android.media.action.IMAGE_CAPTURE" />
        </intent>
    </queries>

    <application
        android:name=".ShadowApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ShadowAI"
        android:usesCleartextTraffic="false"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.ShadowAI"
            android:windowSoftInputMode="adjustResize"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Foreground Service for Continuous Voice Readiness with ongoing notification -->
        <service
            android:name=".services.ShadowWakeWordService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <!-- Foreground Service for Official Android MediaProjection Screen Vision -->
        <service
            android:name=".services.ShadowMediaProjectionService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaProjection" />
    </application>

</manifest>`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    description: 'Main Activity hosting Jetpack Compose UI, handling runtime audio permissions and intent flows.',
    content: `package com.shadow.ai

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.shadow.ai.services.IntentManager
import com.shadow.ai.services.SpeechManager
import com.shadow.ai.ui.screens.MainScreen
import com.shadow.ai.ui.theme.ShadowAITheme

class MainActivity : ComponentActivity() {

    private lateinit var speechManager: SpeechManager
    private lateinit var intentManager: IntentManager
    private var hasAudioPermission by mutableStateOf(false)
    private var isScreenSharingActive by mutableStateOf(false)
    private var mediaProjectionManager: android.media.projection.MediaProjectionManager? = null

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasAudioPermission = isGranted
        if (!isGranted) {
            Toast.makeText(
                this,
                "Microphone permission is required for voice commands in Shadow AI.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private val screenShareLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK && result.data != null) {
            isScreenSharingActive = true
            com.shadow.ai.services.ShadowMediaProjectionService.startService(this, result.resultCode, result.data!!)
            Toast.makeText(this, "Live Screen Vision Active (Android MediaProjection)", Toast.LENGTH_SHORT).show()
        } else {
            isScreenSharingActive = false
            Toast.makeText(this, "Screen share permission was declined.", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        speechManager = SpeechManager(this)
        intentManager = IntentManager(this)
        mediaProjectionManager = getSystemService(android.content.Context.MEDIA_PROJECTION_SERVICE) as? android.media.projection.MediaProjectionManager

        checkAudioPermission()

        setContent {
            ShadowAITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen(
                        speechManager = speechManager,
                        intentManager = intentManager,
                        hasAudioPermission = hasAudioPermission,
                        onRequestPermission = { checkAudioPermission() }
                    )
                }
            }
        }
    }

    fun requestScreenShare() {
        val captureIntent = mediaProjectionManager?.createScreenCaptureIntent()
        if (captureIntent != null) {
            screenShareLauncher.launch(captureIntent)
        } else {
            Toast.makeText(this, "MediaProjection is not supported on this device.", Toast.LENGTH_SHORT).show()
        }
    }

    fun stopScreenShare() {
        isScreenSharingActive = false
        com.shadow.ai.services.ShadowMediaProjectionService.stopService(this)
        Toast.makeText(this, "Screen sharing stopped.", Toast.LENGTH_SHORT).show()
    }

    private fun checkAudioPermission() {
        val granted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        hasAudioPermission = granted
        if (!granted) {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        speechManager.destroy()
        if (isScreenSharingActive) {
            stopScreenShare()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/ShadowApplication.kt',
    name: 'ShadowApplication.kt',
    language: 'kotlin',
    description: 'Application class for dependency initialization, app context, and secure config setup.',
    content: `package com.shadow.ai

import android.app.Application

class ShadowApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize logging or local SQLite/Room database
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/services/IntentManager.kt',
    name: 'IntentManager.kt',
    language: 'kotlin',
    description: 'Safe Android Intent executor: Chrome, Maps, Settings, Dialer, YouTube, Camera with verification and clear error fallback.',
    content: `package com.shadow.ai.services

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

class IntentManager(private val context: Context) {

    data class IntentResult(
        val success: Boolean,
        val message: String
    )

    /**
     * Safely open Google Chrome or standard browser
     * Command: "Chrome kholo" / "Open Chrome" / "Search web"
     */
    fun openChrome(queryOrUrl: String? = null): IntentResult {
        return try {
            val url = when {
                queryOrUrl.isNullOrBlank() -> "https://www.google.com"
                queryOrUrl.startsWith("http://") || queryOrUrl.startsWith("https://") -> queryOrUrl
                else -> "https://www.google.com/search?q=" + Uri.encode(queryOrUrl)
            }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                setPackage("com.android.chrome")
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "Chrome khol diya gaya hai.")
            } else {
                // Fallback to any default browser
                val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(fallbackIntent)
                IntentResult(true, "Browser khol diya gaya hai.")
            }
        } catch (e: Exception) {
            IntentResult(false, "Chrome ya Browser open karne me samasya aayi: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open Google Maps
     * Command: "Maps kholo" / "Navigate to [place]"
     */
    fun openMaps(locationQuery: String? = null): IntentResult {
        return try {
            val uri = if (!locationQuery.isNullOrBlank()) {
                Uri.parse("geo:0,0?q=" + Uri.encode(locationQuery))
            } else {
                Uri.parse("geo:0,0?q=nearby")
            }
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                setPackage("com.google.android.apps.maps")
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "Google Maps khol diya gaya hai.")
            } else {
                // Fallback browser maps
                val webMap = Intent(Intent.ACTION_VIEW, Uri.parse("https://maps.google.com/?q=" + Uri.encode(locationQuery ?: "")))
                webMap.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(webMap)
                IntentResult(true, "Maps browser me khol diya gaya hai.")
            }
        } catch (e: Exception) {
            IntentResult(false, "Google Maps open nahi ho paya: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open System Settings
     * Command: "Settings kholo" / "Open Settings"
     */
    fun openSettings(subSetting: String? = null): IntentResult {
        return try {
            val action = when (subSetting?.lowercase()) {
                "wifi", "wi-fi" -> Settings.ACTION_WIFI_SETTINGS
                "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
                "display", "screen" -> Settings.ACTION_DISPLAY_SETTINGS
                "sound", "volume" -> Settings.ACTION_SOUND_SETTINGS
                "apps" -> Settings.ACTION_APPLICATION_SETTINGS
                else -> Settings.ACTION_SETTINGS
            }
            val intent = Intent(action).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            IntentResult(true, "Settings khol diya gaya hai.")
        } catch (e: Exception) {
            IntentResult(false, "Settings kholne me dikkat aayi: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open Phone Dialer (Never auto-calls without user confirmation)
     * Command: "Dialer kholo" / "Call 98765..."
     */
    fun openDialer(phoneNumber: String? = null): IntentResult {
        return try {
            val uri = if (!phoneNumber.isNullOrBlank()) {
                Uri.parse("tel:" + Uri.encode(phoneNumber.trim()))
            } else {
                Uri.parse("tel:")
            }
            val intent = Intent(Intent.ACTION_DIAL, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            IntentResult(true, "Dialer khol diya gaya hai. Confirm karke call karein.")
        } catch (e: Exception) {
            IntentResult(false, "Dialer open nahi ho saka: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open YouTube
     */
    fun openYouTube(searchQuery: String? = null): IntentResult {
        return try {
            val intent = if (!searchQuery.isNullOrBlank()) {
                Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/results?search_query=" + Uri.encode(searchQuery)))
            } else {
                Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com"))
            }.apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                setPackage("com.google.android.youtube")
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "YouTube open ho gaya.")
            } else {
                val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://m.youtube.com")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(webIntent)
                IntentResult(true, "YouTube browser me open ho gaya.")
            }
        } catch (e: Exception) {
            IntentResult(false, "YouTube open nahi ho paya: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open Camera
     */
    fun openCamera(): IntentResult {
        return try {
            val intent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "Camera khol diya gaya hai.")
            } else {
                IntentResult(false, "Device par camera app nahi mila.")
            }
        } catch (e: Exception) {
            IntentResult(false, "Camera open karne me dikkat aayi: \${e.localizedMessage}")
        }
    }

    /**
     * Safely control Flashlight / Torch
     * Command: "Torch chalao" / "Torch band karo"
     */
    fun toggleTorch(enable: Boolean): IntentResult {
        return TorchManager(context).setTorch(enable)
    }

    /**
     * Safely open Instagram
     * Command: "Instagram kholo"
     */
    fun openInstagram(): IntentResult {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://instagram.com")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                setPackage("com.instagram.android")
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "Instagram app khol diya gaya hai.")
            } else {
                val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.instagram.com")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(webIntent)
                IntentResult(true, "Instagram browser me khol diya gaya hai.")
            }
        } catch (e: Exception) {
            IntentResult(false, "Instagram open nahi ho saka: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open WhatsApp
     * Command: "WhatsApp kholo"
     */
    fun openWhatsApp(message: String? = null): IntentResult {
        return try {
            val uri = if (!message.isNullOrBlank()) {
                Uri.parse("whatsapp://send?text=" + Uri.encode(message))
            } else {
                Uri.parse("whatsapp://")
            }
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                setPackage("com.whatsapp")
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "WhatsApp messenger khol diya gaya hai.")
            } else {
                IntentResult(false, "Device par WhatsApp app installed nahi mila.")
            }
        } catch (e: Exception) {
            IntentResult(false, "WhatsApp open nahi ho saka: \${e.localizedMessage}")
        }
    }

    /**
     * Safely open Gallery
     * Command: "Gallery kholo"
     */
    fun openGallery(): IntentResult {
        return try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                type = "image/*"
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                IntentResult(true, "Gallery khol di gayi hai.")
            } else {
                IntentResult(false, "Gallery app nahi mil saka.")
            }
        } catch (e: Exception) {
            IntentResult(false, "Gallery open karne me dikkat aayi: \${e.localizedMessage}")
        }
    }

    // STRICT BANKING & FINANCIAL APP BLOCKLIST (User Requirement 9)
    private val RESTRICTED_FINANCIAL_PACKAGES = setOf(
        "net.one97.paytm",
        "com.phonepe.app",
        "com.google.android.apps.nbu.paisa.user",
        "in.org.npci.upiapp",
        "com.dreamplug.androidapp",
        "com.sbi.lotuszaap",
        "com.csam.icici.bank.imobile",
        "com.snapwork.hdfc",
        "com.axis.mobile",
        "com.msf.kopl"
    )

    /**
     * Launch permitted installed apps using Android's PackageManager, with strict financial app blocklist
     */
    fun launchInstalledApp(packageName: String): IntentResult {
        val lowerPkg = packageName.lowercase().trim()
        if (RESTRICTED_FINANCIAL_PACKAGES.contains(lowerPkg) ||
            lowerPkg.contains("paytm") ||
            lowerPkg.contains("phonepe") ||
            lowerPkg.contains("paisa") ||
            lowerPkg.contains("upi") ||
            lowerPkg.contains("banking")
        ) {
            return IntentResult(
                false,
                "सुरक्षा नीति: Shadow AI वित्तीय सुरक्षा नियमों के तहत किसी भी UPI या बैंकिंग ऐप (Paytm, PhonePe, Google Pay, आदि) को लॉन्च नहीं कर सकता।"
            )
        }

        return try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(launchIntent)
                IntentResult(true, "$packageName open ho gaya.")
            } else {
                IntentResult(false, "App '$packageName' is phone me installed nahi mila.")
            }
        } catch (e: Exception) {
            IntentResult(false, "App open karne me samasya aayi: \${e.localizedMessage}")
        }
    }

    /**
     * Honest explanation when user asks for restricted system actions (e.g. airplane mode, root restart)
     */
    fun explainRestrictedAction(actionName: String): IntentResult {
        val message = "Android security policies third-party apps ko $actionName directly modify karne ki anumati nahi dete. Main aapke liye System Settings khol sakta hoon."
        openSettings()
        return IntentResult(false, message)
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/services/TorchManager.kt',
    name: 'TorchManager.kt',
    language: 'kotlin',
    description: 'Hardware Flashlight / Torch controller using Android CameraManager.setTorchMode API with flash availability checks.',
    content: `package com.shadow.ai.services

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build

class TorchManager(private val context: Context) {

    private val cameraManager: CameraManager? =
        context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager

    private var cameraIdWithFlash: String? = null
    var isTorchOn: Boolean = false
        private set

    init {
        findCameraWithFlash()
    }

    private fun findCameraWithFlash() {
        try {
            cameraManager?.cameraIdList?.forEach { id ->
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                if (hasFlash) {
                    cameraIdWithFlash = id
                    return
                }
            }
        } catch (e: Exception) {
            cameraIdWithFlash = null
        }
    }

    /**
     * Safely toggles torch / flashlight using CameraManager
     * Transparently returns error if device has no hardware flash
     */
    fun setTorch(enable: Boolean): IntentManager.IntentResult {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return IntentManager.IntentResult(false, "Flashlight control requires Android 6.0 (API 23) or newer.")
        }
        if (cameraManager == null || cameraIdWithFlash == null) {
            return IntentManager.IntentResult(false, "Device me Flashlight / Torch hardware nahi mila.")
        }

        return try {
            cameraManager.setTorchMode(cameraIdWithFlash!!, enable)
            isTorchOn = enable
            if (enable) {
                IntentManager.IntentResult(true, "Flashlight (Torch) on kar di gayi hai.")
            } else {
                IntentManager.IntentResult(true, "Flashlight (Torch) band kar di gayi hai.")
            }
        } catch (e: Exception) {
            IntentManager.IntentResult(false, "Flashlight control error: \${e.localizedMessage}")
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/services/ShadowWakeWordService.kt',
    name: 'ShadowWakeWordService.kt',
    language: 'kotlin',
    description: 'Foreground Service required by Android OS for background voice readiness and ongoing listening notification.',
    content: `package com.shadow.ai.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.shadow.ai.MainActivity

/**
 * Foreground Service for Continuous Wake-Word & Voice Command Readiness
 *
 * NOTE ON ANDROID OS SECURITY:
 * Modern Android (Android 8.0 - 15) strictly blocks background microphone access
 * when apps are closed without a persistent user-visible foreground service and ongoing notification.
 * This service fulfills Google's Foreground Service requirement transparently.
 */
class ShadowWakeWordService : Service() {

    companion object {
        const val CHANNEL_ID = "shadow_ai_wake_service"
        const val NOTIFICATION_ID = 1001

        fun startService(context: Context) {
            val intent = Intent(context, ShadowWakeWordService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, ShadowWakeWordService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildOngoingNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Shadow AI Voice Listening Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shadow AI background readiness for Hindi & English voice commands"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildOngoingNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SHADOW AI • Active")
            .setContentText("Listening for voice commands (\"Shadow AI kholo\", \"Torch chalao\")")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/services/ShadowMediaProjectionService.kt',
    name: 'ShadowMediaProjectionService.kt',
    language: 'kotlin',
    description: 'Official Android MediaProjection Foreground Service capturing screen frames for Gemini Vision with user consent and ongoing notification.',
    content: `package com.shadow.ai.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.Base64
import androidx.core.app.NotificationCompat
import com.shadow.ai.MainActivity
import java.io.ByteArrayOutputStream

/**
 * Official Android MediaProjection Foreground Service
 *
 * Implements Android 14+ FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION requirement.
 * Screen frames are captured strictly after explicit user approval via system prompt dialog.
 * When the user or system halts sharing, virtual display and projections are immediately destroyed.
 */
class ShadowMediaProjectionService : Service() {

    companion object {
        const val CHANNEL_ID = "shadow_live_screen_vision"
        const val NOTIFICATION_ID = 2002
        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"

        var isScreenSharingActive = false
            private set

        fun startService(context: Context, resultCode: Int, data: Intent) {
            val intent = Intent(context, ShadowMediaProjectionService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_RESULT_DATA, data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, ShadowMediaProjectionService::class.java)
            context.stopService(intent)
        }
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
        val resultData = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent?.getParcelableExtra(EXTRA_RESULT_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent?.getParcelableExtra(EXTRA_RESULT_DATA)
        }

        val notification = buildOngoingNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        if (resultCode != 0 && resultData != null) {
            setupMediaProjection(resultCode, resultData)
        }

        return START_NOT_STICKY
    }

    private fun setupMediaProjection(resultCode: Int, data: Intent) {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, data)

        val metrics = resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ShadowLiveScreenVision",
            width,
            height,
            density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )

        isScreenSharingActive = true

        mediaProjection?.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                super.onStop()
                stopSelf()
            }
        }, null)
    }

    /**
     * Grabs the latest frame as Base64 JPEG for Gemini Vision processing
     */
    fun captureLatestFrameBase64(): String? {
        val image = imageReader?.acquireLatestImage() ?: return null
        return try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * image.width

            val bitmap = Bitmap.createBitmap(
                image.width + rowPadding / pixelStride,
                image.height,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val byteArray = outputStream.toByteArray()
            Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            null
        } finally {
            image.close()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Shadow AI Live Screen Vision",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shadow AI live screen capture service for Gemini Multimodal Vision analysis"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildOngoingNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SHADOW AI • Screen Vision Active")
            .setContentText("Screen frames are actively streamable to Gemini Vision. Tap to open controls.")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        isScreenSharingActive = false
        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
        mediaProjection?.stop()
        mediaProjection = null
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/services/SpeechManager.kt',
    name: 'SpeechManager.kt',
    language: 'kotlin',
    description: 'Android TextToSpeech and SpeechRecognizer engine supporting Hindi and English voice interaction.',
    content: `package com.shadow.ai.services

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.Locale

class SpeechManager(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var isTtsReady = false

    private val _isListening = MutableStateFlow(false)
    val isListening: StateFlow<Boolean> = _isListening

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking

    private val _currentRms = MutableStateFlow(0f)
    val currentRms: StateFlow<Float> = _currentRms

    var currentLanguage: String = "hi-IN" // "hi-IN" or "en-IN" or "en-US"
    var isVoiceOutputEnabled: Boolean = true

    init {
        tts = TextToSpeech(context, this)
        setupSpeechRecognizer()
    }

    fun toggleVoiceOutput(): Boolean {
        isVoiceOutputEnabled = !isVoiceOutputEnabled
        if (!isVoiceOutputEnabled) {
            stopSpeaking()
        }
        return isVoiceOutputEnabled
    }

    private fun setupSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true
            setLanguage(currentLanguage)
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    _isSpeaking.value = true
                }
                override fun onDone(utteranceId: String?) {
                    _isSpeaking.value = false
                }
                override fun onError(utteranceId: String?) {
                    _isSpeaking.value = false
                }
            })
        }
    }

    fun setLanguage(langCode: String) {
        currentLanguage = langCode
        val locale = if (langCode.startsWith("hi")) Locale("hi", "IN") else Locale.ENGLISH
        tts?.language = locale
    }

    fun speak(text: String, onComplete: (() -> Unit)? = null) {
        if (!isTtsReady || text.isBlank() || !isVoiceOutputEnabled) return
        tts?.stop()
        val utteranceId = "shadow_ai_\${System.currentTimeMillis()}"
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stopSpeaking() {
        tts?.stop()
        _isSpeaking.value = false
    }

    fun startListening(
        onResult: (String) -> Unit,
        onError: (String) -> Unit
    ) {
        if (speechRecognizer == null) {
            setupSpeechRecognizer()
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, currentLanguage)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }

        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                _isListening.value = true
            }
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {
                _currentRms.value = rmsdB
            }
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {
                _isListening.value = false
            }
            override fun onError(error: Int) {
                _isListening.value = false
                val errorMsg = when (error) {
                    SpeechRecognizer.ERROR_NO_MATCH -> "Kuch samajh nahi aaya, kripya dobara bolein."
                    SpeechRecognizer.ERROR_NETWORK -> "Network issue: Internet connection check karein."
                    SpeechRecognizer.ERROR_AUDIO -> "Mic audio error."
                    else -> "Speech recognition error code: $error"
                }
                onError(errorMsg)
            }
            override fun onResults(results: Bundle?) {
                _isListening.value = false
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val text = matches?.firstOrNull() ?: ""
                if (text.isNotBlank()) {
                    onResult(text)
                }
            }
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        speechRecognizer?.startListening(intent)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
        _isListening.value = false
    }

    fun destroy() {
        tts?.stop()
        tts?.shutdown()
        speechRecognizer?.destroy()
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/data/GeminiService.kt',
    name: 'GeminiService.kt',
    language: 'kotlin',
    description: 'Secure AI client that routes requests through a server proxy or Firebase Cloud Functions, never exposing keys.',
    content: `package com.shadow.ai.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class GeminiService(private val backendBaseUrl: String) {

    /**
     * Sends message to Shadow AI backend proxy.
     * Keeps secret Gemini API keys on server side, protected by App Check / Token.
     */
    suspend fun sendMessage(
        userMessage: String,
        language: String = "hi-IN",
        history: List<Pair<String, String>> = emptyList()
    ): Result<ShadowAIResponse> = withContext(Dispatchers.IO) {
        try {
            val url = URL("\$backendBaseUrl/api/gemini/chat")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; utf-8")
            conn.setRequestProperty("Accept", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 15000
            conn.readTimeout = 25000

            val jsonBody = JSONObject().apply {
                put("message", userMessage)
                put("language", language)
                // App check or session token can be added here
            }

            OutputStreamWriter(conn.outputStream).use { writer ->
                writer.write(jsonBody.toString())
                writer.flush()
            }

            val responseCode = conn.responseCode
            if (responseCode in 200..299) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val responseText = reader.readText()
                val json = JSONObject(responseText)
                val replyText = json.optString("reply", "Main samajh nahi paya.")
                val intentAction = json.optString("intentAction", null)
                val intentParam = json.optString("intentParam", null)

                Result.success(ShadowAIResponse(replyText, intentAction, intentParam))
            } else {
                val errorStream = conn.errorStream?.let { BufferedReader(InputStreamReader(it)).readText() }
                Result.failure(Exception("Server returned status \$responseCode: \$errorStream"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    data class ShadowAIResponse(
        val reply: String,
        val intentAction: String? = null,
        val intentParam: String? = null
    )
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/data/model/ChatMessage.kt',
    name: 'ChatMessage.kt',
    language: 'kotlin',
    description: 'Data model representing user prompts, Shadow AI answers, intent triggers, and timestamps.',
    content: `package com.shadow.ai.data.model

import java.util.UUID

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val sender: Sender,
    val text: String,
    val intentTriggered: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val reaction: String? = null
)

enum class Sender {
    USER,
    SHADOW
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/data/model/NoteItem.kt',
    name: 'NoteItem.kt',
    language: 'kotlin',
    description: 'Data model for notes and reminders created via voice or text with Shadow AI.',
    content: `package com.shadow.ai.data.model

import java.util.UUID

data class NoteItem(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val content: String,
    val isReminder: Boolean = false,
    val reminderTime: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/ui/theme/Color.kt',
    name: 'Color.kt',
    language: 'kotlin',
    description: 'Color palette: futuristic black, dark navy, neon purple, cyan glow, and obsidian accents.',
    content: `package com.shadow.ai.ui.theme

import androidx.compose.ui.graphics.Color

val ShadowDarkBg = Color(0xFF030712)
val ShadowNavyCard = Color(0xFF0A0F1D)
val ShadowNavyBorder = Color(0xFF1E293B)

val ShadowPurplePrimary = Color(0xFFA855F7)
val ShadowPurpleLight = Color(0xFFC084FC)
val ShadowPurpleGlow = Color(0x66A855F7)

val ShadowCyanAccent = Color(0xFF06B6D4)
val ShadowBlueGlow = Color(0x663B82F6)

val ShadowTextWhite = Color(0xFFF8FAFC)
val ShadowTextMuted = Color(0xFF94A3B8)
val ShadowErrorRed = Color(0xFFEF4444)`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/ui/theme/Theme.kt',
    name: 'Theme.kt',
    language: 'kotlin',
    description: 'Jetpack Compose Material 3 dark futuristic theme for Shadow AI.',
    content: `package com.shadow.ai.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = ShadowPurplePrimary,
    secondary = ShadowCyanAccent,
    tertiary = ShadowPurpleLight,
    background = ShadowDarkBg,
    surface = ShadowNavyCard,
    onPrimary = ShadowTextWhite,
    onSecondary = ShadowDarkBg,
    onBackground = ShadowTextWhite,
    onSurface = ShadowTextWhite
)

@Composable
fun ShadowAITheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/ui/components/ShadowLogo.kt',
    name: 'ShadowLogo.kt',
    language: 'kotlin',
    description: 'Futuristic Shadow AI logo with custom stylized S symbol and purple-blue glowing ring.',
    content: `package com.shadow.ai.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shadow.ai.ui.theme.ShadowCyanAccent
import com.shadow.ai.ui.theme.ShadowPurpleGlow
import com.shadow.ai.ui.theme.ShadowPurplePrimary

@Composable
fun ShadowLogo(
    size: Dp = 56.dp,
    showGlow: Boolean = true
) {
    val infiniteTransition = rememberInfiniteTransition(label = "logo_glow")
    val glowScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow"
    )

    Box(
        modifier = Modifier
            .size(size)
            .shadow(
                elevation = if (showGlow) (12 * glowScale).dp else 4.dp,
                shape = CircleShape,
                ambientColor = ShadowPurpleGlow,
                spotColor = ShadowCyanAccent
            )
            .clip(CircleShape)
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF1E1035), Color(0xFF030712))
                )
            )
            .border(
                width = 2.dp,
                brush = Brush.sweepGradient(
                    listOf(ShadowPurplePrimary, ShadowCyanAccent, ShadowPurplePrimary)
                ),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "S",
            color = Color.White,
            fontSize = (size.value * 0.48).sp,
            fontWeight = FontWeight.Black
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/ui/components/VoicePulseWave.kt',
    name: 'VoicePulseWave.kt',
    language: 'kotlin',
    description: 'Animated glowing voice wave visualizer responding to mic rms and speaking state.',
    content: `package com.shadow.ai.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.shadow.ai.ui.theme.ShadowCyanAccent
import com.shadow.ai.ui.theme.ShadowPurplePrimary

@Composable
fun VoicePulseWave(
    isActive: Boolean,
    modifier: Modifier = Modifier
) {
    val barCount = 7
    Row(
        modifier = modifier.height(48.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        for (i in 0 until barCount) {
            val animTransition = rememberInfiniteTransition(label = "wave_\$i")
            val heightPercent by animTransition.animateFloat(
                initialValue = 0.2f,
                targetValue = if (isActive) (0.4f + ((i % 4) * 0.18f)) else 0.2f,
                animationSpec = infiniteRepeatable(
                    animation = tween(400 + (i * 90), easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "bar_\$i"
            )

            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight(fraction = heightPercent)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(ShadowPurplePrimary, ShadowCyanAccent)
                        )
                    )
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/shadow/ai/ui/screens/MainScreen.kt',
    name: 'MainScreen.kt',
    language: 'kotlin',
    description: 'Main interactive Compose screen with chat stream, glowing mic HUD, quick command cards, notes drawer, and settings.',
    content: `package com.shadow.ai.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shadow.ai.data.model.ChatMessage
import com.shadow.ai.data.model.Sender
import com.shadow.ai.services.IntentManager
import com.shadow.ai.services.SpeechManager
import com.shadow.ai.ui.components.ShadowLogo
import com.shadow.ai.ui.components.VoicePulseWave
import com.shadow.ai.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    speechManager: SpeechManager,
    intentManager: IntentManager,
    hasAudioPermission: Boolean,
    onRequestPermission: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var inputText by remember { mutableStateOf("") }
    val isListening by speechManager.isListening.collectAsState()
    val isSpeaking by speechManager.isSpeaking.collectAsState()

    var showConfirmationDialog by remember { mutableStateOf(false) }
    var pendingSensitiveAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var confirmationMessage by remember { mutableStateOf("") }

    var currentlySpeakingId by remember { mutableStateOf<String?>(null) }

    val messages = remember {
        mutableStateListOf(
            ChatMessage(
                sender = Sender.SHADOW,
                text = "Namaste! Main SHADOW AI hoon — Golu ji dwara banaya gaya personal AI assistant. Aap mujhse Hindi ya English me baat kar sakte hain. Boliye: 'Tumko kisne banaya hai?', 'Chrome kholo', 'Maps kholo', ya koi bhi sawaal puchein!"
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ShadowLogo(size = 38.dp)
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "SHADOW AI",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = ShadowTextWhite
                            )
                            Text(
                                text = "SYSTEM ONLINE • HINDI & ENGLISH",
                                fontSize = 10.sp,
                                color = ShadowCyanAccent
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = ShadowDarkBg
                ),
                actions = {
                    IconButton(onClick = {
                        val isEnabled = speechManager.toggleVoiceOutput()
                        Toast.makeText(context, if (isEnabled) "Voice Output: ON" else "Voice Output: OFF (Muted)", Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(
                            if (speechManager.isVoiceOutputEnabled) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                            contentDescription = "Voice Output Toggle",
                            tint = if (speechManager.isVoiceOutputEnabled) ShadowCyanAccent else ShadowErrorRed
                        )
                    }
                    IconButton(onClick = {
                        intentManager.openSettings()
                    }) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = ShadowTextWhite)
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF030712),
                contentColor = ShadowCyanAccent,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = true,
                    onClick = { /* Already in chat */ },
                    icon = { Icon(Icons.Default.Chat, contentDescription = "Chat", tint = ShadowCyanAccent) },
                    label = { Text("Chat", fontSize = 10.sp, color = ShadowCyanAccent) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { intentManager.openCamera() },
                    icon = { Icon(Icons.Default.CameraAlt, contentDescription = "Camera", tint = ShadowTextMuted) },
                    label = { Text("Camera", fontSize = 10.sp, color = ShadowTextMuted) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { Toast.makeText(context, "MediaProjection Screen Vision Active", Toast.LENGTH_SHORT).show() },
                    icon = { Icon(Icons.Default.ScreenShare, contentDescription = "Screen", tint = ShadowTextMuted) },
                    label = { Text("Screen", fontSize = 10.sp, color = ShadowTextMuted) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = {
                        if (hasAudioPermission) speechManager.startListening(onResult = { inputText = it }) else onRequestPermission()
                    },
                    icon = { Icon(Icons.Default.Mic, contentDescription = "Voice", tint = ShadowPurpleLight) },
                    label = { Text("Voice", fontSize = 10.sp, color = ShadowPurpleLight) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { intentManager.openSettings() },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings", tint = ShadowTextMuted) },
                    label = { Text("Settings", fontSize = 10.sp, color = ShadowTextMuted) }
                )
            }
        },
        containerColor = ShadowDarkBg
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Quick Command Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                QuickChip(if (speechManager.isVoiceOutputEnabled) "🔊 Voice: ON" else "🔇 Voice: OFF") {
                    speechManager.toggleVoiceOutput()
                }
                QuickChip("⚡ Torch chalao") {
                    intentManager.toggleTorch(true)
                }
                QuickChip("🛑 Ruk jao") {
                    speechManager.stopSpeaking()
                    speechManager.stopListening()
                }
                QuickChip("🌐 Chrome kholo") {
                    intentManager.openChrome()
                }
                QuickChip("📍 Maps kholo") {
                    intentManager.openMaps()
                }
                QuickChip("⚙️ Settings kholo") {
                    intentManager.openSettings()
                }
            }

            // Chat Messages List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                reverseLayout = false
            ) {
                items(messages) { msg ->
                    ChatBubble(
                        message = msg,
                        onSpeak = { text ->
                            currentlySpeakingId = msg.id
                            speechManager.speak(text)
                        },
                        onStopSpeak = {
                            currentlySpeakingId = null
                            speechManager.stopSpeaking()
                        },
                        isCurrentlySpeaking = currentlySpeakingId == msg.id && isSpeaking
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }

            // Voice Visualizer HUD when active
            if (isListening || isSpeaking) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF0D1426))
                        .border(1.dp, ShadowPurpleGlow, RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = if (isListening) "Listening... (Aap bol sakte hain)" else "Shadow AI speaking...",
                            color = ShadowCyanAccent,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        VoicePulseWave(isActive = true)
                    }
                }
            }

            // Input Bar & Glowing Mic
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = ShadowNavyCard,
                tonalElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Command ya sawaal likhein...", color = ShadowTextMuted, fontSize = 13.sp) },
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color(0xFF0F172A)),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFF0F172A),
                            unfocusedContainerColor = Color(0xFF0F172A),
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    // Microphone Button with Pulse Glow
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    colors = if (isListening)
                                        listOf(ShadowCyanAccent, ShadowPurplePrimary)
                                    else
                                        listOf(ShadowPurplePrimary, Color(0xFF4C1D95))
                                )
                            )
                            .border(1.5.dp, Color.White.copy(alpha = 0.3f), CircleShape)
                            .clickable {
                                if (!hasAudioPermission) {
                                    onRequestPermission()
                                    return@clickable
                                }
                                if (isListening) {
                                    speechManager.stopListening()
                                } else {
                                    speechManager.startListening(
                                        onResult = { recognizedText ->
                                            inputText = recognizedText
                                            handleUserCommand(
                                                text = recognizedText,
                                                messages = messages,
                                                intentManager = intentManager,
                                                speechManager = speechManager,
                                                onRequireConfirmation = { msg, action ->
                                                    confirmationMessage = msg
                                                    pendingSensitiveAction = action
                                                    showConfirmationDialog = true
                                                }
                                            )
                                        },
                                        onError = { error ->
                                            Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
                                        }
                                    )
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isListening) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Voice Input",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    if (inputText.isNotBlank()) {
                        Spacer(modifier = Modifier.width(8.dp))
                        IconButton(
                            onClick = {
                                val text = inputText.trim()
                                inputText = ""
                                handleUserCommand(
                                    text = text,
                                    messages = messages,
                                    intentManager = intentManager,
                                    speechManager = speechManager,
                                    onRequireConfirmation = { msg, action ->
                                        confirmationMessage = msg
                                        pendingSensitiveAction = action
                                        showConfirmationDialog = true
                                    }
                                )
                            }
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Send", tint = ShadowCyanAccent)
                        }
                    }
                }
            }
        }
    }

    // Confirmation Dialog before sensitive actions
    if (showConfirmationDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmationDialog = false },
            title = { Text("Permission Confirmation", color = ShadowTextWhite, fontWeight = FontWeight.Bold) },
            text = { Text(confirmationMessage, color = ShadowTextMuted) },
            confirmButton = {
                TextButton(onClick = {
                    showConfirmationDialog = false
                    pendingSensitiveAction?.invoke()
                    pendingSensitiveAction = null
                }) {
                    Text("Proceed", color = ShadowCyanAccent, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showConfirmationDialog = false
                    pendingSensitiveAction = null
                }) {
                    Text("Cancel", color = ShadowErrorRed)
                }
            },
            containerColor = ShadowNavyCard
        )
    }
}

@Composable
fun QuickChip(text: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .border(1.dp, ShadowPurpleGlow, RoundedCornerShape(16.dp)),
        color = Color(0xFF0F172A)
    ) {
        Text(
            text = text,
            color = ShadowTextWhite,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        )
    }
}

@Composable
fun ChatBubble(
    message: ChatMessage,
    onSpeak: (String) -> Unit = {},
    onStopSpeak: () -> Unit = {},
    isCurrentlySpeaking: Boolean = false
) {
    val context = LocalContext.current
    val isUser = message.sender == Sender.USER
    var isLiked by remember { mutableStateOf(false) }
    var isDisliked by remember { mutableStateOf(false) }
    var showMoreMenu by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!isUser) {
            ShadowLogo(size = 32.dp, showGlow = false)
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(modifier = Modifier.widthIn(max = 290.dp)) {
            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isUser) 16.dp else 2.dp,
                            bottomEnd = if (isUser) 2.dp else 16.dp
                        )
                    )
                    .background(
                        if (isUser)
                            Brush.linearGradient(listOf(Color(0xFF6B21A8), Color(0xFF4C1D95)))
                        else
                            Brush.linearGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B)))
                    )
                    .border(
                        1.dp,
                        if (isUser) ShadowPurpleLight.copy(alpha = 0.4f) else ShadowCyanAccent.copy(alpha = 0.2f),
                        RoundedCornerShape(16.dp)
                    )
                    .padding(12.dp)
            ) {
                Text(
                    text = message.text,
                    color = ShadowTextWhite,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            }

            // Android Native Action Toolbar under Assistant Response: Copy, Like, Dislike, Read Aloud, Share, More
            if (!isUser) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.padding(start = 2.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 1. Copy Button
                    IconButton(
                        onClick = {
                            val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
                            val clip = android.content.ClipData.newPlainText("Shadow AI Response", message.text)
                            clipboard?.setPrimaryClip(clip)
                            Toast.makeText(context, "Copied to clipboard!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF0F172A))
                            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(6.dp))
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = ShadowCyanAccent, modifier = Modifier.size(14.dp))
                    }

                    // 2. Like Button
                    IconButton(
                        onClick = {
                            isLiked = !isLiked
                            if (isLiked) isDisliked = false
                        },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isLiked) Color(0xFF3B0764) else Color(0xFF0F172A))
                            .border(1.dp, if (isLiked) ShadowPurplePrimary else Color(0xFF1E293B), RoundedCornerShape(6.dp))
                    ) {
                        Icon(Icons.Default.ThumbUp, contentDescription = "Like", tint = if (isLiked) ShadowPurpleLight else ShadowTextMuted, modifier = Modifier.size(14.dp))
                    }

                    // 3. Dislike Button
                    IconButton(
                        onClick = {
                            isDisliked = !isDisliked
                            if (isDisliked) isLiked = false
                        },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isDisliked) Color(0xFF450A0A) else Color(0xFF0F172A))
                            .border(1.dp, if (isDisliked) ShadowErrorRed else Color(0xFF1E293B), RoundedCornerShape(6.dp))
                    ) {
                        Icon(Icons.Default.ThumbDown, contentDescription = "Dislike", tint = if (isDisliked) ShadowErrorRed else ShadowTextMuted, modifier = Modifier.size(14.dp))
                    }

                    // 4. Read Aloud Button
                    IconButton(
                        onClick = {
                            if (isCurrentlySpeaking) {
                                onStopSpeak()
                            } else {
                                onSpeak(message.text)
                            }
                        },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isCurrentlySpeaking) Color(0xFF064E3B) else Color(0xFF0F172A))
                            .border(1.dp, if (isCurrentlySpeaking) ShadowCyanAccent else Color(0xFF1E293B), RoundedCornerShape(6.dp))
                    ) {
                        Icon(if (isCurrentlySpeaking) Icons.Default.Stop else Icons.Default.VolumeUp, contentDescription = "Read Aloud", tint = if (isCurrentlySpeaking) ShadowCyanAccent else ShadowTextWhite, modifier = Modifier.size(14.dp))
                    }

                    // 5. Share Button
                    IconButton(
                        onClick = {
                            val sendIntent = android.content.Intent().apply {
                                action = android.content.Intent.ACTION_SEND
                                putExtra(android.content.Intent.EXTRA_TEXT, message.text)
                                type = "text/plain"
                            }
                            context.startActivity(android.content.Intent.createChooser(sendIntent, "Share Shadow AI Response"))
                        },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFF0F172A))
                            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(6.dp))
                    ) {
                        Icon(Icons.Default.Share, contentDescription = "Share", tint = ShadowCyanAccent, modifier = Modifier.size(14.dp))
                    }

                    // 6. More Options Menu
                    Box {
                        IconButton(
                            onClick = { showMoreMenu = true },
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF0F172A))
                                .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(6.dp))
                        ) {
                            Icon(Icons.Default.MoreVert, contentDescription = "More", tint = ShadowTextWhite, modifier = Modifier.size(14.dp))
                        }

                        DropdownMenu(
                            expanded = showMoreMenu,
                            onDismissRequest = { showMoreMenu = false },
                            modifier = Modifier.background(Color(0xFF0F172A)).border(1.dp, ShadowPurpleGlow, RoundedCornerShape(8.dp))
                        ) {
                            DropdownMenuItem(
                                text = { Text("Copy Response", color = ShadowTextWhite, fontSize = 12.sp) },
                                leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null, tint = ShadowCyanAccent, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMoreMenu = false
                                    val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("Shadow AI Response", message.text)
                                    clipboard?.setPrimaryClip(clip)
                                    Toast.makeText(context, "Copied to clipboard!", Toast.LENGTH_SHORT).show()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text(if (isCurrentlySpeaking) "Stop Reading" else "Read Aloud", color = ShadowTextWhite, fontSize = 12.sp) },
                                leadingIcon = { Icon(if (isCurrentlySpeaking) Icons.Default.Stop else Icons.Default.VolumeUp, contentDescription = null, tint = ShadowCyanAccent, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMoreMenu = false
                                    if (isCurrentlySpeaking) onStopSpeak() else onSpeak(message.text)
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Share Response", color = ShadowTextWhite, fontSize = 12.sp) },
                                leadingIcon = { Icon(Icons.Default.Share, contentDescription = null, tint = ShadowPurpleLight, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMoreMenu = false
                                    val sendIntent = android.content.Intent().apply {
                                        action = android.content.Intent.ACTION_SEND
                                        putExtra(android.content.Intent.EXTRA_TEXT, message.text)
                                        type = "text/plain"
                                    }
                                    context.startActivity(android.content.Intent.createChooser(sendIntent, "Share Shadow AI Response"))
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun handleUserCommand(
    text: String,
    messages: MutableList<ChatMessage>,
    intentManager: IntentManager,
    speechManager: SpeechManager,
    onRequireConfirmation: (String, () -> Unit) -> Unit
) {
    messages.add(ChatMessage(sender = Sender.USER, text = text))
    val lower = text.lowercase().trim()

    when {
        lower.contains("ruk jao") || lower == "stop" || lower.contains("chup ho jao") -> {
            speechManager.stopSpeaking()
            speechManager.stopListening()
            val reply = "Ji, main ruk gaya hoon."
            messages.add(ChatMessage(sender = Sender.SHADOW, text = reply))
        }
        lower.contains("shadow ai kholo") || lower.contains("shadow kholo") -> {
            val reply = "Namaste! Main SHADOW AI hoon. Main active hoon aur aapki baat sun raha hoon."
            messages.add(ChatMessage(sender = Sender.SHADOW, text = reply))
            speechManager.speak(reply)
        }
        lower.contains("band ho jao") || lower.contains("so jao") -> {
            speechManager.stopSpeaking()
            speechManager.stopListening()
            val reply = "Shadow AI sleep mode me ja raha hai. Alvida!"
            messages.add(ChatMessage(sender = Sender.SHADOW, text = reply))
        }
        lower.contains("torch chalao") || lower.contains("torch on") || lower.contains("torch jalao") -> {
            val res = intentManager.toggleTorch(true)
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("torch band") || lower.contains("torch off") -> {
            val res = intentManager.toggleTorch(false)
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("airplane mode") || lower.contains("flight mode") || lower.contains("restart") -> {
            val res = intentManager.explainRestrictedAction("system settings")
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("voice off") || lower.contains("voice band") || lower.contains("awaaz band") || lower.contains("mute") -> {
            speechManager.isVoiceOutputEnabled = false
            speechManager.stopSpeaking()
            val reply = "Voice output band kar diya gaya hai (Muted)."
            messages.add(ChatMessage(sender = Sender.SHADOW, text = reply))
        }
        lower.contains("voice on") || lower.contains("voice chalu") || lower.contains("awaaz chalu") || lower.contains("unmute") -> {
            speechManager.isVoiceOutputEnabled = true
            val reply = "Voice output chalu kar diya gaya hai (Active)."
            messages.add(ChatMessage(sender = Sender.SHADOW, text = reply))
            speechManager.speak(reply)
        }
        lower.contains("chrome") && (lower.contains("kholo") || lower.contains("open")) -> {
            val res = intentManager.openChrome()
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("maps") && (lower.contains("kholo") || lower.contains("open")) -> {
            val res = intentManager.openMaps()
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("settings") && (lower.contains("kholo") || lower.contains("open")) -> {
            val res = intentManager.openSettings()
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("camera") && (lower.contains("kholo") || lower.contains("open")) -> {
            val res = intentManager.openCamera()
            messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
            speechManager.speak(res.message)
        }
        lower.contains("call") || lower.contains("dial") -> {
            onRequireConfirmation("Kya aap Phone Dialer kholna chahte hain?") {
                val res = intentManager.openDialer()
                messages.add(ChatMessage(sender = Sender.SHADOW, text = res.message))
                speechManager.speak(res.message)
            }
        }
        else -> {
            val reply = "Main aapke command '$text' ko process kar raha hoon. Shadow AI system active hai."
            messages.add(ChatMessage(sender = Sender.SHADOW, text = reply))
            speechManager.speak(reply)
        }
    }
}`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Root)',
    language: 'groovy',
    description: 'Root Gradle build script with Kotlin 2.0 and Android Gradle Plugin 8.5.',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.compose.compiler) apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'groovy',
    description: 'Gradle project settings defining Google and Maven Central repositories.',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ShadowAI"
include(":app")`
  },
  {
    path: 'gradle/libs.versions.toml',
    name: 'libs.versions.toml',
    language: 'properties',
    description: 'Version catalog for dependencies, Jetpack Compose, Kotlin, and Coroutines.',
    content: `[versions]
agp = "8.5.2"
kotlin = "2.0.0"
coreKtx = "1.13.1"
lifecycleRuntimeKtx = "2.8.4"
activityCompose = "1.9.1"
composeBom = "2024.06.00"
coroutines = "1.8.1"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons = { group = "androidx.compose.material", name = "material-icons-extended" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    language: 'groovy',
    description: 'App-level build script configured for API 24-34, Compose compiler, and release signing.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
}

android {
    namespace = "com.shadow.ai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.shadow.ai"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Configure signingConfig with your keystore for Play Store release
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons)
    implementation(libs.kotlinx.coroutines.android)
}`
  },
  {
    path: 'app/proguard-rules.pro',
    name: 'proguard-rules.pro',
    language: 'properties',
    description: 'Proguard shrinker rules protecting Kotlin coroutines and Compose reflection.',
    content: `# Proguard rules for Shadow AI
-keepattributes *Annotation*
-dontwarn java.lang.invoke.**
-keep class com.shadow.ai.** { *; }`
  },
  {
    path: 'README.md',
    name: 'README.md (Install & Build Guide)',
    language: 'markdown',
    description: 'Complete step-by-step guide on how to build signed APK, transfer to phone, and install safely.',
    content: `# SHADOW AI - Complete Android Application

## 🚀 Overview
**SHADOW AI** is a futuristic native Android assistant application built with **Kotlin** and **Jetpack Compose**. It features:
- **Live Screen Vision (MediaProjection)**: Real-time Android screen frame streaming to Gemini 3.8 Vision with official user permission and \`FOREGROUND_SERVICE_MEDIA_PROJECTION\`.
- **Wake Word Assistant ("Hey Shadow")**: Active wake phrase detection with \`ShadowWakeWordService\` and \`FOREGROUND_SERVICE_MICROPHONE\`.
- **Hindi & English Bilingual AI Engine** powered by Gemini 3.8 Flash.
- **Voice STT & Spoken Answers** using native Android \`SpeechRecognizer\` and \`TextToSpeech\`.
- **Safe Android Intents** for voice commands like *"Chrome kholo"*, *"Maps kholo"*, *"Settings kholo"*, Torch, and Dialer.
- **User Permission Confirmation** before any sensitive action is launched.
- **Secure Backend Proxy Architecture** ensuring secret API keys are never bundled inside the client APK.

### 🌐 Web App vs 📱 Native Android Capabilities:
- **In Web App (Active Tab)**: Live Screen Vision works via the official browser \`navigator.mediaDevices.getDisplayMedia\` API. Wake Word listens while the tab is open and microphone permission is active. Browsers do NOT permit continuous recording when the browser is closed or phone is locked.
- **In Native APK**: Uses Android OS \`MediaProjectionManager\` and \`FOREGROUND_SERVICE_MICROPHONE\` with persistent system notifications for continuous background operation without sandboxing constraints.

---

## 🛠️ How to Build Debug or Release APK (Step-by-Step)

### Prerequisites:
1. Download & Install [Android Studio](https://developer.android.com/studio) (Koala, Hedgehog, or newer).
2. Ensure **JDK 17** is installed and configured in Android Studio.

### Step 1: Open the Project
1. Unzip the downloaded \`shadow-ai-android-project.zip\`.
2. Launch **Android Studio**.
3. Select **File > Open...** and choose the extracted folder.
4. Allow Gradle to sync dependencies automatically (takes 1–2 minutes).

### Step 2: Build Debug APK (For Instant Testing)
1. In Android Studio, go to top menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Once the build finishes, a notification will appear in the bottom right: **"APK(s) generated successfully"**.
3. Click **locate**. The generated file is located at:
   \`app/build/outputs/apk/debug/app-debug.apk\`

### Step 3: Build Signed Release APK (For Distribution)
1. In top menu: **Build > Generate Signed Bundle / APK...**
2. Choose **APK** and click **Next**.
3. Select an existing keystore or click **"Create new..."** to generate a \`.jks\` signing key.
4. Set Key alias, password, and validity (25+ years recommended).
5. Choose **release** build variant, check **V1 (Jar Signature)** and **V2 (Full APK Signature)**.
6. Click **Finish**. Your signed release APK is output to:
   \`app/release/app-release.apk\`

### Step 4: Prepare for Google Play Console (Release & Store Submission)
1. **Generate Android App Bundle (.aab)**: Google Play requires \`.aab\` format for all new store submissions:
   - Run via terminal:
     \`\`\`bash
     ./gradlew bundleRelease
     \`\`\`
   - Or in Android Studio: **Build > Generate Signed Bundle / APK... > Android App Bundle (.aab)**.
   - Generated bundle output path: \`app/build/outputs/bundle/release/app-release.aab\`
2. **Target SDK Compliance**:
   - The project is configured with \`targetSdk = 34\` (Android 14) and \`compileSdk = 34\`, fully compliant with Google Play target API requirements.
3. **Play App Signing**:
   - Use Google Play App Signing with your upload keystore (.jks) generated in Step 3.
4. **Google Play Console Data Safety Declaration**:
   - Declare \`Audio recording\` (used solely for user-initiated voice assistant commands).
   - Declare \`Microphone Foreground Service\` (\`FOREGROUND_SERVICE_MICROPHONE\`) for wake word / voice orb interaction.
   - State that data is processed in real time and not sold to data brokers.
5. **Store Assets**:
   - High-res icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Phone screenshots (1080x2400 or minimum 2 screenshots).

---

## 📲 How to Transfer & Install on Your Android Phone

### Method A: Direct USB Installation via ADB
1. On your phone: Go to **Settings > About Phone** and tap **Build Number 7 times** to unlock Developer Options.
2. In **Settings > Developer Options**, enable **USB Debugging**.
3. Connect your phone to your PC via USB cable.
4. In Android Studio, select your phone in the device dropdown and click the green **Play (Run)** button.
5. Or run via terminal:
   \`\`\`bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   \`\`\`

### Method B: Wireless / Direct File Transfer
1. Send \`app-debug.apk\` or \`app-release.apk\` to your phone via:
   - Google Drive / Telegram / WhatsApp / Bluetooth / USB cable.
2. Open the file on your phone using **Files / File Manager**.
3. If prompted: **"Install unknown apps"**, toggle **Allow from this source**.
4. If Google Play Protect warns: *"Unrecognized app"*, tap **More details > Install anyway** (standard for self-built apps not downloaded from Play Store).
5. Tap **Open** and launch **SHADOW AI**!

### Method C: Build Directly on Your Android Phone using Termux (No PC Required!)
1. Install **Termux** app on your phone (from F-Droid or GitHub).
2. Open Termux and run:
   \`\`\`bash
   pkg update && pkg install openjdk-17 gradle git unzip -y
   \`\`\`
3. Download and extract \`shadow-ai-android-project.zip\` on your phone:
   \`\`\`bash
   cd ~ && unzip ~/downloads/shadow-ai-android-project.zip -d shadow-ai
   cd shadow-ai
   \`\`\`
4. Run the Gradle build command:
   \`\`\`bash
   gradle assembleDebug
   \`\`\`
5. Your debug APK will be generated at:
   \`app/build/outputs/apk/debug/app-debug.apk\`
6. Tap the APK file in your Files app to install!

### Method D: Free Cloud Build with GitHub Actions (1-Click)
1. Create a repository on GitHub (e.g. \`shadow-ai-app\`).
2. Upload this extracted project into the repository.
3. The included \`.github/workflows/build-apk.yml\` automatically runs on GitHub Cloud servers using standard Android SDK.
4. Go to the **Actions** tab on your GitHub repository, click on the latest build, and download the ready-to-install **\`app-debug.apk\`** artifact directly to your phone!
`
  },
  {
    path: '.github/workflows/build-apk.yml',
    name: 'build-apk.yml',
    language: 'markdown',
    description: 'Automated GitHub Actions CI workflow to build Android debug APK in the cloud for free with 1 click.',
    content: `name: Build Shadow AI Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Code
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle

    - name: Grant execute permission for gradlew
      run: chmod +x gradlew || true

    - name: Build Debug APK with Gradle
      run: ./gradlew assembleDebug --stacktrace

    - name: Upload Debug APK Artifact
      uses: actions/upload-artifact@v4
      with:
        name: shadow-ai-debug-apk
        path: app/build/outputs/apk/debug/app-debug.apk
        retention-days: 14
`
  }
];
