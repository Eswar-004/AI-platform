// AI Platform Interactivity Logic

// ==========================================
// CENTRALIZED API & BACKEND URL CONFIGURATION
// ==========================================
const BACKEND_BASE_URL = window.location.protocol + "//" + (window.location.hostname || "127.0.0.1") + ":5000";
const API_BASE_URL = `${BACKEND_BASE_URL}/api/ai`;

// Global Auth State
let authToken = localStorage.getItem('access_token') || localStorage.getItem('authToken') || null;
let currentUser = null;
let isLoggingIn = false;

// HTML Escaping Utility for XSS Prevention and safe rendering
function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

try {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) currentUser = JSON.parse(savedUser);
} catch (e) {
  currentUser = null;
}

async function callAiApi(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.response || data.message || `HTTP error! status: ${response.status}`);
    }
    return data.response;
  } catch (error) {
    console.error("Failed to fetch AI response:", error);
    throw error;
  }
}

// ==========================================
// 1. WATCH DEMO MODAL
// ==========================================


// ==========================================
// 2. WATCH DEMO MODAL
// ==========================================

function playMockDemo() {
  document.getElementById('demoModal').style.display = 'flex';
  document.getElementById('demoStatusText').innerHTML = 'Click Play to see AI in Action';
}

function closeMockDemo() {
  document.getElementById('demoModal').style.display = 'none';
}

function playDemoAnimation() {
  const status = document.getElementById('demoStatusText');
  status.textContent = 'Simulating student interaction...';
  
  setTimeout(() => {
    status.innerHTML = '🤖 <span style="color: var(--color-sky);">AI explains photosynthesis...</span>';
  }, 1000);

  setTimeout(() => {
    status.innerHTML = '🎤 <span style="color: var(--color-orange);">Listening to student voice question...</span>';
  }, 2500);

  setTimeout(() => {
    status.innerHTML = '✨ <span style="color: var(--color-green);">Created customized homework explanation!</span>';
  }, 4000);

  setTimeout(() => {
    status.innerHTML = '🎉 Demo Finished! Click Start Learning to test it yourself.';
  }, 5500);
}


// ==========================================
// 3. AI CHAT INTERFACE & EXPLAIN AGAIN
// ==========================================

let chatAttachment = null;
let isChatMicActive = false;

// Mock AI knowledge database for student questions


function appendChatMessage(sender, content, key = null) {
  const history = document.getElementById('chatHistory');
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;

  if (sender !== 'ai') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = `<div class="profile-avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">A</div>`;
    msg.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  // Wrap explanation text content in its own div to make re-explaining easier
  const contentArea = document.createElement('div');
  contentArea.className = 'chat-explanation-content';
  contentArea.innerHTML = content;
  bubble.appendChild(contentArea);

  // If this is an AI message, always append "Explain Again" actions
  if (sender === 'ai') {
    const actions = document.createElement('div');
    actions.className = 'explain-again-wrapper';
    actions.innerHTML = `
      <div class="explain-again-title">
        <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Don't understand? Explain it differently:
      </div>
      <div class="explain-again-buttons">
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'simpler', this)"><i data-lucide="sparkles"></i> Simpler</button>
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'example', this)"><i data-lucide="lightbulb"></i> With Example</button>
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'story', this)"><i data-lucide="book-open"></i> As Story</button>
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'tamil', this)">🇮🇳 In Tamil</button>
      </div>
    `;
    bubble.appendChild(actions);
  }

  msg.appendChild(bubble);
  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Modify existing bubble text when clicking Explain Simpler / Story / etc.
async function changeExplanationStyle(conceptKey, style, buttonEl) {
  const bubble = buttonEl.closest('.msg-bubble');
  
  // Extract original text content, excluding widgets
  const tempDiv = bubble.cloneNode(true);
  const actions = tempDiv.querySelector('.explain-again-wrapper');
  if (actions) actions.remove();
  
  const originalText = tempDiv.textContent.trim();
  
  // Disable all buttons while loading
  const buttons = bubble.querySelectorAll('.btn-explain-style');
  buttons.forEach(btn => btn.disabled = true);
  
  let prompt = "";
  if (style === 'simpler') {
    prompt = `Explain the following text in simpler, child-friendly terms for a Grade 6 student. Keep it short and use simple language:\n\n"${originalText}"`;
  } else if (style === 'example') {
    prompt = `Provide a simple, clear, real-world example to illustrate the following concept for a Grade 6 student:\n\n"${originalText}"`;
  } else if (style === 'story') {
    prompt = `Explain the following concept as a very short, engaging story/fable suitable for a Grade 6 student:\n\n"${originalText}"`;
  } else if (style === 'tamil') {
    prompt = `Translate and explain the following concept in clear, simple Tamil (using Tamil script) for a Grade 6 student:\n\n"${originalText}"`;
  }
  
  const contentArea = bubble.querySelector('.chat-explanation-content') || document.createElement('div');
  contentArea.className = 'chat-explanation-content';
  contentArea.innerHTML = "<p><em>Thinking of a new explanation style... ✨</em></p>";
  
  const actionsWidget = bubble.querySelector('.explain-again-wrapper');
  
  bubble.innerHTML = '';
  bubble.appendChild(contentArea);
  if (actionsWidget) bubble.appendChild(actionsWidget);
  
  const newText = await callAiApi(prompt);
  
  // Format response to HTML paragraphs if needed
  let formattedResponse = newText;
  if (!newText.trim().startsWith('<')) {
    formattedResponse = newText.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }
  
  contentArea.innerHTML = formattedResponse;
  
  // Re-enable buttons
  const newButtons = bubble.querySelectorAll('.btn-explain-style');
  newButtons.forEach(btn => btn.disabled = false);
  
  // Add micro-animation highlight
  bubble.style.animation = 'none';
  bubble.offsetHeight; /* trigger reflow */
  bubble.style.animation = 'bounceIn 0.4s';
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}


// User types a message
async function sendChatMessage() {
  const input = document.getElementById('chatMessageInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const micBtn = document.getElementById('chatMicBtn');
  const text = input.value.trim();
  
  if (!text && !chatAttachment) return;
  
  let userMessageHTML = '';
  if (chatAttachment) {
    userMessageHTML += `<p><i data-lucide="image" style="vertical-align:middle;margin-right:5px;color:var(--color-orange);"></i> <strong>Uploaded attachment:</strong> ${chatAttachment.name}</p>`;
  }
  if (text) {
    userMessageHTML += `<p>${text}</p>`;
  }

  // Clear input fields and disable them while loading
  input.value = '';
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
  if (micBtn) micBtn.disabled = true;

  const fileDetails = chatAttachment;
  clearChatAttachment();

  // Append user message
  appendChatMessage('student', userMessageHTML);
  
  // Show AI typing simulation
  showAiTypingIndicator();

  // Build the prompt for AI
  let promptText = "";
  if (fileDetails) {
    promptText = `The student uploaded a homework file named "${fileDetails.name}". Help explain the homework or solve the concepts described in it step-by-step for a Grade 6 student. Text query: "${text || 'Explain the worksheet and solve the problem'}"`;
  } else {
    promptText = `You are a friendly AI Teacher Copilot for a Grade 6 student. Answer the following question or explain the concept clearly, step-by-step, in a friendly tone: "${text}"`;
  }

  const aiResponse = await callAiApi(promptText);

  removeAiTypingIndicator();

  // Re-enable inputs
  input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  if (micBtn) micBtn.disabled = false;
  input.focus();

  // Format AI response to HTML paragraphs if not already HTML
  let formattedResponse = aiResponse;
  if (!aiResponse.trim().startsWith('<')) {
    formattedResponse = aiResponse.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }

  // Determine a simulated concept key for follow-ups
  const conceptKey = text.toLowerCase().includes('photo') ? 'photosynthesis' : 
                     (text.toLowerCase().includes('evap') ? 'evaporation' : 'general');

  appendChatMessage('ai', formattedResponse, conceptKey);
  
  // Generate context-aware follow-up suggestions
  const lowerResponse = aiResponse.toLowerCase();
  const suggestions = [];
  if (lowerResponse.includes('photosynthesis') || lowerResponse.includes('plant') || lowerResponse.includes('leaf')) {
    suggestions.push('How does carbon dioxide get inside the leaf?', 'Tell me the photosynthesis story again');
  } else if (lowerResponse.includes('evaporation') || lowerResponse.includes('water') || lowerResponse.includes('vapor')) {
    suggestions.push('Explain condensation next', 'What happens when water vapor gets cold?');
  } else if (lowerResponse.includes('fraction') || lowerResponse.includes('divide') || lowerResponse.includes('math')) {
    suggestions.push('Explain dividing fractions with a pizza slice example', 'Show me another fraction question');
  } else {
    suggestions.push('Explain this topic in simpler terms', 'Give me a real-world example of this');
  }
  
  appendFollowUps(suggestions);
}

function showAiTypingIndicator() {
  const history = document.getElementById('chatHistory');
  const indicator = document.createElement('div');
  indicator.className = 'chat-msg ai typing-indicator-msg';
  indicator.id = 'aiTypingIndicator';
  indicator.innerHTML = `
    <div class="msg-bubble" style="padding: 10px 15px; font-style: italic;">
      <span>Thinking...</span>
    </div>
  `;
  history.appendChild(indicator);
  history.scrollTop = history.scrollHeight;
}

function removeAiTypingIndicator() {
  const indicator = document.getElementById('aiTypingIndicator');
  if (indicator) indicator.remove();
}

function appendFollowUps(questions) {
  const history = document.getElementById('chatHistory');
  const wrapper = document.createElement('div');
  wrapper.className = 'follow-up-questions';
  
  questions.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'follow-up-question-btn';
    btn.textContent = `💬 "${q}"`;
    btn.onclick = () => {
      quickStartChat(q);
      wrapper.remove();
    };
    wrapper.appendChild(btn);
  });

  history.appendChild(wrapper);
  history.scrollTop = history.scrollHeight;
}

// Quick trigger chats from suggestions
function quickStartChat(promptText) {
  switchTab('chat');
  document.getElementById('chatMessageInput').value = promptText;
  sendChatMessage();
}

function quickExplanation(topicName) {
  quickStartChat(`Explain ${topicName} in simple terms`);
}

function handleChatKeydown(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

// Mock file attachment attachment previews
function handleChatFileSelect(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    chatAttachment = {
      name: file.name,
      type: file.type
    };

    const previewBar = document.getElementById('chatAttachmentPreview');
    const nameSpan = document.getElementById('chatAttachmentName');
    nameSpan.textContent = file.name;
    previewBar.classList.add('active');
  }
}

function clearChatAttachment() {
  chatAttachment = null;
  document.getElementById('chatAttachmentPreview').classList.remove('active');
  document.getElementById('chatFileInput').value = '';
}

// Mock mic toggle
function toggleChatMic() {
  const micBtn = document.getElementById('chatMicBtn');
  const input = document.getElementById('chatMessageInput');
  
  isChatMicActive = !isChatMicActive;
  if (isChatMicActive) {
    micBtn.classList.add('mic-active');
    input.placeholder = "Listening... Speak your question clearly.";
    
    // Simulate speech-to-text text writing after 3 seconds
    setTimeout(() => {
      if (isChatMicActive) {
        input.value = "Why do plants need water?";
        toggleChatMic(); // Turn off mic
      }
    }, 3000);
  } else {
    micBtn.classList.remove('mic-active');
    input.placeholder = "Ask anything... (e.g. 'Why is the sky blue?')";
  }
}


// ==========================================
// 4. STUDENT STORY MODE (JSON & LOCAL IMAGES)
// ==========================================

let studentStoryboardData = null;
let studentSubjectsMap = {};
let currentStudentSubject = '';
let currentStudentChapter = null;
let currentStudentSlideIndex = 0;
let isStudentStorySpeaking = false;
let isStudentAudioModeActive = false;
let studentStoryUtterance = null;

async function initStudentStoryMode() {
  if (!studentStoryboardData) {
    await fetchStudentStoryboard();
  } else {
    populateStudentSubjectDropdown();
  }
}

async function fetchStudentStoryboard() {
  const loadingEl = document.getElementById('studentStoryLoading');
  const placeholderEl = document.getElementById('studentStoryPlaceholder');
  const contentEl = document.getElementById('studentStoryContent');
  const placeholderTitle = document.getElementById('studentPlaceholderTitle');
  const placeholderText = document.getElementById('studentPlaceholderText');

  if (loadingEl) loadingEl.style.display = 'block';
  if (placeholderEl) placeholderEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'none';

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/story/`);
    if (!res.ok) {
      throw new Error(`Failed to load storyboard (HTTP ${res.status})`);
    }
    const data = await res.json();
    studentStoryboardData = data;
    parseStudentStoryboard(data);
    populateStudentSubjectDropdown();

    if (loadingEl) loadingEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      if (placeholderTitle) placeholderTitle.textContent = "Please select a subject.";
      if (placeholderText) placeholderText.textContent = "Select a subject and chapter from the dropdowns above to begin reading the illustrated story.";
    }
  } catch (err) {
    console.error("Error loading storyboard:", err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      if (placeholderTitle) placeholderTitle.textContent = "Unable to load Story Mode content.";
      if (placeholderText) placeholderText.innerHTML = `${escapeHtml(err.message || 'Please try again.')}<br><br><button onclick="fetchStudentStoryboard()" class="btn-3d btn-3d-purple" style="font-size:0.85rem; padding: 6px 16px;">Try Again</button>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }
}

function parseStudentStoryboard(data) {
  // Standard subject baseline
  studentSubjectsMap = {
    'Tamil': [],
    'English': [],
    'Maths': [],
    'Science': [],
    'Social': []
  };

  if (!data) return;

  // Pattern 1: JSON has "subjects" object
  if (data.subjects && typeof data.subjects === 'object') {
    Object.keys(data.subjects).forEach(subKey => {
      const formattedKey = subKey.charAt(0).toUpperCase() + subKey.slice(1).toLowerCase();
      const subObj = data.subjects[subKey];
      const chapters = Array.isArray(subObj.chapters) ? subObj.chapters : (Array.isArray(subObj) ? subObj : []);
      studentSubjectsMap[formattedKey] = chapters.map(ch => normalizeChapter(ch, formattedKey));
    });
  }
  // Pattern 2: Single chapter object with chapter_title, subject, and scenes (the exact user-provided file)
  else if (data.chapter_title && (data.scenes || data.slides)) {
    const rawSub = data.subject || 'Science';
    const formattedSub = rawSub.charAt(0).toUpperCase() + rawSub.slice(1).toLowerCase();
    const ch = normalizeChapter(data, formattedSub);
    if (!studentSubjectsMap[formattedSub]) {
      studentSubjectsMap[formattedSub] = [];
    }
    studentSubjectsMap[formattedSub].push(ch);
  }
  // Pattern 3: Array of chapters at root
  else if (Array.isArray(data.chapters)) {
    data.chapters.forEach(ch => {
      const rawSub = ch.subject || 'General';
      const formattedSub = rawSub.charAt(0).toUpperCase() + rawSub.slice(1).toLowerCase();
      if (!studentSubjectsMap[formattedSub]) studentSubjectsMap[formattedSub] = [];
      studentSubjectsMap[formattedSub].push(normalizeChapter(ch, formattedSub));
    });
  }
}

function normalizeChapter(rawCh, defaultSubject) {
  const scenes = rawCh.scenes || rawCh.slides || [];
  return {
    chapter_number: rawCh.chapter_number || rawCh.chapter_id || 1,
    chapter_title: rawCh.chapter_title || rawCh.title || 'Curriculum Chapter',
    subject: rawCh.subject || defaultSubject,
    class: rawCh.class || rawCh.grade || 10,
    slides: scenes.map((s, idx) => {
      // Determine image path from JSON or structured fallback
      let imgPath = s.image || s.image_url || '';
      if (!imgPath) {
        const subSlug = (rawCh.subject || defaultSubject).toLowerCase();
        imgPath = `storymode/images/${subSlug}/nervous_system/slide${idx + 1}.jpg`;
      }
      return {
        slide_number: s.scene_id || s.slide_number || (idx + 1),
        title: s.title || s.concept || `Scene ${idx + 1}`,
        concept: s.concept || s.title || '',
        narration: s.narration || s.subtitle || '',
        duration_seconds: s.duration_seconds || 10,
        image: imgPath
      };
    })
  };
}

function populateStudentSubjectDropdown() {
  const subjectSelect = document.getElementById('storySubjectSelect');
  if (!subjectSelect) return;

  const subjects = Object.keys(studentSubjectsMap);
  let optionsHtml = '<option value="">Select Subject</option>';
  subjects.forEach(sub => {
    const count = (studentSubjectsMap[sub] && studentSubjectsMap[sub].length) || 0;
    optionsHtml += `<option value="${escapeHtml(sub)}">${escapeHtml(sub)}${count > 0 ? ` (${count})` : ''}</option>`;
  });
  subjectSelect.innerHTML = optionsHtml;

  // If a subject is already selected, retain it; otherwise select Science by default if it has chapters
  if (currentStudentSubject && studentSubjectsMap[currentStudentSubject]) {
    subjectSelect.value = currentStudentSubject;
    populateStudentChapterDropdown(currentStudentSubject);
  } else if (studentSubjectsMap['Science'] && studentSubjectsMap['Science'].length > 0) {
    subjectSelect.value = 'Science';
    onStudentSubjectChanged('Science');
  } else {
    populateStudentChapterDropdown('');
  }
}

function onStudentSubjectChanged(selectedSub) {
  currentStudentSubject = selectedSub;
  stopStudentStorySpeech();
  populateStudentChapterDropdown(selectedSub);

  const placeholderEl = document.getElementById('studentStoryPlaceholder');
  const contentEl = document.getElementById('studentStoryContent');
  const placeholderTitle = document.getElementById('studentPlaceholderTitle');
  const placeholderText = document.getElementById('studentPlaceholderText');

  if (!selectedSub) {
    if (contentEl) contentEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      if (placeholderTitle) placeholderTitle.textContent = "Please select a subject.";
      if (placeholderText) placeholderText.textContent = "Select a subject and chapter from the dropdowns above to begin reading the illustrated story.";
    }
    return;
  }

  const chapters = studentSubjectsMap[selectedSub] || [];
  if (chapters.length === 0) {
    if (contentEl) contentEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      if (placeholderTitle) placeholderTitle.textContent = `No chapters available for ${selectedSub}.`;
      if (placeholderText) placeholderText.textContent = `Please select another subject (such as Science) to explore available chapters.`;
    }
  } else {
    // Automatically select the first chapter
    const chapterSelect = document.getElementById('storyChapterSelect');
    if (chapterSelect) {
      chapterSelect.value = "0";
      onStudentChapterChanged("0");
    }
  }
}

function populateStudentChapterDropdown(subject) {
  const chapterSelect = document.getElementById('storyChapterSelect');
  if (!chapterSelect) return;

  if (!subject || !studentSubjectsMap[subject] || studentSubjectsMap[subject].length === 0) {
    chapterSelect.innerHTML = '<option value="">No chapters available</option>';
    chapterSelect.disabled = true;
    return;
  }

  const chapters = studentSubjectsMap[subject];
  let optionsHtml = '<option value="">Select Chapter</option>';
  chapters.forEach((ch, idx) => {
    optionsHtml += `<option value="${idx}">${escapeHtml(ch.chapter_title)}</option>`;
  });
  chapterSelect.innerHTML = optionsHtml;
  chapterSelect.disabled = false;
}

function onStudentChapterChanged(chapterIdxVal) {
  stopStudentStorySpeech();
  const placeholderEl = document.getElementById('studentStoryPlaceholder');
  const contentEl = document.getElementById('studentStoryContent');
  const placeholderTitle = document.getElementById('studentPlaceholderTitle');

  if (chapterIdxVal === '' || chapterIdxVal === null || isNaN(chapterIdxVal)) {
    currentStudentChapter = null;
    if (contentEl) contentEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      if (placeholderTitle) placeholderTitle.textContent = "Please select a chapter.";
    }
    return;
  }

  const chapters = studentSubjectsMap[currentStudentSubject] || [];
  const idx = parseInt(chapterIdxVal, 10);
  if (!chapters[idx]) {
    if (contentEl) contentEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.style.display = 'flex';
      if (placeholderTitle) placeholderTitle.textContent = "Chapter not found.";
    }
    return;
  }

  currentStudentChapter = chapters[idx];
  currentStudentSlideIndex = 0;

  if (placeholderEl) placeholderEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'block';

  renderStudentSlide(0);
}

function renderStudentSlide(idx) {
  if (!currentStudentChapter || !currentStudentChapter.slides || currentStudentChapter.slides.length === 0) {
    return;
  }

  const slides = currentStudentChapter.slides;
  const total = slides.length;
  if (idx < 0) idx = 0;
  if (idx >= total) idx = total - 1;
  currentStudentSlideIndex = idx;

  const slide = slides[currentStudentSlideIndex];

  // Stop previous speech
  const wasNarrating = isStudentStorySpeaking;
  stopStudentStorySpeech();

  // Badges & Headers
  const titleEl = document.getElementById('studentActiveChapterTitle');
  const subjectBadge = document.getElementById('studentBadgeSubject');
  const countBadge = document.getElementById('studentBadgeSlideCount');
  const sceneBadge = document.getElementById('studentSlideNumberBadge');
  const conceptTitle = document.getElementById('studentSlideConceptTitle');
  const narrationEl = document.getElementById('studentSlideNarrationText');
  const counterEl = document.getElementById('studentSlideCounter');

  if (titleEl) titleEl.textContent = currentStudentChapter.chapter_title;
  if (subjectBadge) subjectBadge.innerHTML = `<i data-lucide="book" style="width: 12px; height: 12px;"></i> ${escapeHtml(currentStudentChapter.subject)}`;
  if (countBadge) countBadge.textContent = `Slide ${currentStudentSlideIndex + 1} of ${total}`;
  if (sceneBadge) sceneBadge.textContent = `SCENE ${slide.slide_number || (currentStudentSlideIndex + 1)}`;
  if (conceptTitle) conceptTitle.textContent = slide.title || slide.concept || `Scene ${currentStudentSlideIndex + 1}`;
  if (counterEl) counterEl.textContent = `${currentStudentSlideIndex + 1} / ${total}`;

  // Exact narration text strictly from storyboard.json (no modifications)
  if (narrationEl) {
    narrationEl.textContent = slide.narration || '';
  }

  // Cinematic 16:9 Image Display
  const imgEl = document.getElementById('studentSlideImg');
  const errEl = document.getElementById('studentSlideImgError');

  if (imgEl && errEl) {
    errEl.style.display = 'none';
    imgEl.style.display = 'none';

    if (slide.image) {
      imgEl.onload = () => {
        imgEl.style.display = 'block';
        errEl.style.display = 'none';
      };
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        errEl.style.display = 'block';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      };

      let imgSrc = slide.image;
      if (!imgSrc.startsWith('http://') && !imgSrc.startsWith('https://') && !imgSrc.startsWith('/')) {
        imgSrc = '/' + imgSrc;
      }
      imgEl.src = imgSrc;
    } else {
      errEl.style.display = 'block';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  // Navigation Buttons
  const btnPrev = document.getElementById('btnStudentPrev');
  const btnNext = document.getElementById('btnStudentNext');

  if (btnPrev) {
    btnPrev.disabled = currentStudentSlideIndex === 0;
    btnPrev.style.opacity = currentStudentSlideIndex === 0 ? '0.4' : '1';
    btnPrev.style.cursor = currentStudentSlideIndex === 0 ? 'not-allowed' : 'pointer';
  }

  if (btnNext) {
    const isLast = currentStudentSlideIndex === total - 1;
    btnNext.disabled = isLast;
    btnNext.style.opacity = isLast ? '0.4' : '1';
    btnNext.style.cursor = isLast ? 'not-allowed' : 'pointer';
  }

  // Dots
  const dotsContainer = document.getElementById('studentStoryDots');
  if (dotsContainer) {
    let dotsHtml = '';
    for (let i = 0; i < total; i++) {
      const isActive = i === currentStudentSlideIndex;
      dotsHtml += `
        <button type="button" 
                onclick="goToStudentSlide(${i})" 
                title="Go to Slide ${i + 1}"
                style="width: ${isActive ? '24px' : '9px'}; height: 9px; border-radius: 5px; background: ${isActive ? '#8b5cf6' : '#cbd5e1'}; border: none; cursor: pointer; transition: all 0.3s ease;">
        </button>
      `;
    }
    dotsContainer.innerHTML = dotsHtml;
  }

  // Auto-play narration if user had narration active
  if (wasNarrating && isStudentAudioModeActive) {
    startStudentStorySpeech(slide.narration);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function prevStudentSlide() {
  if (currentStudentSlideIndex > 0) {
    renderStudentSlide(currentStudentSlideIndex - 1);
  }
}

function nextStudentSlide() {
  if (currentStudentChapter && currentStudentSlideIndex < currentStudentChapter.slides.length - 1) {
    renderStudentSlide(currentStudentSlideIndex + 1);
  }
}

function goToStudentSlide(index) {
  renderStudentSlide(index);
}

function handleStudentImageLoadError(imgEl) {
  if (imgEl) imgEl.style.display = 'none';
  const errEl = document.getElementById('studentSlideImgError');
  if (errEl) errEl.style.display = 'block';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// TEXT-TO-SPEECH FOR STUDENT STORY MODE
// ==========================================

function stopStudentStorySpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isStudentStorySpeaking = false;
  studentStoryUtterance = null;
  updateStudentAudioButtonState();
}

function startStudentStorySpeech(textToRead) {
  if (!('speechSynthesis' in window) || !textToRead) return;

  stopStudentStorySpeech();

  studentStoryUtterance = new SpeechSynthesisUtterance(textToRead);
  studentStoryUtterance.rate = 0.92;
  studentStoryUtterance.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira'))) || voices.find(v => v.lang.startsWith('en'));
  if (englishVoice) {
    studentStoryUtterance.voice = englishVoice;
  }

  studentStoryUtterance.onstart = () => {
    isStudentStorySpeaking = true;
    updateStudentAudioButtonState();
  };

  studentStoryUtterance.onend = () => {
    isStudentStorySpeaking = false;
    updateStudentAudioButtonState();
  };

  studentStoryUtterance.onerror = () => {
    isStudentStorySpeaking = false;
    updateStudentAudioButtonState();
  };

  window.speechSynthesis.speak(studentStoryUtterance);
}

function toggleStudentStorySpeech() {
  if (!('speechSynthesis' in window)) {
    alert("Speech Synthesis is not supported in this browser.");
    return;
  }

  if (isStudentStorySpeaking) {
    isStudentAudioModeActive = false;
    stopStudentStorySpeech();
    return;
  }

  if (!currentStudentChapter || !currentStudentChapter.slides) return;
  const slide = currentStudentChapter.slides[currentStudentSlideIndex];
  if (!slide || !slide.narration) return;

  isStudentAudioModeActive = true;
  startStudentStorySpeech(slide.narration);
}

function updateStudentAudioButtonState() {
  const btn = document.getElementById('btnStudentAudio');
  const icon = document.getElementById('studentAudioIcon');
  const text = document.getElementById('studentAudioText');
  if (!btn) return;

  if (isStudentStorySpeaking) {
    btn.classList.add('active-audio');
    btn.style.backgroundColor = '#8b5cf6';
    btn.style.borderColor = '#7c3aed';
    btn.style.color = '#ffffff';
    if (icon) icon.setAttribute('data-lucide', 'square');
    if (text) text.textContent = 'Stop Narration';
  } else {
    btn.classList.remove('active-audio');
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
    btn.style.color = '';
    if (icon) icon.setAttribute('data-lucide', 'volume-2');
    if (text) text.textContent = 'Play Narration';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


// ==========================================
// 5. VOICE LEARNING (Web Speech API Integration)
// ==========================================

let isVoiceActive = false;
let voiceTimer = null;
let recognitionInstance = null;
let currentUtterance = null;
let availableVoices = [];
let voiceSettings = {
  voiceIndex: null,
  rate: 1.0,
  pitch: 1.0,
  lang: 'en-IN'
};
let isVoiceMuted = false;
let lastAiVoiceResponse = "";
let isProcessingVoice = false;

function initVoiceVoices() {
  if (!('speechSynthesis' in window)) return;

  const populate = () => {
    availableVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById('voiceSelect');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Default System Voice</option>';
    availableVoices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — Default' : ''}`;
      select.appendChild(option);
    });
    if (currentVal !== "" && currentVal < availableVoices.length) {
      select.value = currentVal;
    }
  };

  populate();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populate;
  }
}

function updateVoiceSettings() {
  const select = document.getElementById('voiceSelect');
  const langSelect = document.getElementById('voiceLang');
  const rateInput = document.getElementById('voiceRate');
  const pitchInput = document.getElementById('voicePitch');
  const rateValSpan = document.getElementById('voiceRateVal');
  const pitchValSpan = document.getElementById('voicePitchVal');

  if (select) voiceSettings.voiceIndex = select.value !== "" ? parseInt(select.value) : null;
  if (langSelect) voiceSettings.lang = langSelect.value || 'en-IN';
  if (rateInput) {
    voiceSettings.rate = parseFloat(rateInput.value) || 1.0;
    if (rateValSpan) rateValSpan.textContent = `${voiceSettings.rate.toFixed(1)}x`;
  }
  if (pitchInput) {
    voiceSettings.pitch = parseFloat(pitchInput.value) || 1.0;
    if (pitchValSpan) pitchValSpan.textContent = voiceSettings.pitch.toFixed(1);
  }
}

function showVoiceError(message) {
  const alertBox = document.getElementById('voiceErrorAlert');
  const msgSpan = document.getElementById('voiceErrorMessage');
  if (alertBox && msgSpan) {
    msgSpan.textContent = message;
    alertBox.style.display = 'flex';
  }
}

function dismissVoiceError() {
  const alertBox = document.getElementById('voiceErrorAlert');
  if (alertBox) {
    alertBox.style.display = 'none';
  }
}

function toggleVoiceSession() {
  dismissVoiceError();
  const startBtn = document.getElementById('voiceStartBtn');
  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  isVoiceActive = !isVoiceActive;

  if (isVoiceActive) {
    if (!SpeechRecognition) {
      showVoiceError("Web Speech Recognition is not supported by your browser. Please use Chrome or Edge.");
      isVoiceActive = false;
      return;
    }

    startBtn.innerHTML = `<i data-lucide="square"></i> Stop Session`;
    startBtn.className = "btn-3d btn-3d-orange";

    // Animated waveform bars
    const bars = waveform.querySelectorAll('span');
    voiceTimer = setInterval(() => {
      if (waveform.classList.contains('listening') || waveform.classList.contains('speaking')) {
        bars.forEach(bar => {
          bar.style.height = `${Math.floor(Math.random() * 45) + 8}px`;
        });
      } else {
        bars.forEach(bar => bar.style.height = '8px');
      }
    }, 100);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    startListeningCycle();
  } else {
    // Reset to idle state
    startBtn.innerHTML = `<i data-lucide="mic"></i> Start Speaking`;
    startBtn.className = "btn-3d btn-3d-sky";
    statusTitle.textContent = "Ready to talk!";
    statusSub.textContent = "Ask your questions aloud, and hear explanations naturally.";
    waveform.classList.remove('listening', 'speaking');
    avatar.textContent = '🤖';
    avatar.classList.remove('speaking');
    subtitle.innerHTML = "Session ended. Click 'Start Speaking' to begin again.";

    clearInterval(voiceTimer);
    voiceTimer = null;
    const bars = waveform.querySelectorAll('span');
    bars.forEach(bar => bar.style.height = '8px');

    if (recognitionInstance) {
      try { recognitionInstance.abort(); } catch (e) {}
      recognitionInstance = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceTTSControlState(false, false, false);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function startListeningCycle() {
  if (!isVoiceActive || isProcessingVoice) return;

  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  statusTitle.textContent = "AI is listening...";
  statusSub.textContent = "Speak clearly into your microphone.";
  waveform.classList.add('listening');
  waveform.classList.remove('speaking');
  avatar.textContent = '👂';
  avatar.classList.remove('speaking');
  subtitle.innerHTML = "<em>(Listening for your speech...)</em>";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  if (recognitionInstance) {
    try { recognitionInstance.abort(); } catch (e) {}
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.continuous = false;
  recognitionInstance.interimResults = true;
  recognitionInstance.lang = voiceSettings.lang || 'en-US';

  let finalTranscript = '';

  recognitionInstance.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    const currentText = finalTranscript || interimTranscript;
    subtitle.innerHTML = `<strong>You:</strong> ${currentText}`;

    if (finalTranscript.trim().length > 0) {
      try { recognitionInstance.stop(); } catch (e) {}
      processVoiceQuestion(finalTranscript.trim());
    }
  };

  recognitionInstance.onerror = (err) => {
    console.warn("Speech recognition error:", err.error);
    if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
      showVoiceError("Microphone access was denied. Please allow microphone permissions in browser settings.");
      if (isVoiceActive) toggleVoiceSession();
    } else if (err.error === 'network') {
      showVoiceError("Network error occurred during speech recognition.");
    }
  };

  recognitionInstance.onend = () => {
    if (isVoiceActive && !isProcessingVoice && !finalTranscript) {
      setTimeout(() => {
        if (isVoiceActive && !isProcessingVoice) {
          startListeningCycle();
        }
      }, 1000);
    }
  };

  try {
    recognitionInstance.start();
  } catch (e) {
    console.error("Failed to start speech recognition:", e);
  }
}

async function processVoiceQuestion(questionText) {
  if (!isVoiceActive || isProcessingVoice) return;
  isProcessingVoice = true;

  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  appendVoiceTranscript('user', questionText);

  statusTitle.textContent = "AI is thinking...";
  statusSub.textContent = "Fetching explanation from AI.";
  waveform.classList.remove('listening');
  avatar.textContent = '🤔';

  let aiResponse = "";
  try {
    const promptText = `You are a friendly AI teacher copilot speaking directly to a student. Keep your answer brief, clear, and natural to read aloud (maximum 2 to 3 sentences). Question: "${questionText}"`;
    aiResponse = await callAiApi(promptText);
  } catch (error) {
    console.error("Error contacting Flask backend / Groq AI:", error);
    showVoiceError("Backend server or Groq AI is unavailable.");
    aiResponse = "I'm sorry, I am currently unable to reach the AI server. Please make sure the backend server is running.";
  }

  isProcessingVoice = false;

  if (!isVoiceActive) return;

  const cleanText = aiResponse.replace(/[*#_\`\[\]()]/g, '').trim();
  lastAiVoiceResponse = cleanText;

  appendVoiceTranscript('ai', aiResponse);
  subtitle.innerHTML = `<strong>You:</strong> ${questionText}<br><strong style="color:var(--color-green-dark)">AI:</strong> ${aiResponse}`;

  speakAiResponse(cleanText);
}

function speakAiResponse(textToSpeak) {
  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');

  statusTitle.textContent = "AI is speaking...";
  statusSub.textContent = "Playing explanation audio.";
  waveform.classList.add('speaking');
  avatar.textContent = '🤖';
  avatar.classList.add('speaking');

  if (!('speechSynthesis' in window)) {
    showVoiceError("Speech Synthesis is not supported by your browser.");
    setVoiceTTSControlState(false, false, true);
    if (isVoiceActive) setTimeout(startListeningCycle, 2000);
    return;
  }

  window.speechSynthesis.cancel();

  if (isVoiceMuted) {
    setVoiceTTSControlState(false, false, true);
    waveform.classList.remove('speaking');
    avatar.classList.remove('speaking');
    if (isVoiceActive) setTimeout(startListeningCycle, 2500);
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
  currentUtterance.rate = voiceSettings.rate || 1.0;
  currentUtterance.pitch = voiceSettings.pitch || 1.0;

  if (voiceSettings.lang) {
    currentUtterance.lang = voiceSettings.lang;
  }

  if (voiceSettings.voiceIndex !== null && availableVoices[voiceSettings.voiceIndex]) {
    currentUtterance.voice = availableVoices[voiceSettings.voiceIndex];
  }

  setVoiceTTSControlState(true, false, true);

  currentUtterance.onend = () => {
    setVoiceTTSControlState(false, false, true);
    waveform.classList.remove('speaking');
    avatar.classList.remove('speaking');
    if (isVoiceActive) {
      setTimeout(() => {
        if (isVoiceActive) startListeningCycle();
      }, 1000);
    }
  };

  currentUtterance.onerror = (e) => {
    console.error("Speech Synthesis Error:", e);
    showVoiceError("Speech Synthesis error occurred.");
    setVoiceTTSControlState(false, false, true);
    waveform.classList.remove('speaking');
    avatar.classList.remove('speaking');
    if (isVoiceActive) {
      setTimeout(() => {
        if (isVoiceActive) startListeningCycle();
      }, 1000);
    }
  };

  window.speechSynthesis.speak(currentUtterance);
}

function appendVoiceTranscript(sender, text) {
  const history = document.getElementById('voiceTranscriptHistory');
  const emptyPlaceholder = document.getElementById('voiceTranscriptEmpty');
  if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';

  if (!history) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `voice-transcript-msg ${sender}`;
  msgDiv.innerHTML = `<strong>${sender === 'user' ? '👤 You' : '🤖 AI Assistant'}:</strong> ${text}`;
  history.appendChild(msgDiv);
  history.scrollTop = history.scrollHeight;
}

function setVoiceTTSControlState(canPause, canResume, canRepeat) {
  const pauseBtn = document.getElementById('voicePauseBtn');
  const resumeBtn = document.getElementById('voiceResumeBtn');
  const repeatBtn = document.getElementById('voiceRepeatBtn');

  if (pauseBtn) pauseBtn.disabled = !canPause;
  if (resumeBtn) resumeBtn.disabled = !canResume;
  if (repeatBtn) repeatBtn.disabled = !canRepeat;
}

function pauseVoiceTTS() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    setVoiceTTSControlState(false, true, true);
    const statusTitle = document.getElementById('voiceStatusTitle');
    if (statusTitle) statusTitle.textContent = "Audio Paused";
  }
}

function resumeVoiceTTS() {
  if (window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setVoiceTTSControlState(true, false, true);
    const statusTitle = document.getElementById('voiceStatusTitle');
    if (statusTitle) statusTitle.textContent = "AI is speaking...";
  }
}

function repeatVoiceResponse() {
  if (lastAiVoiceResponse) {
    speakAiResponse(lastAiVoiceResponse);
  }
}

function toggleMuteTTS() {
  isVoiceMuted = !isVoiceMuted;
  const muteBtn = document.getElementById('voiceMuteBtn');
  if (muteBtn) {
    if (isVoiceMuted) {
      muteBtn.innerHTML = `<i data-lucide="volume-x"></i> Unmute`;
      muteBtn.classList.add('btn-3d-orange');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else {
      muteBtn.innerHTML = `<i data-lucide="volume-2"></i> Mute`;
      muteBtn.classList.remove('btn-3d-orange');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function clearVoiceConversation() {
  const history = document.getElementById('voiceTranscriptHistory');
  if (history) {
    history.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;" id="voiceTranscriptEmpty">No messages in this session yet.</p>';
  }
  const subtitle = document.getElementById('voiceSubtitleContainer');
  if (subtitle) {
    subtitle.innerHTML = "Click 'Start Speaking' to begin the conversation. Say \"Tell me about evaporation.\"";
  }
  lastAiVoiceResponse = "";
  setVoiceTTSControlState(false, false, false);
}


// ==========================================
// 6. HOMEWORK HELPER (OCR Scanner lines)
// ==========================================

function handleHomeworkUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('scanImageSrc').src = e.target.result;
      runHomeworkScan();
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function mockHomeworkScan() {
  // Use mock notebook page image placeholder
  document.getElementById('scanImageSrc').src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFFDF5' stroke='%23DDD' stroke-width='2'/><line x1='10' y1='10' x2='90' y2='10' stroke='%23DDD'/><line x1='10' y1='25' x2='90' y2='25' stroke='%23DDD'/><text x='15' y='40' font-family='sans-serif' font-size='6' font-weight='bold'>Q5: Solve 3x + 9 = 24</text><line x1='10' y1='55' x2='90' y2='55' stroke='%23DDD'/></svg>";
  runHomeworkScan();
}

async function runHomeworkScan() {
  const placeholder = document.getElementById('scanPlaceholder');
  const results = document.getElementById('scanResults');
  const scanImg = document.getElementById('scanUploadedImage');
  const laser = document.getElementById('scanLaserLine');
  const ocrBlock = document.getElementById('homeworkOcrBlock');
  const explanationBlock = document.getElementById('homeworkExplanationBlock');

  placeholder.style.display = 'none';
  results.style.display = 'none';
  scanImg.style.display = 'block';
  laser.style.display = 'block';

  // Get problem details
  let filename = "";
  const fileInput = document.getElementById('homeworkFileInput');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    filename = fileInput.files[0].name;
  }

  let problemText = "Question 5: Solve the equation 3x + 9 = 24. Show your working steps.";
  let promptText = "";

  if (filename) {
    problemText = `Problem extracted from worksheet: ${filename}`;
    promptText = `A student uploaded a worksheet file named "${filename}". Identify a typical Grade 6 algebra or science homework problem that matches this context. Provide a detailed, step-by-step tutor explanation for it. Return ONLY the HTML contents (paragraphs, steps, code blocks) describing how to solve it. Do not include markdown wraps or styling details.`;
  } else {
    promptText = `Solve the equation "3x + 9 = 24" step-by-step as a friendly AI tutor. Provide clear instruction for each step. Return the response as simple HTML (using <h4> for headers, <p> for paragraphs, <ol> and <li> for steps, and <code> for math formulas). Do not use markdown wraps.`;
  }

  const apiPromise = callAiApi(promptText);
  const timerPromise = new Promise(resolve => setTimeout(resolve, 2500));

  const [aiResponse] = await Promise.all([apiPromise, timerPromise]);

  laser.style.display = 'none';
  results.style.display = 'block';
  results.classList.add('active');

  ocrBlock.textContent = `"${problemText}"`;
  
  let formattedExplanation = aiResponse;
  if (!aiResponse.trim().startsWith('<')) {
    formattedExplanation = `<h4><i data-lucide="sparkles"></i> Teacher Copilot Guidance</h4>` + 
      aiResponse.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  } else {
    if (!aiResponse.includes('Teacher Copilot Guidance') && !aiResponse.includes('<h4>')) {
      formattedExplanation = `<h4><i data-lucide="sparkles"></i> Teacher Copilot Guidance</h4>` + aiResponse;
    }
  }

  const actionButtonsHTML = `
    <div style="margin-top: 15px; display: flex; gap: 10px;">
      <button class="btn-3d btn-3d-sky" style="padding: 6px 12px; font-size: 0.8rem;" onclick="switchTab('chat'); quickStartChat('Explain step 1 of equation 3x+9=24 again in Tamil')">Explain Step 1 in Tamil</button>
      <button class="btn-3d btn-3d-white" style="padding: 6px 12px; font-size: 0.8rem;" onclick="switchTab('chat'); quickStartChat('Give me another similar algebra problem to solve')">Practice Similar Problem</button>
    </div>
  `;
  explanationBlock.innerHTML = formattedExplanation + actionButtonsHTML;

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}


// ==========================================
// 7. AI QUIZ ENGINE
// ==========================================



let currentQuizTopic = '';
let currentQuizDifficulty = '';
let quizIndex = 0;
let quizScore = 0;
let activeQuestions = [];
let quizOptionSelected = null;
let currentQuizQuestionType = '';

function initQuiz() {
  resetQuizView();
}

function resetQuizView() {
  document.getElementById('quizWelcomeScreen').style.display = 'block';
  document.getElementById('quizActiveScreen').style.display = 'none';
  document.getElementById('quizResultsScreen').style.display = 'none';
}

async function startMockQuiz() {
  const subjectInput = document.getElementById('quizSubject');
  const topicInput = document.getElementById('quizTopic');
  const diffSelect = document.getElementById('quizDifficulty');
  const questionTypeSelect = document.getElementById('quizQuestionType');
  const generateBtn = document.getElementById('quizGenerateBtn');
  
  const subjectVal = (subjectInput && subjectInput.value.trim()) ? subjectInput.value.trim() : 'Science';
  const topicVal = (topicInput && topicInput.value.trim()) ? topicInput.value.trim() : 'Water Cycles';
  const diffVal = diffSelect ? diffSelect.value : 'Medium';
  const qTypeVal = questionTypeSelect ? questionTypeSelect.value : 'MCQ';

  currentQuizTopic = `${subjectVal} - ${topicVal}`;
  currentQuizDifficulty = diffVal;
  currentQuizQuestionType = qTypeVal;

  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating AI Quiz... 🧠";
  }

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/ai/quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: subjectVal,
        topic: topicVal,
        difficulty: diffVal,
        question_type: qTypeVal,
        num_questions: 3
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error(data.message || "Invalid response structure from AI quiz server.");
    }

    activeQuestions = data.questions;
    quizIndex = 0;
    quizScore = 0;

    document.getElementById('quizWelcomeScreen').style.display = 'none';
    document.getElementById('quizActiveScreen').style.display = 'block';
    
    showQuizQuestion();
  } catch (e) {
    console.error("Failed to generate custom AI Quiz:", e);
    alert(e.message || "Unable to contact AI server.");
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate AI Quiz Now";
    }
  }
}

function showQuizQuestion() {
  const question = activeQuestions[quizIndex];
  
  document.getElementById('quizQuestionNumber').textContent = `Question ${quizIndex + 1} of ${activeQuestions.length}`;
  document.getElementById('quizQuestionCategory').textContent = currentQuizTopic.split(' - ')[0];
  document.getElementById('quizQuestionText').textContent = question.q;
  
  // Set progress bar
  const progressPercent = (quizIndex / activeQuestions.length) * 100;
  document.getElementById('quizProgressBar').style.width = `${progressPercent}%`;

  // Render options list or fill‑in‑the‑blank input based on question type
  const list = document.getElementById('quizOptionsList');
  list.innerHTML = '';
  quizOptionSelected = null;

  if (currentQuizQuestionType === 'Fill in the Blank') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'quizAnswerInput';
    input.className = 'quiz-select-input';
    input.placeholder = 'Your answer';
    list.appendChild(input);
    // Enable the Check Answer button when user types
    const nextBtn = document.getElementById('quizNextBtn');
    input.addEventListener('input', () => {
      nextBtn.disabled = input.value.trim() === '';
    });
  } else {
    // MCQ rendering (existing behavior)
    question.options.forEach((opt, idx) => {
      const btn = document.createElement('div');
      btn.className = 'quiz-option-item';
      btn.innerHTML = `
        <span class="quiz-option-letter">${String.fromCharCode(65 + idx)}</span>
        <span>${opt}</span>
      `;
      btn.onclick = () => selectQuizOption(idx, btn);
      list.appendChild(btn);
    });
  }

  // Hide feedback banner, set next button to check state
  document.getElementById('quizFeedbackBanner').style.display = 'none';
  const nextBtn = document.getElementById('quizNextBtn');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Check Answer';
}

function selectQuizOption(index, element) {
  // Clear previous selected options
  const options = document.querySelectorAll('.quiz-option-item');
  options.forEach(opt => opt.classList.remove('selected'));

  element.classList.add('selected');
  quizOptionSelected = index;
  document.getElementById('quizNextBtn').disabled = false;
}

function nextQuizQuestion() {
  const nextBtn = document.getElementById('quizNextBtn');
  const banner = document.getElementById('quizFeedbackBanner');
  const bannerText = document.getElementById('quizFeedbackText');
  const bannerIcon = document.getElementById('quizFeedbackIcon');
  
  const question = activeQuestions[quizIndex];

  // Stage 1: Checking answer
  if (nextBtn.textContent === 'Check Answer') {
    let isCorrect = false;
    if (currentQuizQuestionType === 'Fill in the Blank') {
      const userAns = (document.getElementById('quizAnswerInput')?.value || '').trim().toLowerCase();
      const correctAnsRaw = question.answer || (question.options && question.options[question.correct]) || '';
      const correctAns = correctAnsRaw.replace(/^\s*\w+\)\s*/, '').trim().toLowerCase(); // strip possible "A) " prefix
      isCorrect = userAns === correctAns;
    } else {
      // MCQ
      isCorrect = (quizOptionSelected === question.correct);
      // Highlight options
      const options = document.querySelectorAll('.quiz-option-item');
      options.forEach((opt, idx) => {
        if (idx === question.correct) {
          opt.classList.add('correct');
        } else if (idx === quizOptionSelected) {
          opt.classList.add('incorrect');
        }
      });
    }

    if (isCorrect) {
      quizScore++;
      banner.className = 'quiz-feedback-banner correct';
      bannerText.textContent = "Superb job! You got it right.";
      bannerIcon.setAttribute('data-lucide', 'check-circle-2');
    } else {
      banner.className = 'quiz-feedback-banner incorrect';
      bannerText.textContent = `Not quite. ${question.explain}`;
      bannerIcon.setAttribute('data-lucide', 'alert-circle');
    }
    
    banner.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Toggle button label
    nextBtn.textContent = (quizIndex + 1 < activeQuestions.length) ? 'Next Question' : 'Finish Quiz';
  } 
  // Stage 2: Advancing index
  else {
    quizIndex++;
    if (quizIndex < activeQuestions.length) {
      showQuizQuestion();
    } else {
      finishQuiz();
    }
  }
}

function finishQuiz() {
  document.getElementById('quizActiveScreen').style.display = 'none';
  document.getElementById('quizResultsScreen').style.display = 'block';

  document.getElementById('quizScoreVal').textContent = `${quizScore} / ${activeQuestions.length}`;
  
  const scorePercent = (quizScore / activeQuestions.length) * 100;
  let summaryTag = '';
  if (scorePercent === 100) summaryTag = 'Excellent work, Aarav! A perfect score! 🏆';
  else if (scorePercent >= 70) summaryTag = 'Great job! You have a solid grasp on this lesson. 🌟';
  else summaryTag = 'Good try! Let\'s revise this lesson to get a higher score next time. 📖';
  
  document.getElementById('quizScoreTag').textContent = summaryTag;
}

function quitQuiz() {
  if (confirm("Are you sure you want to exit the quiz? Your progress won't be saved.")) {
    resetQuizView();
  }
}

// ==========================================
// AUTHENTICATION & ROLE-BASED APPLICATION STATE
// ==========================================

// Global API Fetch helper with JWT header
async function authFetch(endpoint, options = {}) {
  options.headers = options.headers || {};
  if (!(options.body instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (response.status === 401) {
    // Token expired or invalid session
    logout(false);
    throw new Error("Session expired. Please log in again.");
  }
  return response;
}

// On page load, verify session if token exists, or stay on landing page
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initQuiz();
  initVoiceVoices();

  if (authToken) {
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUser = data.user;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          if (currentUser.role === 'teacher') {
            switchToTeacherView('dashboard');
          } else {
            switchToStudentView('home');
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Stored token is invalid or expired:", err);
      logout(false);
      return;
    }
  }

  // If no valid token, show landing view by default
  switchToLandingView();
});

// View Navigation Management
function hideAllViews() {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
}

function showLoginView() {
  hideAllViews();
  const loginView = document.getElementById('loginView');
  if (loginView) loginView.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function togglePasswordVisibility(inputId, btnElem) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById('togglePasswordIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function fillDemoCredentials(email, password) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  const alertBox = document.getElementById('loginAlert');
  if (alertBox) alertBox.style.display = 'none';
}

function handleLoginSubmit(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';
  performLogin(email, password);
}

async function performLogin(email, password) {
  if (isLoggingIn) return;
  isLoggingIn = true;

  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const btnText = document.getElementById('loginBtnText');
  const btnIcon = document.getElementById('loginBtnIcon');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');

  if (alertBox) alertBox.style.display = 'none';

  // Set loading state
  if (submitBtn) submitBtn.disabled = true;
  if (emailInput) emailInput.disabled = true;
  if (passInput) passInput.disabled = true;
  if (btnText) btnText.textContent = "Logging in...";
  if (btnIcon) btnIcon.setAttribute('data-lucide', 'loader');
  if (typeof lucide !== 'undefined') lucide.createIcons();

  let res = null;
  let data = null;

  // 1. Network Request Layer
  try {
    res = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    data = await res.json();
  } catch (netErr) {
    console.error("Network connection failure:", netErr);
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      alertBox.textContent = 'Unable to connect to the server. Please check if Flask backend is running on port 5000.';
      alertBox.style.display = 'block';
    }
    isLoggingIn = false;
    if (submitBtn) submitBtn.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    if (btnText) btnText.textContent = "Log In";
    if (btnIcon) btnIcon.setAttribute('data-lucide', 'log-in');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // 2. Response Status Layer
  if (!res.ok || !data || data.success === false) {
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      if (res.status === 401) {
        alertBox.textContent = data.message || 'Invalid email or password.';
      } else if (res.status === 403) {
        alertBox.textContent = 'Access denied. You do not have permission to access this page.';
      } else {
        alertBox.textContent = data.message || `Server error (${res.status}). Please try again later.`;
      }
      alertBox.style.display = 'block';
    }
    isLoggingIn = false;
    if (submitBtn) submitBtn.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    if (btnText) btnText.textContent = "Log In";
    if (btnIcon) btnIcon.setAttribute('data-lucide', 'log-in');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // 3. Login Successful (HTTP 200)
  authToken = data.token || data.access_token;
  currentUser = data.user;
  localStorage.setItem('access_token', authToken);
  localStorage.setItem('authToken', authToken);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  console.log("LOGIN SUBMIT:", email);
  console.log("LOGIN RESPONSE STATUS:", res.status);
  console.log("LOGIN RESPONSE BODY:", data);
  console.log("TOKEN RECEIVED:", authToken);
  console.log("USER ROLE:", currentUser ? currentUser.role : null);

  // Reset loading state controls
  isLoggingIn = false;
  if (submitBtn) submitBtn.disabled = false;
  if (emailInput) emailInput.disabled = false;
  if (passInput) passInput.disabled = false;
  if (btnText) btnText.textContent = "Log In";
  if (btnIcon) btnIcon.setAttribute('data-lucide', 'log-in');

  // 4. View Redirection Layer
  try {
    if (currentUser && currentUser.role === 'teacher') {
      console.log("REDIRECTING TO TEACHER DASHBOARD");
      switchToTeacherView('dashboard');
    } else {
      console.log("REDIRECTING TO STUDENT DASHBOARD");
      switchToStudentView('home');
    }
  } catch (uiErr) {
    console.error("UI navigation error:", uiErr);
  }
}

async function logout(callApi = true) {
  if (callApi && authToken) {
    try {
      await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    } catch (e) {}
  }
  authToken = null;
  currentUser = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  switchToLandingView();
}

function switchToLandingView() {
  hideAllViews();
  const landing = document.getElementById('landingView');
  if (landing) landing.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchToStudentView(initialTab = 'home') {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'student') {
    switchToTeacherView('dashboard');
    return;
  }
  hideAllViews();
  const sView = document.getElementById('studentView');
  if (sView) sView.classList.add('active');

  const userNameElem = document.getElementById('studentUserName');
  if (userNameElem && currentUser) {
    userNameElem.textContent = currentUser.name;
  }

  switchTab(initialTab);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchToTeacherView(initialTab = 'dashboard') {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'teacher') {
    switchToStudentView('home');
    return;
  }
  hideAllViews();
  const tView = document.getElementById('teacherView');
  if (tView) tView.classList.add('active');

  const tNameElem = document.getElementById('teacherUserName');
  if (tNameElem && currentUser) {
    tNameElem.textContent = currentUser.name;
  }

  switchTeacherTab(initialTab);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchTab(tabName) {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'student') {
    switchToTeacherView('dashboard');
    return;
  }

  const tabs = document.querySelectorAll('#studentView .dashboard-tab');
  tabs.forEach(t => t.classList.remove('active'));

  const menuItems = document.querySelectorAll('#studentView .sidebar-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');

  const activeMenuItem = document.getElementById(`side-${tabName}`);
  if (activeMenuItem) activeMenuItem.classList.add('active');

  const titleMap = {
    'home': 'Home Dashboard',
    'chat': 'AI Chat Tutor',
    'story': 'Illustrated Story Mode',
    'voice': 'Voice Copilot Session',
    'quiz': 'AI Quiz Generator',
    'progress': 'Detailed Learning Progress',
    'tasks': 'My Assigned Tasks'
  };
  const titleElem = document.getElementById('header-tab-title');
  if (titleElem) titleElem.textContent = titleMap[tabName] || 'Dashboard';

  if (tabName === 'tasks') {
    loadStudentTasks();
  }
  if (tabName === 'story') {
    initStudentStoryMode();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchTeacherTab(tabName) {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'teacher') {
    switchToStudentView('home');
    return;
  }

  const tabs = document.querySelectorAll('#teacherView .dashboard-tab');
  tabs.forEach(t => t.classList.remove('active'));

  const menuItems = document.querySelectorAll('#teacherView .sidebar-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const activeTab = document.getElementById(`teacher-tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');

  const activeMenuItem = document.getElementById(`teacher-side-${tabName}`);
  if (activeMenuItem) activeMenuItem.classList.add('active');

  const titleMap = {
    'dashboard': 'Teacher Overview Dashboard',
    'add-students': 'Add New Student',
    'view-students': 'Registered Students & Progress',
    'assign-tasks': 'Assign Homework Task',
    'review-work': 'Review Student Submissions',
    'ai-story': 'Classroom Video Lessons'
  };
  const titleElem = document.getElementById('teacher-header-title');
  if (titleElem) titleElem.textContent = titleMap[tabName] || 'Teacher Dashboard';

  if (tabName === 'dashboard') loadTeacherDashboardStats();
  if (tabName === 'view-students') loadTeacherStudents();
  if (tabName === 'assign-tasks') loadTeacherStudentsForDropdown();
  if (tabName === 'review-work') loadTeacherReviews();
  if (tabName === 'ai-story') initTeacherVideoModule();

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// STUDENT TASK MODULE FUNCTIONS
// ==========================================
async function loadStudentTasks() {
  const container = document.getElementById('studentTasksList');
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 30px;"><p>Loading tasks...</p></div>';

  try {
    const res = await authFetch('/api/student/tasks');
    const data = await res.json();
    if (!data.success || !data.tasks || data.tasks.length === 0) {
      container.innerHTML = `
        <div class="card-3d" style="text-align: center; padding: 40px;">
          <i data-lucide="check-circle" style="font-size: 3rem; color: var(--color-green); margin-bottom: 10px;"></i>
          <h4>All Caught Up!</h4>
          <p style="color: var(--text-muted);">You have no pending tasks assigned at this moment.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = data.tasks.map(task => {
      const sub = task.submission;
      let statusBadge = `<span class="badge-status assigned">Assigned</span>`;
      if (task.status === 'submitted' || (sub && sub.status === 'submitted')) {
        statusBadge = `<span class="badge-status submitted">Submitted</span>`;
      } else if (task.status === 'reviewed' || (sub && sub.status === 'reviewed')) {
        statusBadge = `<span class="badge-status reviewed">Reviewed</span>`;
      }

      let submissionArea = '';
      if (!sub || sub.status === 'submitted') {
        submissionArea = `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border-light);">
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 6px;">Your Answer / Solution:</label>
            <textarea id="taskAnswer_${task.id}" rows="3" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid var(--border-thick); font-family: inherit;" placeholder="Write your completed answer here...">${sub ? sub.answer || '' : ''}</textarea>
            <button class="btn-3d btn-3d-green" style="margin-top: 10px; font-size: 0.88rem;" onclick="handleStudentSubmitTask(${task.id})">
              <i data-lucide="send"></i> ${sub ? 'Update & Resubmit Work' : 'Submit Work'}
            </button>
          </div>
        `;
      } else if (sub && sub.status === 'reviewed') {
        submissionArea = `
          <div style="margin-top: 15px; padding: 12px; background-color: var(--color-green-light); border-radius: 8px; border: 1px solid var(--color-green);">
            <h5 style="color: var(--color-green-dark); margin-bottom: 4px;"><i data-lucide="award"></i> Teacher Feedback &amp; Marks</h5>
            <p style="font-size: 0.9rem; margin-bottom: 4px;"><strong>Your Submitted Answer:</strong> "${sub.answer}"</p>
            <p style="font-size: 0.9rem; margin-bottom: 4px;"><strong>Teacher Feedback:</strong> ${sub.teacher_feedback || 'No written feedback provided.'}</p>
            ${sub.marks !== null ? `<p style="font-size: 0.95rem; font-weight: 800; color: var(--color-green-dark); margin: 0;">Grade/Marks: ${sub.marks} / 100</p>` : ''}
          </div>
        `;
      }

      return `
        <div class="task-card-item">
          <div class="task-card-header">
            <div>
              <span class="tag-badge tag-sky" style="margin-bottom: 4px; display: inline-block;">${task.subject || 'General'}</span>
              <h4 class="task-card-title">${task.title}</h4>
            </div>
            ${statusBadge}
          </div>
          <p class="task-card-desc">${task.description || 'No additional instructions provided.'}</p>
          <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 15px;">
            <span><i data-lucide="calendar"></i> Assigned: ${task.created_at ? task.created_at.substring(0, 10) : 'Today'}</span>
            ${task.due_date ? `<span><i data-lucide="clock"></i> Due: ${task.due_date}</span>` : ''}
            <span><i data-lucide="user"></i> Teacher: ${task.teacher_name || 'Demo Teacher'}</span>
          </div>
          ${submissionArea}
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div class="card-3d"><p style="color: red;">Error loading tasks: ${err.message}</p></div>`;
  }
}

async function handleStudentSubmitTask(taskId) {
  const answerElem = document.getElementById(`taskAnswer_${taskId}`);
  if (!answerElem) return;
  const answer = answerElem.value.trim();

  if (!answer) {
    alert("Please enter your answer/solution before submitting.");
    return;
  }

  try {
    const res = await authFetch(`/api/student/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert("Work submitted successfully!");
      loadStudentTasks();
    } else {
      alert(data.message || "Failed to submit task.");
    }
  } catch (err) {
    alert("Error submitting task: " + err.message);
  }
}

// ==========================================
// TEACHER MODULE FUNCTIONS
// ==========================================
async function loadTeacherDashboardStats() {
  try {
    const [resS, resT, resR] = await Promise.all([
      authFetch('/api/teacher/students'),
      authFetch('/api/teacher/tasks'),
      authFetch('/api/teacher/reviews')
    ]);

    const dataS = await resS.json();
    const dataT = await resT.json();
    const dataR = await resR.json();

    if (dataS.success && dataS.students) {
      document.getElementById('statTotalStudents').textContent = dataS.students.length;
    }
    if (dataT.success && dataT.tasks) {
      document.getElementById('statTotalTasks').textContent = dataT.tasks.length;
    }
    if (dataR.success && dataR.submissions) {
      const pending = dataR.submissions.filter(s => s.status === 'submitted').length;
      document.getElementById('statPendingReviews').textContent = pending;
    }
  } catch (err) {
    console.warn("Failed to load dashboard stats:", err);
  }
}

async function loadTeacherStudents() {
  const tbody = document.getElementById('teacherStudentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading students...</td></tr>';

  try {
    const res = await authFetch('/api/teacher/students');
    const data = await res.json();
    if (!data.success || !data.students || data.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No students registered yet. Click "Add Students" to enroll a student.</td></tr>';
      return;
    }

    tbody.innerHTML = data.students.map(s => `
      <tr>
        <td>#${s.id}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td>${s.total_tasks || 0}</td>
        <td><span class="badge-status reviewed">${s.completed_tasks || 0} Done</span></td>
        <td><span class="badge-status assigned">Student</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: red; padding: 20px;">Error: ${err.message}</td></tr>`;
  }
}

async function loadTeacherStudentsForDropdown() {
  const select = document.getElementById('taskStudentSelect');
  if (!select) return;
  select.innerHTML = '<option value="">Loading students...</option>';

  try {
    const res = await authFetch('/api/teacher/students');
    const data = await res.json();
    if (data.success && data.students && data.students.length > 0) {
      select.innerHTML = '<option value="">-- Select Student --</option>' +
        data.students.map(s => `<option value="${s.id}">${s.name} (${s.email})</option>`).join('');
    } else {
      select.innerHTML = '<option value="">No students available. Create a student first.</option>';
    }
  } catch (err) {
    select.innerHTML = '<option value="">Failed to load students</option>';
  }
}

async function handleCreateStudent(event) {
  event.preventDefault();
  const alertBox = document.getElementById('addStudentAlert');
  if (alertBox) alertBox.style.display = 'none';

  const name = document.getElementById('newStudentName').value.trim();
  const email = document.getElementById('newStudentEmail').value.trim();
  const password = document.getElementById('newStudentPassword').value.trim();

  try {
    const res = await authFetch('/api/teacher/students', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (alertBox) {
        alertBox.className = 'login-alert alert-success';
        alertBox.textContent = `Student "${name}" created successfully!`;
        alertBox.style.display = 'block';
      }
      document.getElementById('addStudentForm').reset();
    } else {
      if (alertBox) {
        alertBox.className = 'login-alert alert-danger';
        alertBox.textContent = data.message || 'Failed to create student account.';
        alertBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      alertBox.textContent = 'Error: ' + err.message;
      alertBox.style.display = 'block';
    }
  }
}

async function handleAssignTask(event) {
  event.preventDefault();
  const alertBox = document.getElementById('assignTaskAlert');
  if (alertBox) alertBox.style.display = 'none';

  const student_id = document.getElementById('taskStudentSelect').value;
  const subject = document.getElementById('taskSubjectInput').value.trim();
  const title = document.getElementById('taskTitleInput').value.trim();
  const description = document.getElementById('taskDescriptionInput').value.trim();
  const due_date = document.getElementById('taskDueDateInput').value;

  if (!student_id) {
    alert("Please select a student.");
    return;
  }

  try {
    const res = await authFetch('/api/teacher/tasks', {
      method: 'POST',
      body: JSON.stringify({ student_id: parseInt(student_id), subject, title, description, due_date })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (alertBox) {
        alertBox.className = 'login-alert alert-success';
        alertBox.textContent = `Task "${title}" assigned successfully!`;
        alertBox.style.display = 'block';
      }
      document.getElementById('assignTaskForm').reset();
    } else {
      if (alertBox) {
        alertBox.className = 'login-alert alert-danger';
        alertBox.textContent = data.message || 'Failed to assign task.';
        alertBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      alertBox.textContent = 'Error: ' + err.message;
      alertBox.style.display = 'block';
    }
  }
}

async function loadTeacherReviews() {
  const container = document.getElementById('teacherReviewsList');
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 30px;"><p>Loading submissions...</p></div>';

  try {
    const res = await authFetch('/api/teacher/reviews');
    const data = await res.json();

    if (!data.success || !data.submissions || data.submissions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px;">
          <p style="color: var(--text-muted);">No student submissions to review at this time.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.submissions.map(sub => {
      const isReviewed = sub.status === 'reviewed';
      return `
        <div class="task-card-item">
          <div class="task-card-header">
            <div>
              <span class="tag-badge tag-sky" style="margin-bottom: 4px; display: inline-block;">${sub.student_name || 'Student'} (${sub.student_email || ''})</span>
              <h4 class="task-card-title">${sub.task_title || 'Homework Assignment'}</h4>
            </div>
            <span class="badge-status ${isReviewed ? 'reviewed' : 'submitted'}">${isReviewed ? 'Reviewed' : 'Needs Review'}</span>
          </div>

          <div style="margin-top: 10px; padding: 12px; background-color: var(--bg-primary); border-radius: 8px;">
            <p style="font-size: 0.88rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">Student's Submitted Answer:</p>
            <p style="font-size: 0.92rem; color: var(--text-main); margin: 0; line-height: 1.4;">"${sub.answer || 'No text submitted.'}"</p>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">Submitted at: ${sub.submitted_at || 'Recently'}</p>
          </div>

          <div style="margin-top: 15px;">
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 6px;">Teacher Feedback:</label>
            <textarea id="reviewFeedback_${sub.id}" rows="2" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 2px solid var(--border-thick); font-family: inherit;" placeholder="Provide encouraging feedback or notes for revision...">${sub.teacher_feedback || ''}</textarea>

            <div style="display: flex; gap: 15px; align-items: center; margin-top: 10px;">
              <div style="width: 160px;">
                <label style="font-weight: 700; font-size: 0.82rem; display: block; margin-bottom: 4px;">Grade / Marks (0-100):</label>
                <input type="number" id="reviewMarks_${sub.id}" value="${sub.marks !== null ? sub.marks : ''}" placeholder="e.g. 95" style="width: 100%; padding: 8px; border-radius: 6px; border: 2px solid var(--border-thick);">
              </div>
              <button class="btn-3d btn-3d-green" style="margin-top: 18px; font-size: 0.85rem; padding: 8px 16px;" onclick="handleTeacherReviewSubmission(${sub.id})">
                <i data-lucide="check-circle"></i> Save Review &amp; Grade
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div style="color: red; padding: 20px;">Error loading reviews: ${err.message}</div>`;
  }
}

async function handleTeacherReviewSubmission(subId) {
  const feedbackElem = document.getElementById(`reviewFeedback_${subId}`);
  const marksElem = document.getElementById(`reviewMarks_${subId}`);
  const feedback = feedbackElem ? feedbackElem.value.trim() : '';
  const marks = marksElem ? marksElem.value : null;

  try {
    const res = await authFetch(`/api/teacher/reviews/${subId}`, {
      method: 'POST',
      body: JSON.stringify({ feedback, marks: marks ? parseFloat(marks) : null })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert("Review and grade saved successfully!");
loadTeacherReviews();
    } else {
      alert(data.message || "Failed to save review.");
    }
  } catch (err) {
    alert("Error saving review: " + err.message);
  }
}

// ==========================================
// TEACHER VIDEO LESSONS MODULE
// ==========================================

const TEACHER_VIDEO_CATALOG = {
  "6": {
    name: "Class 6",
    subjects: {
      "Science": [
        { id: "c6_sci_food", title: "Components of Food", file: "components_of_food.mp4" },
        { id: "c6_sci_materials", title: "Sorting Materials into Groups", file: "sorting_materials.mp4" },
        { id: "c6_sci_separation", title: "Separation of Substances", file: "separation_of_substances.mp4" },
        { id: "c6_sci_plants", title: "Getting to Know Plants", file: "getting_to_know_plants.mp4" },
        { id: "c6_sci_body", title: "Body Movements", file: "body_movements.mp4" },
        { id: "c6_sci_living", title: "The Living Organisms & Habitats", file: "living_organisms.mp4" },
        { id: "c6_sci_motion", title: "Motion and Measurement of Distances", file: "motion_and_measurement.mp4" },
        { id: "c6_sci_light", title: "Light, Shadows and Reflections", file: "light_shadows.mp4" },
        { id: "c6_sci_electricity", title: "Electricity and Circuits", file: "electricity_circuits.mp4" },
        { id: "c6_sci_magnets", title: "Fun with Magnets", file: "fun_with_magnets.mp4" }
      ],
      "Mathematics": [
        { id: "c6_math_numbers", title: "Knowing Our Numbers", file: "knowing_numbers.mp4" },
        { id: "c6_math_whole", title: "Whole Numbers", file: "whole_numbers.mp4" },
        { id: "c6_math_playing", title: "Playing with Numbers", file: "playing_with_numbers.mp4" },
        { id: "c6_math_geo", title: "Basic Geometrical Ideas", file: "geometrical_ideas.mp4" },
        { id: "c6_math_integers", title: "Integers", file: "integers.mp4" },
        { id: "c6_math_fractions", title: "Fractions and Decimals", file: "fractions_decimals.mp4" },
        { id: "c6_math_algebra", title: "Introduction to Algebra", file: "algebra_intro.mp4" },
        { id: "c6_math_ratio", title: "Ratio and Proportion", file: "ratio_proportion.mp4" }
      ],
      "Social Science": [
        { id: "c6_soc_history1", title: "What, Where, How and When?", file: "history_beginnings.mp4" },
        { id: "c6_soc_hunting", title: "From Hunting-Gathering to Growing Food", file: "early_humans.mp4" },
        { id: "c6_soc_solar", title: "The Earth in the Solar System", file: "solar_system.mp4" },
        { id: "c6_soc_globe", title: "Globe: Latitudes and Longitudes", file: "globe_latitudes.mp4" },
        { id: "c6_soc_diversity", title: "Understanding Diversity", file: "diversity.mp4" }
      ],
      "English": [
        { id: "c6_eng_patrick", title: "Who Did Patrick's Homework?", file: "patricks_homework.mp4" },
        { id: "c6_eng_dog", title: "How the Dog Found Himself a Master", file: "dog_master.mp4" },
        { id: "c6_eng_taro", title: "Taro's Reward", file: "taros_reward.mp4" },
        { id: "c6_eng_kalpana", title: "An Indian-American Woman in Space: Kalpana Chawla", file: "kalpana_chawla.mp4" }
      ],
      "Tamil": [
        { id: "c6_tam_inba", title: "இன்பத்தமிழ் (Inba Tamil)", file: "inba_tamil.mp4" },
        { id: "c6_tam_kummi", title: "தமிழ்க் கும்மி (Tamil Kummi)", file: "tamil_kummi.mp4" },
        { id: "c6_tam_valar", title: "வளர்தமிழ் (Valar Tamil)", file: "valar_tamil.mp4" },
        { id: "c6_tam_kanavu", title: "கனவு பலித்தது (Kanavu Palithathu)", file: "kanavu_palithathu.mp4" }
      ]
    }
  },
  "7": {
    name: "Class 7",
    subjects: {
      "Science": [
        { id: "c7_sci_nutrition_plants", title: "Nutrition in Plants", file: "nutrition_plants.mp4" },
        { id: "c7_sci_nutrition_animals", title: "Nutrition in Animals", file: "nutrition_animals.mp4" },
        { id: "c7_sci_heat", title: "Heat and Temperature", file: "heat_temperature.mp4" },
        { id: "c7_sci_acids", title: "Acids, Bases and Salts", file: "acids_bases_salts.mp4" },
        { id: "c7_sci_physical", title: "Physical and Chemical Changes", file: "physical_chemical_changes.mp4" },
        { id: "c7_sci_respiration", title: "Respiration in Organisms", file: "respiration.mp4" },
        { id: "c7_sci_motion", title: "Motion and Time", file: "motion_time.mp4" },
        { id: "c7_sci_light", title: "Light & Optics", file: "light_optics.mp4" }
      ],
      "Mathematics": [
        { id: "c7_math_integers", title: "Integers Operations", file: "integers_ops.mp4" },
        { id: "c7_math_fractions", title: "Fractions and Decimals", file: "fractions_decimals.mp4" },
        { id: "c7_math_equations", title: "Simple Equations", file: "simple_equations.mp4" },
        { id: "c7_math_lines", title: "Lines and Angles", file: "lines_angles.mp4" },
        { id: "c7_math_triangles", title: "The Triangle and its Properties", file: "triangles.mp4" },
        { id: "c7_math_comparing", title: "Comparing Quantities", file: "comparing_quantities.mp4" },
        { id: "c7_math_perimeter", title: "Perimeter and Area", file: "perimeter_area.mp4" }
      ],
      "Social Science": [
        { id: "c7_soc_tracing", title: "Tracing Changes Through A Thousand Years", file: "thousand_years.mp4" },
        { id: "c7_soc_kings", title: "New Kings and Kingdoms", file: "kings_kingdoms.mp4" },
        { id: "c7_soc_delhi", title: "The Delhi Sultans", file: "delhi_sultans.mp4" },
        { id: "c7_soc_mughal", title: "The Mughal Empire", file: "mughal_empire.mp4" },
        { id: "c7_soc_environment", title: "Environment and Ecosystem", file: "environment.mp4" }
      ],
      "English": [
        { id: "c7_eng_questions", title: "Three Questions", file: "three_questions.mp4" },
        { id: "c7_eng_chappals", title: "A Gift of Chappals", file: "gift_chappals.mp4" },
        { id: "c7_eng_gopal", title: "Gopal and the Hilsa Fish", file: "gopal_hilsa.mp4" },
        { id: "c7_eng_quality", title: "Quality", file: "quality.mp4" }
      ],
      "Tamil": [
        { id: "c7_tam_engal", title: "எங்கள் தமிழ் (Engal Tamil)", file: "engal_tamil.mp4" },
        { id: "c7_tam_kaadu", title: "காடு (Kaadu)", file: "kaadu.mp4" },
        { id: "c7_tam_vilangugal", title: "விலங்குகள் உலகம் (Vilangugal Ulagam)", file: "vilangugal_ulagam.mp4" },
        { id: "c7_tam_kappal", title: "கப்பலோட்டிய தமிழர் (Kappalottiya Thamizhar)", file: "kappalottiya_thamizhar.mp4" }
      ]
    }
  },
  "8": {
    name: "Class 8",
    subjects: {
      "Science": [
        { id: "c8_sci_crops", title: "Crop Production and Management", file: "crop_production.mp4" },
        { id: "c8_sci_micro", title: "Microorganisms: Friend and Foe", file: "microorganisms.mp4" },
        { id: "c8_sci_coal", title: "Coal and Petroleum", file: "coal_petroleum.mp4" },
        { id: "c8_sci_combustion", title: "Combustion and Flame", file: "combustion_flame.mp4" },
        { id: "c8_sci_cell", title: "Cell - Structure and Functions", file: "cell_structure.mp4" },
        { id: "c8_sci_reproduction", title: "Reproduction in Animals", file: "reproduction_animals.mp4" },
        { id: "c8_sci_force", title: "Force and Pressure", file: "force_pressure.mp4" },
        { id: "c8_sci_friction", title: "Friction", file: "friction.mp4" },
        { id: "c8_sci_sound", title: "Sound", file: "sound.mp4" }
      ],
      "Mathematics": [
        { id: "c8_math_rational", title: "Rational Numbers", file: "rational_numbers.mp4" },
        { id: "c8_math_linear", title: "Linear Equations in One Variable", file: "linear_equations.mp4" },
        { id: "c8_math_quad", title: "Understanding Quadrilaterals", file: "quadrilaterals.mp4" },
        { id: "c8_math_squares", title: "Squares and Square Roots", file: "squares_roots.mp4" },
        { id: "c8_math_cubes", title: "Cubes and Cube Roots", file: "cubes_roots.mp4" },
        { id: "c8_math_algebraic", title: "Algebraic Expressions and Identities", file: "algebraic_identities.mp4" },
        { id: "c8_math_mensuration", title: "Mensuration", file: "mensuration.mp4" }
      ],
      "Social Science": [
        { id: "c8_soc_trade", title: "From Trade to Territory", file: "trade_territory.mp4" },
        { id: "c8_soc_ruling", title: "Ruling the Countryside", file: "ruling_countryside.mp4" },
        { id: "c8_soc_revolt", title: "When People Rebel: 1857 and After", file: "revolt_1857.mp4" },
        { id: "c8_soc_resources", title: "Resources and Development", file: "resources.mp4" },
        { id: "c8_soc_constitution", title: "The Indian Constitution", file: "constitution.mp4" }
      ],
      "English": [
        { id: "c8_eng_christmas", title: "The Best Christmas Present in the World", file: "christmas_present.mp4" },
        { id: "c8_eng_tsunami", title: "The Tsunami", file: "tsunami.mp4" },
        { id: "c8_eng_glimpses", title: "Glimpses of the Past", file: "glimpses_past.mp4" },
        { id: "c8_eng_summit", title: "The Summit Within", file: "summit_within.mp4" }
      ],
      "Tamil": [
        { id: "c8_tam_vaazhthu", title: "தமிழ்மொழி வாழ்த்து (Tamil Mozhi Vaazhthu)", file: "tamil_vaazhthu.mp4" },
        { id: "c8_tam_odai", title: "ஓடை (Odai)", file: "odai.mp4" },
        { id: "c8_tam_kalvi", title: "கல்வி அழகே அழகு (Kalvi Azhage)", file: "kalvi_azhage.mp4" },
        { id: "c8_tam_kaappom", title: "வருமுன் காப்போம் (Varumun Kaappom)", file: "varumun_kaappom.mp4" }
      ]
    }
  },
  "9": {
    name: "Class 9",
    subjects: {
      "Science": [
        { id: "c9_sci_matter", title: "Matter in Our Surroundings", file: "matter_surroundings.mp4" },
        { id: "c9_sci_pure", title: "Is Matter Around Us Pure?", file: "matter_pure.mp4" },
        { id: "c9_sci_atoms", title: "Atoms and Molecules", file: "atoms_molecules.mp4" },
        { id: "c9_sci_structure", title: "Structure of the Atom", file: "structure_atom.mp4" },
        { id: "c9_sci_cell", title: "The Fundamental Unit of Life (Cell)", file: "cell_fundamental.mp4" },
        { id: "c9_sci_tissues", title: "Tissues", file: "tissues.mp4" },
        { id: "c9_sci_motion", title: "Motion", file: "motion.mp4" },
        { id: "c9_sci_force", title: "Force and Laws of Motion", file: "force_laws_motion.mp4" },
        { id: "c9_sci_gravitation", title: "Gravitation", file: "gravitation.mp4" },
        { id: "c9_sci_work", title: "Work and Energy", file: "work_energy.mp4" },
        { id: "c9_sci_sound", title: "Sound", file: "sound.mp4" }
      ],
      "Mathematics": [
        { id: "c9_math_number_sys", title: "Number Systems", file: "number_systems.mp4" },
        { id: "c9_math_poly", title: "Polynomials", file: "polynomials.mp4" },
        { id: "c9_math_coord", title: "Coordinate Geometry", file: "coordinate_geometry.mp4" },
        { id: "c9_math_linear", title: "Linear Equations in Two Variables", file: "linear_eq_2vars.mp4" },
        { id: "c9_math_lines", title: "Lines and Angles", file: "lines_angles.mp4" },
        { id: "c9_math_triangles", title: "Triangles", file: "triangles.mp4" },
        { id: "c9_math_quads", title: "Quadrilaterals", file: "quadrilaterals.mp4" },
        { id: "c9_math_circles", title: "Circles", file: "circles.mp4" },
        { id: "c9_math_surface", title: "Surface Areas and Volumes", file: "surface_areas_volumes.mp4" }
      ],
      "Social Science": [
        { id: "c9_soc_french", title: "The French Revolution", file: "french_revolution.mp4" },
        { id: "c9_soc_russian", title: "Socialism in Europe & Russian Revolution", file: "russian_revolution.mp4" },
        { id: "c9_soc_nazism", title: "Nazism and the Rise of Hitler", file: "nazism_hitler.mp4" },
        { id: "c9_soc_india", title: "India - Size and Location", file: "india_size_location.mp4" },
        { id: "c9_soc_physical", title: "Physical Features of India", file: "physical_features_india.mp4" },
        { id: "c9_soc_democracy", title: "What is Democracy? Why Democracy?", file: "democracy.mp4" }
      ],
      "English": [
        { id: "c9_eng_fun", title: "The Fun They Had", file: "the_fun_they_had.mp4" },
        { id: "c9_eng_music", title: "The Sound of Music", file: "sound_of_music.mp4" },
        { id: "c9_eng_girl", title: "The Little Girl", file: "little_girl.mp4" },
        { id: "c9_eng_einstein", title: "A Truly Beautiful Mind", file: "truly_beautiful_mind.mp4" }
      ],
      "Tamil": [
        { id: "c9_tam_dravidian", title: "திராவிட மொழிக்குடும்பம் (Dravidian Languages)", file: "dravida_mozhi.mp4" },
        { id: "c9_tam_pattamaram", title: "பட்டமரம் (Pattamaram)", file: "pattamaram.mp4" },
        { id: "c9_tam_manimegalai", title: "மணிமேகலை (Manimegalai)", file: "manimegalai.mp4" },
        { id: "c9_tam_kudumba", title: "குடும்ப விளக்கு (Kudumba Vilakku)", file: "kudumba_vilakku.mp4" }
      ]
    }
  },
  "10": {
    name: "Class 10",
    subjects: {
      "Science": [
        { id: "c10_sci_nervous", title: "Nervous System (Control & Coordination)", file: "videos/class10/science/nervous system/complete_educational_video.mp4" },
        { id: "c10_sci_chemical", title: "Chemical Reactions and Equations", file: "chemical_reactions.mp4" },
        { id: "c10_sci_acids", title: "Acids, Bases and Salts", file: "acids_bases_salts.mp4" },
        { id: "c10_sci_metals", title: "Metals and Non-metals", file: "metals_nonmetals.mp4" },
        { id: "c10_sci_carbon", title: "Carbon and its Compounds", file: "carbon_compounds.mp4" },
        { id: "c10_sci_life", title: "Life Processes", file: "life_processes.mp4" },
        { id: "c10_sci_heredity", title: "Heredity and Evolution", file: "heredity_evolution.mp4" },
        { id: "c10_sci_light", title: "Light - Reflection and Refraction", file: "light_reflection.mp4" },
        { id: "c10_sci_humaneye", title: "The Human Eye and Colourful World", file: "human_eye.mp4" },
        { id: "c10_sci_electricity", title: "Electricity", file: "electricity.mp4" },
        { id: "c10_sci_magnetic", title: "Magnetic Effects of Electric Current", file: "magnetic_effects.mp4" }
      ],
      "Mathematics": [
        { id: "c10_math_real", title: "Real Numbers", file: "real_numbers.mp4" },
        { id: "c10_math_poly", title: "Polynomials", file: "polynomials.mp4" },
        { id: "c10_math_linear", title: "Pair of Linear Equations in Two Variables", file: "linear_equations_2vars.mp4" },
        { id: "c10_math_quadratic", title: "Quadratic Equations", file: "quadratic_equations.mp4" },
        { id: "c10_math_ap", title: "Arithmetic Progressions", file: "arithmetic_progressions.mp4" },
        { id: "c10_math_triangles", title: "Triangles", file: "triangles.mp4" },
        { id: "c10_math_coord", title: "Coordinate Geometry", file: "coordinate_geometry.mp4" },
        { id: "c10_math_trig", title: "Introduction to Trigonometry", file: "intro_trigonometry.mp4" },
        { id: "c10_math_circles", title: "Circles", file: "circles.mp4" },
        { id: "c10_math_statistics", title: "Statistics and Probability", file: "statistics_probability.mp4" }
      ],
      "Social Science": [
        { id: "c10_soc_nationalism_europe", title: "The Rise of Nationalism in Europe", file: "nationalism_europe.mp4" },
        { id: "c10_soc_nationalism_india", title: "Nationalism in India", file: "nationalism_india.mp4" },
        { id: "c10_soc_making_global", title: "The Making of a Global World", file: "global_world.mp4" },
        { id: "c10_soc_resources", title: "Resources and Development", file: "resources_development.mp4" },
        { id: "c10_soc_agriculture", title: "Agriculture", file: "agriculture.mp4" },
        { id: "c10_soc_power_sharing", title: "Power Sharing", file: "power_sharing.mp4" },
        { id: "c10_soc_federalism", title: "Federalism", file: "federalism.mp4" },
        { id: "c10_soc_development", title: "Understanding Economic Development", file: "economic_development.mp4" }
      ],
      "English": [
        { id: "c10_eng_letter_god", title: "A Letter to God", file: "letter_to_god.mp4" },
        { id: "c10_eng_mandela", title: "Nelson Mandela: Long Walk to Freedom", file: "nelson_mandela.mp4" },
        { id: "c10_eng_flying", title: "Two Stories About Flying", file: "stories_about_flying.mp4" },
        { id: "c10_eng_anne_frank", title: "From the Diary of Anne Frank", file: "anne_frank.mp4" },
        { id: "c10_eng_glimpses_india", title: "Glimpses of India", file: "glimpses_india.mp4" },
        { id: "c10_eng_madam_rides", title: "Madam Rides the Bus", file: "madam_rides_bus.mp4" }
      ],
      "Tamil": [
        { id: "c10_tam_annai", title: "அன்னை மொழியே (Annai Mozhiye)", file: "annai_mozhiye.mp4" },
        { id: "c10_tam_kaatre", title: "காற்றே வா (Kaatre Vaa)", file: "kaatre_vaa.mp4" },
        { id: "c10_tam_mullai", title: "முல்லைப்பாட்டு (Mullaippaattu)", file: "mullaippaattu.mp4" },
        { id: "c10_tam_seyguthambi", title: "செய்குதம்பிப் பாவலர் (Seyguthambi Paavalar)", file: "seyguthambi_paavalar.mp4" },
        { id: "c10_tam_kaalakkanitham", title: "காலக்கணிதம் (Kaalakkanitham)", file: "kaalakkanitham.mp4" }
      ]
    }
  }
};

const DEFAULT_TEACHER_VIDEO = {
  class: "10",
  subject: "Science",
  chapterId: "c10_sci_nervous",
  path: "videos/class10/science/nervous system/complete_educational_video.mp4",
  filename: "complete_educational_video.mp4"
};

function initTeacherVideoModule() {
  const classSelect = document.getElementById('teacherVideoClassSelect');
  if (!classSelect) return;

  // Set default filter: Class 10, Science, Nervous System
  classSelect.value = DEFAULT_TEACHER_VIDEO.class;
  populateTeacherSubjects();

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function onTeacherVideoClassChanged() {
  populateTeacherSubjects();
}

function populateTeacherSubjects() {
  const classSelect = document.getElementById('teacherVideoClassSelect');
  const subjectSelect = document.getElementById('teacherVideoSubjectSelect');
  if (!classSelect || !subjectSelect) return;

  const selectedClass = classSelect.value || "10";
  const classData = TEACHER_VIDEO_CATALOG[selectedClass];
  if (!classData || !classData.subjects) return;

  const currentSubject = subjectSelect.value;
  subjectSelect.innerHTML = '';

  const subjects = Object.keys(classData.subjects);
  subjects.forEach(subject => {
    const opt = document.createElement('option');
    opt.value = subject;
    opt.textContent = subject;
    subjectSelect.appendChild(opt);
  });

  if (selectedClass === DEFAULT_TEACHER_VIDEO.class && subjects.includes(DEFAULT_TEACHER_VIDEO.subject)) {
    subjectSelect.value = DEFAULT_TEACHER_VIDEO.subject;
  } else if (subjects.includes(currentSubject)) {
    subjectSelect.value = currentSubject;
  } else if (subjects.length > 0) {
    subjectSelect.value = subjects[0];
  }

  onTeacherVideoSubjectChanged();
}

function onTeacherVideoSubjectChanged() {
  const classSelect = document.getElementById('teacherVideoClassSelect');
  const subjectSelect = document.getElementById('teacherVideoSubjectSelect');
  const chapterSelect = document.getElementById('teacherVideoChapterSelect');
  if (!classSelect || !subjectSelect || !chapterSelect) return;

  const selectedClass = classSelect.value || "10";
  const selectedSubject = subjectSelect.value;
  const classData = TEACHER_VIDEO_CATALOG[selectedClass];

  chapterSelect.innerHTML = '';

  if (classData && classData.subjects && classData.subjects[selectedSubject]) {
    const chapters = classData.subjects[selectedSubject];
    chapters.forEach(chap => {
      const opt = document.createElement('option');
      opt.value = chap.id;
      opt.textContent = chap.title;
      chapterSelect.appendChild(opt);
    });
  }

  // If Class 10 and Science, select Nervous System by default
  if (selectedClass === DEFAULT_TEACHER_VIDEO.class && selectedSubject === DEFAULT_TEACHER_VIDEO.subject) {
    chapterSelect.value = DEFAULT_TEACHER_VIDEO.chapterId;
  }

  onTeacherVideoChapterChanged();
}

function onTeacherVideoChapterChanged() {
  const classSelect = document.getElementById('teacherVideoClassSelect');
  const subjectSelect = document.getElementById('teacherVideoSubjectSelect');
  const chapterSelect = document.getElementById('teacherVideoChapterSelect');
  const player = document.getElementById('teacherVideoPlayer');
  const fallback = document.getElementById('teacherVideoFallback');
  const toolbar = document.getElementById('teacherVideoControlsToolbar');
  const classBadge = document.getElementById('teacherVideoClassBadge');
  const subjectBadge = document.getElementById('teacherVideoSubjectBadge');
  const chapterBadge = document.getElementById('teacherVideoChapterBadge');
  const sourceBadge = document.getElementById('teacherVideoSourceBadge');
  const fallbackTitle = document.getElementById('teacherFallbackTitle');
  const fallbackSubtitle = document.getElementById('teacherFallbackSubtitle');
  const fileNameDisplay = document.getElementById('teacherVideoFileNameDisplay');

  if (!classSelect || !subjectSelect || !chapterSelect) return;

  const selectedClass = classSelect.value || "10";
  const selectedSubject = subjectSelect.value || "";
  const selectedChapterId = chapterSelect.value;
  const selectedOption = chapterSelect.selectedOptions[0];
  const chapterTitle = selectedOption ? selectedOption.textContent : "Selected Chapter";

  if (classBadge) classBadge.textContent = `Class ${selectedClass}`;
  if (subjectBadge) subjectBadge.textContent = selectedSubject;
  if (chapterBadge) chapterBadge.textContent = chapterTitle;

  // DISPLAY VIDEO ONLY WHEN Class 10, Science, Nervous System is selected
  const isTargetFilter = (selectedClass === DEFAULT_TEACHER_VIDEO.class &&
                          selectedSubject === DEFAULT_TEACHER_VIDEO.subject &&
                          selectedChapterId === DEFAULT_TEACHER_VIDEO.chapterId);

  if (isTargetFilter) {
    const videoUrl = encodeURI(DEFAULT_TEACHER_VIDEO.path);

    if (player) {
      if (!player.src.endsWith(DEFAULT_TEACHER_VIDEO.path) && player.src !== window.location.origin + '/' + DEFAULT_TEACHER_VIDEO.path) {
        player.src = videoUrl;
        player.load();
      }
      player.style.display = 'block';
    }

    if (fallback) fallback.style.display = 'none';
    if (toolbar) toolbar.style.display = 'flex';

    if (sourceBadge) {
      sourceBadge.innerHTML = '<i data-lucide="play-circle" style="width: 14px; height: 14px; color: #16a34a;"></i> Video Ready';
      sourceBadge.style.color = '#15803d';
      sourceBadge.style.background = '#dcfce7';
    }

    if (fileNameDisplay) {
      fileNameDisplay.innerHTML = `<i data-lucide="film" style="width: 16px; height: 16px; color: #0ea5e9;"></i> Lesson Video: <strong>${escapeHtml(DEFAULT_TEACHER_VIDEO.filename)}</strong>`;
    }
  } else {
    // Hide video player and controls when other filters are applied
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
      player.style.display = 'none';
    }

    if (fallback) fallback.style.display = 'flex';
    if (toolbar) toolbar.style.display = 'none';

    if (fallbackTitle) {
      fallbackTitle.textContent = 'No Video Available';
    }
    if (fallbackSubtitle) {
      fallbackSubtitle.innerHTML = `No video lesson is configured for <strong>${escapeHtml(chapterTitle)}</strong>.<br>Video lesson is currently available for <strong>Class 10 &rarr; Science &rarr; Nervous System (Control &amp; Coordination)</strong>.`;
    }

    if (sourceBadge) {
      sourceBadge.innerHTML = '<i data-lucide="video-off" style="width: 14px; height: 14px; color: #64748b;"></i> No Video';
      sourceBadge.style.color = '#64748b';
      sourceBadge.style.background = '#f1f5f9';
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function restartTeacherVideo() {
  const player = document.getElementById('teacherVideoPlayer');
  if (player) {
    player.currentTime = 0;
    player.play().catch(() => {});
  }
}

function changeTeacherVideoSpeed(speed) {
  const player = document.getElementById('teacherVideoPlayer');
  if (player) {
    player.playbackRate = parseFloat(speed) || 1.0;
  }
}

function toggleTeacherVideoFullscreen() {
  const player = document.getElementById('teacherVideoPlayer');
  if (!player) return;

  if (!document.fullscreenElement) {
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (player.msRequestFullscreen) {
      player.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
