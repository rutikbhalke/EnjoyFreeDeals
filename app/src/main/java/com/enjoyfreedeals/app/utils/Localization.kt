package com.enjoyfreedeals.app.utils

import androidx.compose.runtime.staticCompositionLocalOf

data class AppLanguage(
    val code: String,
    val displayName: String,
    val nativeName: String
)

data class AppStrings(
    val home: String,
    val allDeals: String,
    val category: String,
    val blog: String,
    val profile: String,
    val viewDeal: String,
    val viewDetails: String,
    val saveDeal: String,
    val shareDeal: String,
    val settings: String,
    val language: String,
    val priceComparison: String,
    val bestPrice: String,
    val searchHint: String
)

object Localization {
    val supportedLanguages = listOf(
        AppLanguage("en", "English", "English"),
        AppLanguage("hi", "Hindi", "हिन्दी"),
        AppLanguage("mr", "Marathi", "मराठी"),
        AppLanguage("gu", "Gujarati", "ગુજરાતી"),
        AppLanguage("ta", "Tamil", "தமிழ்"),
        AppLanguage("te", "Telugu", "తెలుగు"),
        AppLanguage("kn", "Kannada", "ಕನ್ನಡ"),
        AppLanguage("bn", "Bengali", "বাংলা")
    )

    fun stringsFor(code: String): AppStrings = when (code) {
        "hi" -> AppStrings("होम", "सभी डील्स", "कैटेगरी", "ब्लॉग", "प्रोफाइल", "डील देखें", "विवरण देखें", "सेव करें", "शेयर करें", "सेटिंग्स", "भाषा", "कीमत तुलना", "सबसे अच्छी कीमत", "डील्स, स्टोर, कूपन खोजें...")
        "mr" -> AppStrings("होम", "सर्व डील्स", "कॅटेगरी", "ब्लॉग", "प्रोफाइल", "डील पहा", "तपशील पहा", "सेव्ह करा", "शेअर करा", "सेटिंग्स", "भाषा", "किंमत तुलना", "सर्वोत्तम किंमत", "डील्स, स्टोअर्स, कूपन शोधा...")
        "gu" -> AppStrings("હોમ", "બધી ડીલ્સ", "કેટેગરી", "બ્લોગ", "પ્રોફાઇલ", "ડીલ જુઓ", "વિગતો જુઓ", "સેવ કરો", "શેર કરો", "સેટિંગ્સ", "ભાષા", "ભાવ સરખામણી", "શ્રેષ્ઠ ભાવ", "ડીલ્સ, સ્ટોર, કૂપન શોધો...")
        "ta" -> AppStrings("முகப்பு", "அனைத்து டீல்கள்", "வகை", "வலைப்பதிவு", "சுயவிவரம்", "டீலை காண்க", "விவரங்கள்", "சேமி", "பகிர்", "அமைப்புகள்", "மொழி", "விலை ஒப்பீடு", "சிறந்த விலை", "டீல்கள், கடைகள், கூப்பன்கள் தேடுங்கள்...")
        "te" -> AppStrings("హోమ్", "అన్ని డీల్స్", "కేటగిరీ", "బ్లాగ్", "ప్రొఫైల్", "డీల్ చూడండి", "వివరాలు", "సేవ్", "షేర్", "సెట్టింగ్స్", "భాష", "ధర పోలిక", "ఉత్తమ ధర", "డీల్స్, స్టోర్లు, కూపన్లు వెతకండి...")
        "kn" -> AppStrings("ಮುಖಪುಟ", "ಎಲ್ಲಾ ಡೀಲುಗಳು", "ವರ್ಗ", "ಬ್ಲಾಗ್", "ಪ್ರೊಫೈಲ್", "ಡೀಲ್ ನೋಡಿ", "ವಿವರಗಳು", "ಉಳಿಸಿ", "ಹಂಚಿ", "ಸೆಟ್ಟಿಂಗ್ಸ್", "ಭಾಷೆ", "ಬೆಲೆ ಹೋಲಿಕೆ", "ಉತ್ತಮ ಬೆಲೆ", "ಡೀಲ್, ಸ್ಟೋರ್, ಕೂಪನ್ ಹುಡುಕಿ...")
        "bn" -> AppStrings("হোম", "সব ডিল", "ক্যাটেগরি", "ব্লগ", "প্রোফাইল", "ডিল দেখুন", "বিস্তারিত", "সেভ করুন", "শেয়ার করুন", "সেটিংস", "ভাষা", "দামের তুলনা", "সেরা দাম", "ডিল, স্টোর, কুপন খুঁজুন...")
        else -> AppStrings("Home", "All Deals", "Category", "Blog", "Profile", "View Deal", "View Details", "Save Deal", "Share Deal", "Settings", "Language", "Price Comparison", "Best Price", "Search deals, stores, coupons...")
    }
}

val LocalAppStrings = staticCompositionLocalOf { Localization.stringsFor("en") }
