/* Nexora AI - Gemini Integration & Content Intelligence */
(function initNexoraAI() {
  var $ = function(selector) { return document.querySelector(selector); };
  var $$ = function(selector) { return document.querySelectorAll(selector); };

  function getGeminiApiKey() {
    const layoutKeyEl = document.getElementById('nexoraGeminiApiKey');
    const layoutKey = layoutKeyEl ? (layoutKeyEl.textContent || '').trim() : '';
    const themeKey = (getComputedStyle(document.documentElement).getPropertyValue('--nexora-gemini-key') || '').trim().replace(/^['"]|['"]$/g, '');
    const rawKey = layoutKey && !/paste your gemini api key here/i.test(layoutKey) ? layoutKey : themeKey;
    const match = rawKey.match(/AIza[0-9A-Za-z_-]+/);
    return match ? match[0] : '';
  }

  async function fetchGeminiAI(key, title, content, assistant) {
    try {
      const prompt = `Analyze this article: { "summary": "2 concise sentences", "highlights": ["3 factual key takeaways"], "keywords": ["5 SEO hashtags"], "tone": "Informative", "difficulty": "Standard" } Article Title: ${title} Content: ${content}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      updateAssistantUI(result);
      initAIVoiceReader(title + '. ' + content);
    } catch (err) { runLocalAI(title, content, assistant); } finally { assistant.classList.remove('is-thinking'); }
  }

  function updateAssistantUI(data) {
    const summaryEl = document.getElementById('aiSummary');
    const kpEl = document.getElementById('aiKeyPoints');
    const difficultyEl = document.getElementById('aiDifficulty');
    const toneEl = document.getElementById('aiTone');
    const readTimeEl = document.getElementById('aiReadTime');
    const keywordsWrapper = document.getElementById('aiKeywordsWrapper');
    const keywordsEl = document.getElementById('aiKeywords');
    if (summaryEl) summaryEl.textContent = data.summary || '';
    if (kpEl) kpEl.innerHTML = (data.highlights || []).map(p => `<li>${p}</li>`).join('');
    if (difficultyEl) difficultyEl.textContent = data.difficulty || 'Standard';
    if (toneEl) toneEl.textContent = data.tone || 'Informative';
    if (readTimeEl && data.readTime) readTimeEl.textContent = data.readTime;
    if (keywordsEl && data.keywords && data.keywords.length) {
      keywordsEl.innerHTML = data.keywords.map(tag => `<span>${tag}</span>`).join('');
      if (keywordsWrapper) keywordsWrapper.style.display = '';
    }
  }

  function runLocalAI(title, text, assistant) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    const highlights = sentences.slice(0, 3).map(sentence => sentence.trim()).filter(Boolean);
    const words = clean.split(/\s+/).filter(Boolean);
    const keywords = Array.from(new Set(words
      .filter(word => word.length > 5)
      .map(word => '#' + word.replace(/[^a-z0-9]/gi, '').toLowerCase())
      .filter(word => word.length > 2))).slice(0, 5);

    updateAssistantUI({
      summary: highlights.slice(0, 2).join(' ') || title,
      highlights: highlights.length ? highlights : ['Key points will appear after adding article content.'],
      keywords: keywords,
      tone: 'Informative',
      difficulty: 'Standard',
      readTime: Math.max(1, Math.ceil(words.length / 200)) + ' min read'
    });
    assistant.classList.remove('is-thinking');
    initAIVoiceReader(title + '. ' + text);
  }

  function initAIVoiceReader(fullText) {
    const btn = document.getElementById('aiVoiceBtn');
    if (!btn || !window.speechSynthesis) return;
    let isPlaying = false;
    btn.addEventListener('click', () => {
      if (!isPlaying) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fullText.slice(0, 3000));
        utterance.onend = () => { isPlaying = false; btn.classList.remove('is-playing'); };
        window.speechSynthesis.speak(utterance);
        isPlaying = true; btn.classList.add('is-playing');
      } else { window.speechSynthesis.cancel(); isPlaying = false; btn.classList.remove('is-playing'); }
    });
  }

  function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    const rtEl = document.getElementById('readingTime');
    if (rtEl) rtEl.textContent = `${time} MIN READ`;
  }

  function runWhenReady() {
    const assistant = document.getElementById('aiAssistant');
    const body = document.querySelector('.single-body');
    if (body) {
      calculateReadingTime(body.innerText);
    }
    if (!assistant) return;
    assistant.style.display = '';
    const key = getGeminiApiKey();
    if (body) {
      assistant.classList.add('is-thinking');
      const articleText = body.innerText.slice(0, 4000);
      if (key) fetchGeminiAI(key, document.title, articleText, assistant);
      else runLocalAI(document.title, articleText, assistant);
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();
