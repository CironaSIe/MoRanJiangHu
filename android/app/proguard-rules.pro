# Capacitor WebView 混合应用 ProGuard 规则

# 保留 Capacitor 核心桥接类
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }

# 保留自定义 Capacitor 插件（JavascriptInterface 注解的方法必须保留）
-keep class com.moranjianghu.game.** { *; }
-keepclassmembers class com.moranjianghu.game.** {
    @com.getcapacitor.annotation.CapacitorPlugin *;
    @com.getcapacitor.annotation.PluginMethod *;
    @android.webkit.JavascriptInterface *;
}

# 保留 Capacitor 注解
-keep @com.getcapacitor.annotation.** class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.** <methods>;
}

# 保留 WebView JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 保留 AndroidX 核心类
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# 保留 Cordova 兼容层
-keep class org.apache.cordova.** { *; }

# 保留源文件行号信息（方便崩溃排查）
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# 通用优化设置
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose
