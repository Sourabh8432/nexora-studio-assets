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
    if (summaryEl) summaryEl.textContent = data.summary || '';
    if (kpEl) kpEl.innerHTML = (data.highlights || []).map(p => `<li>${p}</li>`).join('');
    // ... additional UI updates ...
  }

  function runLocalAI(title, text, assistant) {
    // Simple extraction logic as fallback
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

  document.addEventListener("DOMContentLoaded", function() {
    const assistant = document.getElementById('aiAssistant');
    if (!assistant) return;
    const key = getGeminiApiKey();
    const body = document.querySelector('.single-body');
    if (body) {
      assistant.classList.add('is-thinking');
      fetchGeminiAI(key, document.title, body.innerText.slice(0, 4000), assistant);
    }
  });
})();
