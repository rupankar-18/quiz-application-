/**
 * Curated high-quality multilingual question banks for supported languages.
 * Provides immediate, offline-ready questions in native scripts.
 */

export const MULTILINGUAL_QUESTIONS = {
  // =========================================================================
  // BENGALI (বাংলা)
  // =========================================================================
  bn: [
    // Science
    {
      category: "Science",
      question: "আমাদের সৌরজগতের কোন গ্রহকে 'লাল গ্রহ' বলা হয়?",
      options: ["শুক্র", "মঙ্গল", "বৃহস্পতি", "শনি"],
      answer: 1,
      explanation: "মঙ্গলের পৃষ্ঠে প্রচুর আয়রন অক্সাইড বা মরচে থাকার কারণে একে লাল দেখায়।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Science",
      question: "জীবদেহের কোষের শক্তিঘর (Powerhouse of the Cell) কাকে বলা হয়?",
      options: ["নিউক্লিয়াস", "রাইবোজোম", "মাইটোকন্ড্রিয়া", "গলগি বডি"],
      answer: 2,
      explanation: "মাইটোকন্ড্রিয়া কোষের প্রয়োজনীয় সমস্ত রাসায়নিক শক্তি (ATP) উৎপাদন করে।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Science",
      question: "বাতাসে কোন গ্যাসের পরিমাণ সবচেয়ে বেশি (প্রায় ৭৮%)?",
      options: ["অক্সিজেন", "কার্বন ডাই অক্সাইড", "নাইট্রোজেন", "হাইড্রোজেন"],
      answer: 2,
      explanation: "বায়ুমণ্ডলে প্রায় ৭৮% নাইট্রোজেন এবং ২১% অক্সিজেন থাকে।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Science",
      question: "স্বর্ণের রাসায়নিক প্রতীক কোনটি?",
      options: ["Ag", "Fe", "Au", "Pt"],
      answer: 2,
      explanation: "স্বর্ণের রাসায়নিক প্রতীক Au, যা ল্যাটিন শব্দ 'Aurum' থেকে এসেছে।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Science",
      question: "মানবদেহে রক্তে শর্করার মাত্রা নিয়ন্ত্রণকারী ইনসুলিন কোন অঙ্গ থেকে নিঃসৃত হয়?",
      options: ["যকৃৎ (Liver)", "অগ্ন্যাশয় (Pancreas)", "বৃক্ক (Kidney)", "হৃদপিণ্ড"],
      answer: 1,
      explanation: "অগ্ন্যাশয়ের আইলেটস অব ল্যাঙ্গারহ্যান্স থেকে ইনসুলিন হরমোন নিঃসৃত হয়।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Science",
      question: "স্বাভাবিক তাপমাত্রায় তরল থাকে এমন একমাত্র ধাতু কোনটি?",
      options: ["পারদ (Mercury)", "সিসা", "টিন", "তামা"],
      answer: 0,
      explanation: "পারদ কক্ষ তাপমাত্রায় তরল অবস্থায় থাকা একমাত্র ধাতু।",
      source: "বাংলা কুইজ ব্যাংক"
    },

    // Tech
    {
      category: "Tech",
      question: "HTML এর পূর্ণরূপ কী?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Mode Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML এর পূর্ণরূপ হলো Hyper Text Markup Language, যা ওয়েব পেজের ভিত্তি।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Tech",
      question: "১৯৮৯ সালে ওয়ার্ল্ড ওয়াইড ওয়েব (WWW) কে আবিষ্কার করেন?",
      options: ["বিল গেটস", "টিম বার্নার্স-লি", "স্টিভ জবস", "এলন মাস্ক"],
      answer: 1,
      explanation: "স্যার টিম বার্নার্স-লি সার্ন (CERN)-এ গবেষণার সময় WWW আবিষ্কার করেন।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Tech",
      question: "কম্পিউটারের মস্তিষ্ক হিসেবে কোন অংশটিকে বিবেচনা করা হয়?",
      options: ["RAM", "হার্ড ডিস্ক", "CPU", "মাদারবোর্ড"],
      answer: 2,
      explanation: "CPU (Central Processing Unit) কম্পিউটারের যাবতীয় গাণিতিক ও যৌক্তিক প্রক্রিয়া সম্পাদন করে।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Tech",
      question: "কোন প্রোগ্রামিং ল্যাঙ্গুয়েজ সাধারণত ব্রাউজারে ইন্টারেক্টিভ ওয়েব অ্যাপ্লিকেশন তৈরিতে ব্যবহৃত হয়?",
      options: ["C++", "জাভাস্ক্রিপ্ট (JavaScript)", "ফোরট্রান", "কোবল"],
      answer: 1,
      explanation: "জাভাস্ক্রিপ্ট আধুনিক ব্রাউজারের সবচেয়ে প্রভাবশালী স্ক্রিপ্টিং ভাষা।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Tech",
      question: "পাইথন (Python) প্রোগ্রামিং ভাষার স্রষ্টা কে?",
      options: ["গুইডো ভ্যান রসাম", "ডেনিস রিচি", "জেমস গসলিং", "বিয়ার্নে স্ট্রাউস্ট্রুপ"],
      answer: 0,
      explanation: "গুইডো ভ্যান রসাম ১৯৯১ সালে পাইথন প্রোগ্রামিং ভাষা উদ্ভাবন করেন।",
      source: "বাংলা কুইজ ব্যাংক"
    },

    // Math
    {
      category: "Math",
      question: "একমাত্র জোড় মৌলিক সংখ্যা (Even Prime Number) কোনটি?",
      options: ["০", "১", "২", "৪"],
      answer: 2,
      explanation: "২ হলো একমাত্র সংখ্যা যা একই সাথে জোড় এবং মৌলিক।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Math",
      question: "১৪৪ এর বর্গমূল কত?",
      options: ["১০", "১২", "১৪", "১৬"],
      answer: 1,
      explanation: "১২ × ১২ = ১৪৪, সুতরাং ১৪৪ এর বর্গমূল হলো ১২।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Math",
      question: "একটি ত্রিভুজের তিনটি কোণের সমষ্টি কত ডিগ্রি?",
      options: ["৯০°", "১২০°", "১৮০°", "৩৬০°"],
      answer: 2,
      explanation: "যেকোনো ইউক্লিডীয় সমতল ত্রিভুজের তিন কোণের সমষ্টি ১৮০ ডিগ্রি।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Math",
      question: "২০০ টাকার ১৫% কত টাকা?",
      options: ["২০ টাকা", "২৫ টাকা", "৩০ টাকা", "৩৫ টাকা"],
      answer: 2,
      explanation: "(১৫ / ১০০) × ২০০ = ৩০ টাকা।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Math",
      question: "বৃত্তের ক্ষেত্রফল নির্ণয়ের সঠিক সূত্র কোনটি?",
      options: ["২πr", "πr²", "৪πr²", "πd"],
      answer: 1,
      explanation: "ব্যাসার্ধ r হলে বৃত্তের ক্ষেত্রফল হলো πr²।",
      source: "বাংলা কুইজ ব্যাংক"
    },

    // History
    {
      category: "History",
      question: "দ্বিতীয় বিশ্বযুদ্ধ কোন সালে আনুষ্ঠানিকভাবে সমাপ্ত হয়?",
      options: ["১৯৩৯", "১৯৪৩", "১৯৪৫", "১৯৫০"],
      answer: 2,
      explanation: "১৯৪৫ সালে অক্ষশক্তির আত্মসমর্পণের মাধ্যমে দ্বিতীয় বিশ্বযুদ্ধ সমাপ্ত হয়।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "History",
      question: "প্রাচীন ইনকা সভ্যতার বিখ্যাত শহর মাচু পিচু কোন দেশে অবস্থিত?",
      options: ["মেক্সিকো", "পেরু", "মিশর", "ব্রাজিল"],
      answer: 1,
      explanation: "মাচু পিচু পেরুর আন্দিজ পর্বতমালার উঁচুতে অবস্থিত পঞ্চদশ শতাব্দীর ইনকা নিদর্শন।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "History",
      question: "১৯৬৯ সালে কোন মহাকাশ অভিযানে মানুষ প্রথম চাঁদে অবতরণ করে?",
      options: ["অ্যাপোলো ৮", "অ্যাপোলো ১১", "ভোস্টক ১", "মিশন মার্স"],
      answer: 1,
      explanation: "অ্যাপোলো ১১ অভিযানে নীল আর্মস্ট্রং এবং বাজ অলড্রিন চাঁদের মাটিতে পা রাখেন।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "History",
      question: "দক্ষিণ আফ্রিকার বর্ণবাদ বিরোধী মহান নেতা নেলসন ম্যান্ডেলা কত বছর কারাবন্দী ছিলেন?",
      options: ["১০ বছর", "১৮ বছর", "২৭ বছর", "৩৫ বছর"],
      answer: 2,
      explanation: "নেলসন ম্যান্ডেলা টানা ২৭ বছর কারাভোগের পর ১৯৯০ সালে মুক্তি লাভ করেন।",
      source: "বাংলা কুইজ ব্যাংক"
    },

    // Geography
    {
      category: "Geography",
      question: "পৃথিবীর বৃহত্তম মহাসাগর কোনটি?",
      options: ["আটলান্টিক মহাসাগর", "ভারত মহাসাগর", "প্রশান্ত মহাসাগর (Pacific)", "উত্তর মহাসাগর"],
      answer: 2,
      explanation: "প্রশান্ত মহাসাগর পৃথিবীর পৃষ্ঠের এক-তৃতীয়াংশের বেশি জুড়ে বিস্তৃত।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Geography",
      question: "বিশ্বের দীর্ঘতম নদী কোনটি?",
      options: ["আমাজন", "নীলনদ (Nile)", "ইয়াংসিকিয়াং", "মিসিসিপি"],
      answer: 1,
      explanation: "আফ্রিকা মহাদেশের নীলনদ প্রায় ৬,৬৫০ কিলোমিটার দীর্ঘ।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Geography",
      question: "জাপানের রাজধানী শহরের নাম কী?",
      options: ["কিয়োটো", "ওসাকা", "টোকিও (Tokyo)", "হিরোশিমা"],
      answer: 2,
      explanation: "টোকিও হলো জাপানের রাজধানী এবং বিশ্বের অন্যতম প্রধান অর্থনৈতিক কেন্দ্র।",
      source: "বাংলা কুইজ ব্যাংক"
    },

    // Sports
    {
      category: "Sports",
      question: "ফিফা বিশ্বকাপ কত বছর পর পর অনুষ্ঠিত হয়?",
      options: ["২ বছর", "৩ বছর", "৪ বছর", "৫ বছর"],
      answer: 2,
      explanation: "ফিফা ফুটবল বিশ্বকাপ প্রতি চার বছর পর পর বিশ্বমঞ্চে আয়োজিত হয়।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Sports",
      question: "অলিম্পিক পতাকায় কয়টি রঙিন বলয় (Rings) থাকে?",
      options: ["৪টি", "৫টি", "৬টি", "৭টি"],
      answer: 1,
      explanation: "অলিম্পিক পতাকায় ৫টি মহাদেশের ঐক্যের প্রতীক হিসেবে ৫টি বলয় থাকে।",
      source: "বাংলা কুইজ ব্যাংক"
    },
    {
      category: "Sports",
      question: "ক্রিকেটে একজন বোলার এক ওভারে সর্বোচ্চ কতটি বৈধ বল করতে পারেন?",
      options: ["৪টি", "৫টি", "৬টি", "৮টি"],
      answer: 2,
      explanation: "আন্তর্জাতিক ক্রিকেটের নিয়ম অনুযায়ী এক ওভারে ৬টি বৈধ বল থাকে।",
      source: "বাংলা কুইজ ব্যাংক"
    }
  ],

  // =========================================================================
  // HINDI (हिन्दी)
  // =========================================================================
  hi: [
    // Science
    {
      category: "Science",
      question: "हमारे सौरमंडल में किस ग्रह को 'लाल ग्रह' कहा जाता है?",
      options: ["शुक्र", "मंगल", "बृहस्पति", "शनि"],
      answer: 1,
      explanation: "मंगल ग्रह की सतह पर आयरन ऑक्साइड (जंग) की अधिकता के कारण यह लाल दिखता है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Science",
      question: "मानव कोशिका का 'ऊर्जा गृह' (Powerhouse of the Cell) किसे कहा जाता है?",
      options: ["नाभिक (Nucleus)", "राइबोसोम", "माइटोकॉन्ड्रिया", "लाइसोसोम"],
      answer: 2,
      explanation: "माइटोकॉन्ड्रिया कोशिका के लिए रासायनिक ऊर्जा (ATP) उत्पन्न करता है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Science",
      question: "पृथ्वी के वायुमंडल में सबसे प्रचुर मात्रा में (लगभग 78%) कौन सी गैस पाई जाती है?",
      options: ["ऑक्सीजन", "कार्बन डाइऑक्साइड", "नाइट्रोजन", "हाइड्रोजन"],
      answer: 2,
      explanation: "वायुमंडल में 78% नाइट्रोजन तथा लगभग 21% ऑक्सीजन होती है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Science",
      question: "सोने (Gold) का रासायनिक प्रतीक क्या है?",
      options: ["Ag", "Fe", "Au", "Gd"],
      answer: 2,
      explanation: "Au लैटिन शब्द 'Aurum' से लिया गया है जिसका अर्थ सोना होता है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Science",
      question: "सामान्य कमरे के तापमान पर तरल अवस्था में रहने वाली एकमात्र धातु कौन सी है?",
      options: ["पारा (Mercury)", "सीसा", "लोहा", "तांबा"],
      answer: 0,
      explanation: "पारा (मरकरी) कमरे के तापमान पर द्रव अवस्था में रहता है।",
      source: "हिन्दी क्विज़ बैंक"
    },

    // Tech
    {
      category: "Tech",
      question: "HTML का पूर्ण रूप (Full Form) क्या है?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML वेब पृष्ठों की संरचना तैयार करने के लिए मानक मार्कअप भाषा है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Tech",
      question: "कंप्यूटर का मस्तिष्क किसे कहा जाता है?",
      options: ["RAM", "मॉनिटर", "CPU", "हार्ड डिस्क"],
      answer: 2,
      explanation: "CPU (Central Processing Unit) कंप्यूटर की समस्त गणनाओं और प्रक्रियाओं को नियंत्रित करता है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Tech",
      question: "1989 में वर्ल्ड वाइड वेब (WWW) का आविष्कार किसने किया था?",
      options: ["बिल गेट्स", "टिम बर्नर्स-ली", "स्टीव जॉब्स", "मार्क जुकरबर्ग"],
      answer: 1,
      explanation: "सर टिम बर्नर्स-ली ने सर्न (CERN) में शोध के दौरान वर्ल्ड वाइड वेब का आविष्कार किया।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Tech",
      question: "पायथन (Python) प्रोग्रामिंग भाषा का आविष्कार किसने किया था?",
      options: ["गाइडो वैन रोसुम", "डेनिस रिची", "जेम्स गोसलिंग", "केन थॉम्पसन"],
      answer: 0,
      explanation: "गाइडो वैन रोसुम ने 1991 में पायथन भाषा को जारी किया था।",
      source: "हिन्दी क्विज़ बैंक"
    },

    // Math
    {
      category: "Math",
      question: "एकमात्र सम अभाज्य संख्या (Even Prime Number) कौन सी है?",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "2 एकमात्र ऐसी संख्या है जो सम भी है और अभाज्य भी।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Math",
      question: "144 का वर्गमूल (Square Root) क्या है?",
      options: ["10", "12", "14", "16"],
      answer: 1,
      explanation: "12 × 12 = 144 होता है, अतः 144 का वर्गमूल 12 है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Math",
      question: "एक वृत्त के क्षेत्रफल का सही गणितीय सूत्र क्या है?",
      options: ["2πr", "πr²", "4πr²", "πd"],
      answer: 1,
      explanation: "वृत्त का क्षेत्रफल πr² द्वारा ज्ञात किया जाता है जहाँ r त्रिज्या है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Math",
      question: "200 का 15% कितना होगा?",
      options: ["20", "25", "30", "35"],
      answer: 2,
      explanation: "(15 / 100) × 200 = 30.",
      source: "हिन्दी क्विज़ बैंक"
    },

    // History
    {
      category: "History",
      question: "द्वितीय विश्व युद्ध किस वर्ष में समाप्त हुआ था?",
      options: ["1942", "1945", "1947", "1950"],
      answer: 1,
      explanation: "द्वितीय विश्व युद्ध 1945 में धुरी राष्ट्रों के आत्मसमर्पण के बाद समाप्त हुआ था।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "History",
      question: "1969 में चंद्रमा पर कदम रखने वाले पहले अंतरिक्ष यात्री कौन थे?",
      options: ["यूरी गागरिन", "नील आर्मस्ट्रांग", "बज एल्ड्रिन", "माइकल कोलिन्स"],
      answer: 1,
      explanation: "अपोलो 11 मिशन के तहत नील आर्मस्ट्रांग ने सबसे पहले चंद्रमा पर कदम रखा था।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "History",
      question: "प्राचीन इंका सभ्यता का प्रसिद्ध ऐतिहासिक स्थल 'माचू पिच्चू' किस देश में स्थित है?",
      options: ["मेक्सिको", "पेरू", "चिली", "अर्जेंटीना"],
      answer: 1,
      explanation: "माचू पिच्चू पेरू के एंडीज पर्वतमाला में स्थित पंद्रहवीं शताब्दी का इंका स्थल है।",
      source: "हिन्दी क्विज़ बैंक"
    },

    // Geography & Sports
    {
      category: "Geography",
      question: "विश्व का सबसे बड़ा महासागर कौन सा है?",
      options: ["अटलांटिक महासागर", "हिंद महासागर", "प्रशांत महासागर (Pacific)", "आर्कटिक महासागर"],
      answer: 2,
      explanation: "प्रशांत महासागर पृथ्वी का सबसे बड़ा तथा सबसे गहरा महासागर है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Geography",
      question: "जापान की राजधानी कौन सा शहर है?",
      options: ["क्योटो", "ओसाका", "टोक्यो", "हिरोशिमा"],
      answer: 2,
      explanation: "टोक्यो जापान की राजधानी और विश्व का सबसे बड़ा महानगरीय क्षेत्र है।",
      source: "हिन्दी क्विज़ बैंक"
    },
    {
      category: "Sports",
      question: "ओलंपिक ध्वज में कितने रंगीन छल्ले (Rings) होते हैं?",
      options: ["4", "5", "6", "7"],
      answer: 1,
      explanation: "ओलंपिक ध्वज के 5 छल्ले दुनिया के पांच प्रमुख महाद्वीपों की एकता का प्रतीक हैं।",
      source: "हिन्दी क्विज़ बैंक"
    }
  ],

  // =========================================================================
  // TAMIL (தமிழ்)
  // =========================================================================
  ta: [
    {
      category: "Science",
      question: "நமது சூரிய மண்டலத்தில் 'சிவப்பு கிரகம்' என்று அழைக்கப்படும் கிரகம் எது?",
      options: ["வெள்ளி (Venus)", "செவ்வாய் (Mars)", "வியாழன் (Jupiter)", "சனி (Saturn)"],
      answer: 1,
      explanation: "செவ்வாய் கிரகத்தின் மேற்பரப்பில் இரும்பு ஆக்சைடு அதிகம் இருப்பதால் அது சிவப்பு நிறமாக காட்சியளிக்கிறது.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Science",
      question: "மனித செல்லின் 'ஆற்றல் மையம்' (Powerhouse of the Cell) என்று அழைக்கப்படுவது எது?",
      options: ["நியூக்ளியஸ்", "ரைபோசோம்", "மைட்டோகாண்ட்ரியா", "சைட்டோபிளாசம்"],
      answer: 2,
      explanation: "மைட்டோகாண்ட்ரியா செல்லுக்குத் தேவையான ஏடிபி (ATP) ஆற்றலை உற்பத்தி செய்கிறது.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Science",
      question: "பூமியின் வளிமண்டலத்தில் மிக அதிகமாகக் காணப்படும் வாயு (சுமார் 78%) எது?",
      options: ["ஆக்சிஜன்", "கார்பன் டை ஆக்சைடு", "நைட்ரஜன்", "ஹைட்ரஜன்"],
      answer: 2,
      explanation: "வளிமண்டலத்தில் 78% நைட்ரஜனும், 21% ஆக்சிஜனும் உள்ளன.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Tech",
      question: "HTML இன் முழு வடிவம் என்ன?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML என்பது Hyper Text Markup Language என்பதன் சுருக்கமாகும்.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Tech",
      question: "கணினியின் மூளையாகக் கருதப்படும் பகுதி எது?",
      options: ["RAM", "ஹார்ட் டிஸ்க்", "CPU", "மதர்போர்டு"],
      answer: 2,
      explanation: "CPU (Central Processing Unit) அனைத்து கணக்கீடுகளையும் அறிவுறுத்தல்களையும் இயக்குகிறது.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Math",
      question: "ஒரே ஒரு இரட்டைப் பகா எண் (Even Prime Number) எது?",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "2 மட்டுமே ஒரே இரட்டைப் பகா எண் ஆகும்.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Math",
      question: "144 இன் வர்க்கமூலம் (Square Root) என்ன?",
      options: ["10", "12", "14", "16"],
      answer: 1,
      explanation: "12 × 12 = 144 ஆகும்.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "History",
      question: "இரண்டாம் உலகப் போர் எந்த ஆண்டு முடிவுக்கு வந்தது?",
      options: ["1939", "1942", "1945", "1950"],
      answer: 2,
      explanation: "இரண்டாம் உலகப் போர் 1945 இல் முடிவுக்கு வந்தது.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Geography",
      question: "உலகின் மிகப்பெரிய பெருங்கடல் எது?",
      options: ["அட்லாண்டிக் பெருங்கடல்", "இந்தியப் பெருங்கடல்", "பசிபிக் பெருங்கடல்", "ஆர்க்டிக் பெருங்கடல்"],
      answer: 2,
      explanation: "பசிபிக் பெருங்கடல் உலகின் மிகப்பெரிய மற்றும் ஆழமான பெருங்கடலாகும்.",
      source: "தமிழ் வினாடி வினா"
    },
    {
      category: "Sports",
      question: "ஒலிம்பிக் கொடியில் எத்தனை வண்ண வளையங்கள் உள்ளன?",
      options: ["4", "5", "6", "7"],
      answer: 1,
      explanation: "ஒலிம்பிக் கொடியில் 5 கண்டங்களைக் குறிக்கும் 5 வளையங்கள் உள்ளன.",
      source: "தமிழ் வினாடி வினா"
    }
  ],

  // =========================================================================
  // URDU (اردو)
  // =========================================================================
  ur: [
    {
      category: "Science",
      question: "ہمارے نظام شمسی میں کس سیارے کو 'سرخ سیارہ' (Red Planet) کہا جاتا ہے؟",
      options: ["زہرہ (Venus)", "مریخ (Mars)", "مشتری (Jupiter)", "زحل (Saturn)"],
      answer: 1,
      explanation: "مریخ کی سطح پر آئرن آکسائیڈ کی کثرت کی وجہ سے یہ سرخ دکھائی دیتا ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Science",
      question: "انسانی خلیے کا 'پاور ہاؤس' (Powerhouse of the Cell) کسے کہا جاتا ہے؟",
      options: ["نیوکلیئس", "رائیبوزوم", "مائٹوکونڈریا", "لائسوسوم"],
      answer: 2,
      explanation: "مائٹوکونڈریا خلیے کے لیے درکار کیمیائی توانائی (ATP) پیدا کرتا ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Science",
      question: "زمین کے کرۂ ہوائی میں سب سے زیادہ مقدار (تقریباً 78٪) میں کون سی گیس پائی جاتی ہے؟",
      options: ["آکسیجن", "کاربن ڈائی آکسائیڈ", "نائٹروجن", "ہائیڈروجن"],
      answer: 2,
      explanation: "کرۂ ہوائی میں تقریباً 78 فیصد نائٹروجن اور 21 فیصد آکسیجن موجود ہوتی ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Tech",
      question: "HTML کا مکمل مخفف کیا ہے؟",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML کا مطلب Hyper Text Markup Language ہے، جو ویب صفحات کا بنیادی ڈھانچہ بناتی ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Tech",
      question: "کمپیوٹر کا دماغ کس حصے کو مانا جاتا ہے؟",
      options: ["RAM", "ہارڈ ڈسک", "CPU", "مدر بورڈ"],
      answer: 2,
      explanation: "CPU (سینٹرل پروسیسنگ یونٹ) کمپیوٹر کے تمام حسابی اور منطقی افعال کو سرانجام دیتا ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Math",
      question: "اکلوتا جفت مفرد عدد (Even Prime Number) کون سا ہے؟",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "2 واحد ایسا عدد ہے جو جفت بھی ہے اور مفرد (پرائم) بھی۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Math",
      question: "144 کا جذر المربع (Square Root) کیا ہے؟",
      options: ["10", "12", "14", "16"],
      answer: 1,
      explanation: "12 کو 12 سے ضرب دینے پر 144 حاصل ہوتا ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "History",
      question: "دوسری جنگ عظیم کس سال باقاعدہ ختم ہوئی تھی؟",
      options: ["1939", "1942", "1945", "1950"],
      answer: 2,
      explanation: "دوسری جنگ عظیم 1945 میں اتحادیوں کی فتح پر اختتام پذیر ہوئی۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Geography",
      question: "دنیا کا سب سے بڑا سمندر (Ocean) کون سا ہے؟",
      options: ["بحر اوقیانوس (Atlantic)", "بحر ہند (Indian)", "بحر الکاہل (Pacific)", "بحر منجمد شمالی"],
      answer: 2,
      explanation: "بحر الکاہل (Pacific Ocean) روئے زمین کا سب سے وسیع اور گہرا سمندر ہے۔",
      source: "اردو کوئز بینک"
    },
    {
      category: "Sports",
      question: "اولمپک پرچم پر کتنے رنگ برنگے دائرے (Rings) بنے ہوتے ہیں؟",
      options: ["4", "5", "6", "7"],
      answer: 1,
      explanation: "اولمپک جھنڈے کے پانچ دائرے پانچ آباد براعظموں کے اتحاد کی علامت ہیں۔",
      source: "اردو کوئز بینک"
    }
  ],

  // =========================================================================
  // JAPANESE (日本語)
  // =========================================================================
  ja: [
    {
      category: "Science",
      question: "太陽系で「赤い惑星」として知られている惑星はどれですか？",
      options: ["金星 (Venus)", "火星 (Mars)", "木星 (Jupiter)", "土星 (Saturn)"],
      answer: 1,
      explanation: "火星の地表には酸化鉄（赤さび）が豊富に含まれているため、赤く見えます。",
      source: "日本語クイズバンク"
    },
    {
      category: "Science",
      question: "細胞内で「エネルギーの発電所」と呼ばれる細胞小器官は何ですか？",
      options: ["核 (Nucleus)", "リボソーム", "ミトコンドリア", "ゴルジ体"],
      answer: 2,
      explanation: "ミトコンドリアは生物の生命活動に必要なATP（エネルギー）を産生します。",
      source: "日本語クイズバンク"
    },
    {
      category: "Science",
      question: "地球の大気中で最も高い割合（約78%）を占める気体は何ですか？",
      options: ["酸素", "二酸化炭素", "窒素 (Nitrogen)", "アルゴン"],
      answer: 2,
      explanation: "大気は約78%の窒素と約21%の酸素で構成されています。",
      source: "日本語クイズバンク"
    },
    {
      category: "Tech",
      question: "Webサイトの骨組みを作る標準規格「HTML」の正式名称は何ですか？",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTMLは Hyper Text Markup Language の略称です。",
      source: "日本語クイズバンク"
    },
    {
      category: "Tech",
      question: "コンピュータの「頭脳」と呼ばれる演算処理装置は何ですか？",
      options: ["RAM", "SSD", "CPU", "マザーボード"],
      answer: 2,
      explanation: "CPU（Central Processing Unit）はすべての計算や命令処理を実行します。",
      source: "日本語クイズバンク"
    },
    {
      category: "Math",
      question: "偶数の中で唯一の素数はどれですか？",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "2は偶数の中で唯一の素数です。",
      source: "日本語クイズバンク"
    },
    {
      category: "Math",
      question: "144の平方根（ルート）はいくつですか？",
      options: ["10", "12", "14", "16"],
      answer: 1,
      explanation: "12 × 12 = 144 であるため、平方根は12です。",
      source: "日本語クイズバンク"
    },
    {
      category: "History",
      question: "第二次世界大戦が正式に終結した年は何年ですか？",
      options: ["1939年", "1943年", "1945年", "1950年"],
      answer: 2,
      explanation: "第二次世界大戦は1945年に終結しました。",
      source: "日本語クイズバンク"
    },
    {
      category: "Geography",
      question: "世界で最も面積が広い大洋（海洋）はどれですか？",
      options: ["大西洋", "インド洋", "太平洋 (Pacific Ocean)", "北極海"],
      answer: 2,
      explanation: "太平洋は地球の表面積の3分の1以上を占める世界最大の海洋です。",
      source: "日本語クイズバンク"
    },
    {
      category: "Sports",
      question: "オリンピックの旗に描かれている五輪の輪は何個ありますか？",
      options: ["4個", "5個", "6個", "7個"],
      answer: 1,
      explanation: "五大陸の結束を象徴する5つの輪が描かれています。",
      source: "日本語クイズバンク"
    }
  ],

  // =========================================================================
  // SPANISH (Español)
  // =========================================================================
  es: [
    {
      category: "Science",
      question: "¿Qué planeta de nuestro sistema solar es conocido como el 'Planeta Rojo'?",
      options: ["Venus", "Marte", "Júpiter", "Saturno"],
      answer: 1,
      explanation: "Marte tiene un tono rojizo debido a la abundancia de óxido de hierro en su superficie.",
      source: "Banco Español"
    },
    {
      category: "Science",
      question: "¿Cuál es el orgánulo considerado la central energética de la célula?",
      options: ["Núcleo", "Ribosoma", "Mitocondria", "Retículo Endoplasmático"],
      answer: 2,
      explanation: "Las mitocondrias generan la mayor parte del ATP energético que necesita la célula.",
      source: "Banco Español"
    },
    {
      category: "Tech",
      question: "¿Qué significan las siglas HTML en desarrollo web?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML es el lenguaje estándar utilizado para estructurar páginas web.",
      source: "Banco Español"
    },
    {
      category: "Math",
      question: "¿Cuál es el único número primo par?",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "El número 2 es el único que es simultáneamente par y primo.",
      source: "Banco Español"
    },
    {
      category: "History",
      question: "¿En qué año concluyó oficialmente la Segunda Guerra Mundial?",
      options: ["1939", "1943", "1945", "1950"],
      answer: 1,
      explanation: "La Segunda Guerra Mundial terminó en 1945 tras la rendición del Eje.",
      source: "Banco Español"
    }
  ],

  // =========================================================================
  // FRENCH (Français)
  // =========================================================================
  fr: [
    {
      category: "Science",
      question: "Quelle planète de notre système solaire est surnommée la « planète rouge » ?",
      options: ["Vénus", "Mars", "Jupiter", "Saturne"],
      answer: 1,
      explanation: "Mars tire sa couleur rouge de l'oxyde de fer présent à sa surface.",
      source: "Banque Française"
    },
    {
      category: "Science",
      question: "Quel organite cellulaire est surnommé la « centrale énergétique » de la cellule ?",
      options: ["Noyau", "Ribosome", "Mitochondrie", "Appareil de Golgi"],
      answer: 2,
      explanation: "La mitochondrie produit l'énergie chimique (ATP) essentielle à la cellule.",
      source: "Banque Française"
    },
    {
      category: "Tech",
      question: "Que signifie le sigle HTML dans le développement web ?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML est le langage standard de balisage pour les pages web.",
      source: "Banque Française"
    },
    {
      category: "Math",
      question: "Quel est le seul nombre premier pair ?",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "Le nombre 2 est le seul nombre à la fois pair et premier.",
      source: "Banque Française"
    },
    {
      category: "History",
      question: "En quelle année s'est officiellement terminée la Seconde Guerre mondiale ?",
      options: ["1939", "1943", "1945", "1950"],
      answer: 1,
      explanation: "La Seconde Guerre mondiale s'est terminée en 1945.",
      source: "Banque Française"
    }
  ],

  // =========================================================================
  // GERMAN (Deutsch)
  // =========================================================================
  de: [
    {
      category: "Science",
      question: "Welcher Planet unseres Sonnensystems wird als der 'Rote Planet' bezeichnet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      answer: 1,
      explanation: "Der Mars erhält seine rötliche Färbung durch Eisenoxid auf seiner Oberfläche.",
      source: "Deutsches Quiz-Archiv"
    },
    {
      category: "Science",
      question: "Welches Organell wird als das 'Kraftwerk der Zelle' bezeichnet?",
      options: ["Zellkern", "Ribosom", "Mitochondrium", "Golgi-Apparat"],
      answer: 2,
      explanation: "Mitochondrien erzeugen die chemische Energie (ATP) für die Zelle.",
      source: "Deutsches Quiz-Archiv"
    },
    {
      category: "Tech",
      question: "Wofür steht die Abkürzung HTML in der Webentwicklung?",
      options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Logic", "Home Tool Markup Language"],
      answer: 0,
      explanation: "HTML ist die Standard-Auszeichnungssprache für Webseiten.",
      source: "Deutsches Quiz-Archiv"
    },
    {
      category: "Math",
      question: "Welche ist die einzige gerade Primzahl?",
      options: ["0", "1", "2", "4"],
      answer: 2,
      explanation: "Die Zahl 2 ist die einzige Zahl, die sowohl gerade als auch prim ist.",
      source: "Deutsches Quiz-Archiv"
    },
    {
      category: "History",
      question: "In welchem Jahr endete der Zweite Weltkrieg offiziell?",
      options: ["1939", "1943", "1945", "1950"],
      answer: 1,
      explanation: "Der Zweite Weltkrieg endete 1945 mit der Kapitulation der Achsenmächte.",
      source: "Deutsches Quiz-Archiv"
    }
  ]
};

export function getMultilingualQuestions(langCode, category = "All") {
  const bank = MULTILINGUAL_QUESTIONS[langCode] || [];
  if (category === "All") {
    return bank;
  }
  return bank.filter((q) => q.category === category);
}
