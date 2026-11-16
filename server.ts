import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI Client (Server Side Only)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint 1: AI Smart Trip Planner with Google Search Grounding
app.post('/api/gemini/plan-trip', async (req, res) => {
  try {
    const { district, budgetJod, adultsCount, kidsCount, duration, vibe, customNotes } = req.body;

    const ai = getGeminiClient();

    const prompt = `
أنت خبير سياحي ومخطط رحلات أردني محترف لتطبيق "طشة عمان" (طشة).
أنشئ خطة طشة تفصيلية في عمان بالأردن بناءً على المعلومات التالية:
- المنطقة المطلوبة: ${district || 'كل عمان'}
- الميزانية الكلية الإجمالية: ${budgetJod} دينار أردني (JOD)
- عدد الأشخاص: ${adultsCount} بالغين، و ${kidsCount} أطفال
- مدة الطشة: ${duration === 'quick' ? 'سريعة (2-4 ساعات)' : duration === 'fullday' ? 'يوم كامل' : 'سهرة مسائية'}
- جو الطشة المفضّل: ${vibe}
- ملاحظات إضافية: ${customNotes || 'لا يوجد'}

المطلوب إرجاع إجابة بأسلوب أردني لطيف وعصري ومبهر بصيغة JSON فقط بالتنسيق التالي ودون أي نصوص إضافية قبل أو بعد الـ JSON:
{
  "itineraryTitle": "عنوان مبتكر وممتع للطشة",
  "summary": "ملخص مشوق للطشة في فقرة واحدة",
  "totalEstimatedJod": 25,
  "timeSlots": [
    {
      "time": "10:00 صباحاً - 12:00 ظهراً",
      "title": "المحطة الأولى",
      "placeName": "اسم المكان الفعلي في عمان",
      "activity": "وصف النشاط والوجبة بأسلوب أردني",
      "estimatedCostJod": 8.5,
      "photographyTip": "نصيحة تصوير ريلز وتيك توك للمصور رامي (أفضل زاوية وإضاءة)"
    }
  ],
  "creatorTips": "نصائح عامة لصناعة محتوى جذاب عن هذه الطشة"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: 'أنت مساعد ذكي متخصص في التخطيط السياحي في عمان، الأردن. تجيب دائماً بلغة عربية أردنية مهذبة وعصرية وبنسق JSON دقيق.',
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || '';
    
    // Extract search grounding metadata sources if present
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = chunks
      .filter((c: any) => c.web && c.web.uri)
      .map((c: any) => ({
        title: c.web.title || c.web.uri,
        uri: c.web.uri,
      }));

    // Clean JSON text
    let jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.groundingSources = groundingSources;
      return res.json(parsed);
    } else {
      return res.json({
        itineraryTitle: `طشة ${district} المميزة`,
        summary: rawText,
        totalEstimatedJod: budgetJod,
        timeSlots: [],
        creatorTips: 'التقط صوراً دافئة عند ساعة الغروب باقتناص زوايا شارع الرينبو أو اللويبدة.',
        groundingSources,
      });
    }
  } catch (err: any) {
    console.error('Error in /api/gemini/plan-trip:', err);
    return res.status(500).json({ error: err.message || 'فشل في توليد خطة الرحلة بالذكاء الاصطناعي' });
  }
});

// API Endpoint 2: Reels & TikTok Script Generator for Rami
app.post('/api/gemini/reels-script', async (req, res) => {
  try {
    const { venueName, category, district, style, targetAudience } = req.body;

    const ai = getGeminiClient();

    const styleName =
      style === 'asmr'
        ? 'سينمائي هادئ ASMR (تركيز على الأصوات والإضاءة)'
        : style === 'hype'
        ? 'حماسي وشبابي Fast Cuts (حركات سريعة وموسيقى تريند)'
        : 'سرد قصصي وتاريخي (صوت دافئ يتحدث عن التراث والذكريات)';

    const prompt = `
أنت مستشار صناعة المحتوى وكاتب إعلانات الفيديو لمصور الفيديوهات والمحتوى "رامي" في عمان.
أنشئ سكريبت فيديو ريلز/تيك توك احترافي وقصير (15-30 ثانية) للترويج للمكان التالي:
- اسم المكان: ${venueName}
- تصنيف المكان: ${category}
- المنطقة: ${district}
- نمط الفيديو: ${styleName}
- الجمهور المستهدف: ${targetAudience || 'الشباب والعائلات في عمان'}

المطلوب إرجاع النتيجة كـ JSON فقط بالصيغة التالية:
{
  "title": "عنوان السكريبت",
  "style": "${style}",
  "hookLine": "الجملة الجاذبة أول 3 ثواني",
  "audioTrackSuggestion": "اقتراح الموسيقى أو الصوت الخلفي",
  "scenes": [
    {
      "sceneNumber": 1,
      "visual": "وصف المشهد البصري بدقة لرامي (الزاوية والإضاءة)",
      "audio": "الكلام أو التأثير الصوتي المسموع",
      "durationSec": 4
    }
  ],
  "callToAction": "الدعوة للإجراء نهاية الفيديو",
  "hashtags": ["#طشة_عمان", "#عمان_الأردن"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: 'أنت خبير تسويق محتوى فيديو ريلز وتيك توك في الأردن.',
      },
    });

    const rawText = response.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return res.json(JSON.parse(jsonMatch[0]));
    } else {
      return res.json({
        title: `ريلز لـ ${venueName}`,
        style,
        hookLine: `شفت هالمكان الخرافي بـ ${district}؟`,
        audioTrackSuggestion: 'صوت أردني دافئ أو تريند ناعم',
        scenes: [
          {
            sceneNumber: 1,
            visual: `لقطة افتتاحية واسعة للواجهة ومدخل ${venueName}`,
            audio: 'صوت الترحيب بلهجة أردنية حارة',
            durationSec: 5,
          },
        ],
        callToAction: 'منشن صاحبك اللي رح ياخدك عهالمكان!',
        hashtags: ['#طشة_عمان', '#أماكن_عمان', '#الأردن'],
      });
    }
  } catch (err: any) {
    console.error('Error in /api/gemini/reels-script:', err);
    return res.status(500).json({ error: err.message || 'فشل في إنشاء سكريبت الريلز' });
  }
});

// Start express server & Vite integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
