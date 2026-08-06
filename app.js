// EduMate AI Platform Interactivity Logic

// Initialize Lucide Icons on load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  // Setup default state
  initQuiz();
});

// ==========================================
// 1. VIEW & NAVIGATION MANAGEMENT
// ==========================================

function switchToStudentView(initialTab = 'home') {
  document.getElementById('landingView').classList.remove('active');
  document.getElementById('studentView').classList.add('active');
  switchTab(initialTab);
}

function switchToLandingView() {
  document.getElementById('studentView').classList.remove('active');
  document.getElementById('landingView').classList.add('active');
}

function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.dashboard-tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  // Deactivate all sidebar links
  const menuItems = document.querySelectorAll('.sidebar-item');
  menuItems.forEach(item => item.classList.remove('active'));

  // Show active tab
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Activate sidebar item
  const activeMenuItem = document.getElementById(`side-${tabName}`);
  if (activeMenuItem) {
    activeMenuItem.classList.add('active');
  }

  // Update header title
  const titleMap = {
    'home': 'Home Dashboard',
    'chat': 'AI Chat Tutor',
    'story': 'Illustrated Story Mode',
    'voice': 'Voice Copilot Session',
    'homework': 'Homework Scanner & Helper',
    'quiz': 'AI Quiz Generator',
    'progress': 'Detailed Learning Progress'
  };
  document.getElementById('header-tab-title').textContent = titleMap[tabName] || 'Dashboard';
}


// ==========================================
// 2. WATCH DEMO MODAL
// ==========================================

function playMockDemo() {
  document.getElementById('demoModal').style.display = 'flex';
  document.getElementById('demoStatusText').innerHTML = 'Click Play to see EduMate AI in Action';
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
const explainDatabase = {
  'photosynthesis': {
    default: `<p><strong>Photosynthesis</strong> is the process plants use to make their own food.</p>
              <p>Plants take in <strong>carbon dioxide</strong> from the air, <strong>water</strong> from the soil, and absorb <strong>sunlight</strong> through chlorophyll (the green pigment in leaves).</p>
              <p>They combine these ingredients to produce <strong>glucose (sugar)</strong> for energy and release <strong>oxygen</strong> back into the atmosphere for us to breathe!</p>`,
    simpler: `<p>Think of leaves as tiny solar-powered kitchens! ☀️🍃</p>
              <p>The plant gathers sunlight, water from its roots, and air. It cooks them together to make sweet plant food (sugar) and breathes out fresh oxygen for us!</p>`,
    story: `<p>Once upon a time, a little green leaf named Libby wanted to bake a cake. 🍰</p>
            <p>She got a cup of sunlight from the sun, drank water from the roots below, and caught carbon dioxide floating by. She mixed them up in her green chlorophyll oven, baked it, and created a yummy sugar energy cake. She was so happy she threw away some oxygen molecules as confetti!</p>`,
    example: `<p>Imagine a solar-powered juice maker! 🍹</p>
              <p>You pour in water (soil nutrients) and air, and leave the machine in the sun. The solar panel catches sunlight energy to blend it all up into a delicious sweet energy juice (glucose), while spitting out fresh air (oxygen) as waste!</p>`,
    tamil: `<p><strong>ஒளிச்சேர்க்கை (Photosynthesis)</strong> என்பது தாவரங்கள் தங்களுக்கு தேவையான உணவை தயாரிக்கும் முறையாகும்.</p>
            <p>தாவரங்கள் வேர்கள் மூலம் <strong>நீரையும்</strong>, இலைகள் மூலம் <strong>கார்பன் டை ஆக்சைடையும்</strong> உறிஞ்சி, <strong>சூரிய ஒளியின்</strong> உதவியுடன் தங்களுக்கு தேவையான சர்க்கரை சத்தை தயாரித்து <strong>ஆக்ஸிஜனை</strong> வெளியிடுகின்றன.</p>`
  },
  'evaporation': {
    default: `<p><strong>Evaporation</strong> is the process of a liquid turning into gas.</p>
              <p>When water is heated (like by the sun), the water molecules absorb thermal energy. They begin moving faster and faster until they break free from the liquid surface and float into the sky as invisible <strong>water vapor</strong>.</p>`,
    simpler: `<p>When water gets warm, the tiny water drops get so excited and energetic that they turn invisible and float up into the air as vapor! 💧➡️💨</p>`,
    story: `<p>Meet Splash, a tiny water drop sitting in a puddle. ☀️</p>
            <p>The sun gave Splash a big, warm hug. Splash started jumping up and down, feeling warmer and lighter. Before he knew it, he sprouted invisible wings of vapor and flew high up into the clouds!</p>`,
    example: `<p>Think about hanging wet clothes outside. The sun heats up the water trapped in the shirts. The water turns into invisible vapor and escapes into the air, leaving your shirts dry! 👕☀️</p>`,
    tamil: `<p><strong>நீர் ஆவியாதல் (Evaporation)</strong> என்பது நீர் திரவ நிலையிலிருந்து வாயு நிலைக்கு (நீராவி) மாறும் நிகழ்வு ஆகும்.</p>
            <p>சூரிய வெப்பம் நீரை சூடாக்கும் போது, நீர் மூலக்கூறுகள் வேகமாக இயங்கி மேல்நோக்கி காற்றில் பரவுகின்றன.</p>`
  },
  'fractions': {
    default: `<p>A <strong>fraction</strong> represents a part of a whole.</p>
              <p>It consists of a <strong>numerator</strong> (the top number, representing how many parts we have) and a <strong>denominator</strong> (the bottom number, representing how many total equal parts make the whole).</p>
              <p>For example, if we divide a pizza into 4 parts and eat 1 slice, we consumed <strong>1/4</strong> of the pizza.</p>`,
    simpler: `<p>Fractions are just equal shares of something! 🍕</p>
              <p>The bottom number tells you how many slices we cut the pizza into. The top number tells you how many slices you get to eat.</p>`,
    story: `<p>Pip the Penguin had one giant chocolate bar. 🍫</p>
            <p>He wanted to share it fairly with three of his friends. So he cut it into 4 equal blocks. Each penguin got exactly 1 block. Pip wrote this down in his ledger: "We each got 1 out of 4 slices, or 1/4 of the treasure!"</p>`,
    example: `<p>If you have a set of 8 apples and 2 of them are green, the green apples make up <strong>2/8</strong> of the total group. You can simplify this fraction to <strong>1/4</strong>!</p>`,
    tamil: `<p><strong>பின்னங்கள் (Fractions)</strong> என்பது ஒரு முழு பொருளின் பகுதியை குறிக்கும்.</p>
            <p>மேலே உள்ள எண் <strong>தொகுதி (Numerator)</strong> - நாம் எடுத்த பகுதி; கீழே உள்ள எண் <strong>பகுதி (Denominator)</strong> - முழு பொருளின் மொத்த சம பங்குகள் ஆகும்.</p>`
  }
};

function appendChatMessage(sender, content, key = null) {
  const history = document.getElementById('chatHistory');
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  if (sender === 'ai') {
    avatar.innerHTML = `<div class="bot-avatar" style="width: 32px; height: 32px; font-size: 1rem;">E</div>`;
  } else {
    avatar.innerHTML = `<div class="profile-avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">A</div>`;
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = content;

  // If this is an AI message explaining a concept, append "Explain Again" actions
  if (sender === 'ai' && key && explainDatabase[key]) {
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
    
    // Render voice player icon inside standard explanation bubbles
    const audioWidget = document.createElement('div');
    audioWidget.className = 'chat-voice-widget';
    audioWidget.innerHTML = `
      <button class="play-btn" onclick="playSpeechBubble(this)"><i data-lucide="volume-2"></i></button>
      <div class="voice-wave-canvas">
        <div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div>
      </div>
      <span style="font-size:0.75rem; color:var(--color-sky-dark); font-weight:700;">Listen Explaining</span>
    `;
    bubble.insertBefore(audioWidget, bubble.firstChild);
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Modify existing bubble text when clicking Explain Simpler / Story / etc.
function changeExplanationStyle(conceptKey, style, buttonEl) {
  const bubble = buttonEl.closest('.msg-bubble');
  const textDiv = bubble.querySelector('p') ? bubble : null;
  if (!textDiv) return;

  // Retrieve styled concept explanation
  const newContent = explainDatabase[conceptKey][style];
  if (newContent) {
    // Keep voice widget and action buttons, swap text content
    const voiceWidget = bubble.querySelector('.chat-voice-widget');
    const actionsWidget = bubble.querySelector('.explain-again-wrapper');
    
    bubble.innerHTML = '';
    if (voiceWidget) bubble.appendChild(voiceWidget);
    
    const contentWrap = document.createElement('div');
    contentWrap.innerHTML = newContent;
    bubble.appendChild(contentWrap);
    
    if (actionsWidget) bubble.appendChild(actionsWidget);
    
    // Add micro-animation highlight
    bubble.style.animation = 'none';
    bubble.offsetHeight; /* trigger reflow */
    bubble.style.animation = 'bounceIn 0.4s';
  }
}

// Play speech bubble mock audio
function playSpeechBubble(button) {
  const waveBars = button.parentElement.querySelectorAll('.voice-wave-bar');
  const playIcon = button.querySelector('i');
  
  // Toggle states
  if (playIcon.getAttribute('data-lucide') === 'volume-2') {
    playIcon.setAttribute('data-lucide', 'pause');
    waveBars.forEach((bar, idx) => {
      bar.classList.add('active');
      bar.style.height = `${Math.floor(Math.random() * 15) + 6}px`;
      bar.style.animation = `wavePulse 1s infinite ease-in-out alternate`;
      bar.style.animationDelay = `${idx * 0.15}s`;
    });
    
    // Stop speaking mock audio after 4 seconds
    setTimeout(() => {
      playIcon.setAttribute('data-lucide', 'volume-2');
      waveBars.forEach(bar => {
        bar.classList.remove('active');
        bar.style.height = '4px';
        bar.style.animation = 'none';
      });
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 4000);
  } else {
    playIcon.setAttribute('data-lucide', 'volume-2');
    waveBars.forEach(bar => {
      bar.classList.remove('active');
      bar.style.height = '4px';
      bar.style.animation = 'none';
    });
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// User types a message
function sendChatMessage() {
  const input = document.getElementById('chatMessageInput');
  const text = input.value.trim();
  
  if (!text && !chatAttachment) return;
  
  let userMessageHTML = '';
  if (chatAttachment) {
    userMessageHTML += `<p><i data-lucide="image" style="vertical-align:middle;margin-right:5px;color:var(--color-orange);"></i> <strong>Uploaded attachment:</strong> ${chatAttachment.name}</p>`;
  }
  if (text) {
    userMessageHTML += `<p>${text}</p>`;
  }

  // Clear input fields
  input.value = '';
  const fileDetails = chatAttachment;
  clearChatAttachment();

  // Append user message
  appendChatMessage('student', userMessageHTML);
  
  // Show AI typing simulation
  showAiTypingIndicator();

  // Generate response depending on key phrase matches
  setTimeout(() => {
    removeAiTypingIndicator();
    
    let aiResponse = '';
    let conceptKey = null;

    const lowerText = text.toLowerCase();
    
    if (fileDetails) {
      // Mock homework image analysis response
      aiResponse = `<p>I've scanned the homework file <strong>${fileDetails.name}</strong>!</p>
                    <p>I found the algebra equation: <strong>3x + 9 = 24</strong>.</p>
                    <p>Let's solve it together step-by-step:
                    <ol>
                      <li>Subtract 9 from both sides: <strong>3x = 15</strong>.</li>
                      <li>Divide by 3: <strong>x = 5</strong>.</li>
                    </ol>
                    How does that look? Would you like me to explain the steps in Tamil or with diagrams?</p>`;
      conceptKey = 'fractions'; // triggers standard math explanations
    } else if (lowerText.includes('photo') || lowerText.includes('breath') || lowerText.includes('leaf') || lowerText.includes('plant')) {
      conceptKey = 'photosynthesis';
      aiResponse = explainDatabase.photosynthesis.default;
    } else if (lowerText.includes('evap') || lowerText.includes('water') || lowerText.includes('rain') || lowerText.includes('cloud')) {
      conceptKey = 'evaporation';
      aiResponse = explainDatabase.evaporation.default;
    } else if (lowerText.includes('fraction') || lowerText.includes('divide') || lowerText.includes('math') || lowerText.includes('slice')) {
      conceptKey = 'fractions';
      aiResponse = explainDatabase.fractions.default;
    } else {
      // Default fallback helper dialogue
      aiResponse = `<p>Interesting topic! I don't have this lesson card pre-loaded, but I can break it down. Are we talking about a science concept, a math formula, or language exercises?</p>
                    <p>Try searching: <strong>"Photosynthesis"</strong> or <strong>"Dividing Fractions"</strong> for a full 3D interactive explanation widget!</p>`;
    }

    appendChatMessage('ai', aiResponse, conceptKey);
    
    // Add follow-up suggest tags
    if (conceptKey === 'photosynthesis') {
      appendFollowUps([
        'How does carbon dioxide get inside the leaf?',
        'Tell me the photosynthesis story again'
      ]);
    } else if (conceptKey === 'evaporation') {
      appendFollowUps([
        'Explain condensation next',
        'What happens when water vapor gets cold?'
      ]);
    }
  }, 1500);
}

function showAiTypingIndicator() {
  const history = document.getElementById('chatHistory');
  const indicator = document.createElement('div');
  indicator.className = 'chat-msg ai typing-indicator-msg';
  indicator.id = 'aiTypingIndicator';
  indicator.innerHTML = `
    <div class="msg-avatar"><div class="bot-avatar" style="width: 32px; height: 32px; font-size: 1rem;">E</div></div>
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
// 4. STORY MODE INTERACTIVE GENERATOR
// ==========================================

function generateStoryFromInput() {
  const inputVal = document.getElementById('storyInput').value.trim();
  if (!inputVal) return;

  const placeholder = document.getElementById('storyPlaceholder');
  const contentBox = document.getElementById('storyContentBox');
  const activeTitle = document.getElementById('activeStoryTitle');
  const textContainer = document.getElementById('storyTextContainer');
  const illustration = document.getElementById('storyIllustration');

  placeholder.style.display = 'none';
  contentBox.classList.add('active');
  activeTitle.textContent = `The Story of ${inputVal}`;
  textContainer.innerHTML = 'Writing characters and preparing pages... 📚';
  
  // Set custom illustration depending on keyword
  let iconName = 'book-open';
  if (inputVal.toLowerCase().includes('water') || inputVal.toLowerCase().includes('evap')) iconName = 'droplet';
  else if (inputVal.toLowerCase().includes('plant') || inputVal.toLowerCase().includes('breath')) iconName = 'leaf';
  else if (inputVal.toLowerCase().includes('sun') || inputVal.toLowerCase().includes('solar')) iconName = 'sun';
  else if (inputVal.toLowerCase().includes('gravity')) iconName = 'arrow-down';
  illustration.innerHTML = `<i data-lucide="${iconName}"></i>`;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Story paragraphs to animate
  const paragraphs = [
    `Once upon a time, in a busy neighborhood textbook, lived a small, curious character named **Pip**. Pip was always wondering how ${inputVal} worked.`,
    `One day, Pip woke up to find a magical map. It showed that to understand ${inputVal}, Pip needed to look closely at molecular building blocks. Suddenly, a friendly robot floated into view, offering a glowing magnifying glass.`,
    `"Look at how heat energizes the particles!" the robot explained. Pip peered through the glass and saw molecules starting to dance and jump, breaking free from their standard bonds.`,
    `Pip smiled. "Ah! So that's how it transitions states. It's not magic, it's just science!" From that day forward, Pip taught all the other textbook characters the secrets of ${inputVal}.`
  ];

  textContainer.innerHTML = '';
  
  // Write paragraphs sequentially to make it feel "streamed"
  paragraphs.forEach((pText, index) => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = 'story-paragraph';
      p.innerHTML = pText;
      textContainer.appendChild(p);
      textContainer.scrollTop = textContainer.scrollHeight;
    }, index * 2000);
  });
}


// ==========================================
// 5. VOICE LEARNING (Waveform animations)
// ==========================================

let isVoiceActive = false;
let voiceTimer = null;

function toggleVoiceSession() {
  const startBtn = document.getElementById('voiceStartBtn');
  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  isVoiceActive = !isVoiceActive;

  if (isVoiceActive) {
    startBtn.innerHTML = `<i data-lucide="square"></i> Stop Session`;
    startBtn.className = "btn-3d btn-3d-orange";
    statusTitle.textContent = "EduMate is listening...";
    statusSub.textContent = "Speak into your microphone.";
    waveform.classList.add('listening');
    avatar.textContent = '👂';
    subtitle.innerHTML = "<em>(Listening for your voice input...)</em>";

    // Simulate animated waveform levels
    const bars = waveform.querySelectorAll('span');
    voiceTimer = setInterval(() => {
      bars.forEach(bar => {
        bar.style.height = `${Math.floor(Math.random() * 45) + 8}px`;
      });
    }, 100);

    // Mock Dialogue Flow
    setTimeout(() => {
      if (isVoiceActive) {
        subtitle.innerHTML = "<strong>You:</strong> Explain photosynthesis, please.";
        avatar.textContent = '🤖';
        avatar.classList.add('speaking');
        statusTitle.textContent = "EduMate is speaking...";
        statusSub.textContent = "Playing explanation audio.";
        waveform.classList.remove('listening');
        waveform.classList.add('speaking');

        setTimeout(() => {
          if (isVoiceActive) {
            subtitle.innerHTML = "<strong>AI:</strong> Photosynthesis is how plants bake their food! They take in sunlight, water, and air to make sugars. Do you want me to explain this with a story or simpler?";
          }
        }, 1500);
      }
    }, 4000);

  } else {
    // Reset to idle
    startBtn.innerHTML = `<i data-lucide="play"></i> Start Speaking`;
    startBtn.className = "btn-3d btn-3d-sky";
    statusTitle.textContent = "Ready to talk!";
    statusSub.textContent = "Ask your questions aloud, and hear explanations naturally.";
    waveform.classList.remove('listening', 'speaking');
    avatar.textContent = '🤖';
    avatar.classList.remove('speaking');
    subtitle.innerHTML = "Session ended. Click 'Start Speaking' to begin again.";
    
    clearInterval(voiceTimer);
    const bars = waveform.querySelectorAll('span');
    bars.forEach(bar => bar.style.height = '8px');
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
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

function runHomeworkScan() {
  const placeholder = document.getElementById('scanPlaceholder');
  const results = document.getElementById('scanResults');
  const scanImg = document.getElementById('scanUploadedImage');
  const laser = document.getElementById('scanLaserLine');

  placeholder.style.display = 'none';
  results.style.display = 'none';
  scanImg.style.display = 'block';
  laser.style.display = 'block';

  // Complete scanning after 2.5 seconds
  setTimeout(() => {
    laser.style.display = 'none';
    results.classList.add('active');
  }, 2500);
}


// ==========================================
// 7. AI QUIZ ENGINE
// ==========================================

const quizQuestions = {
  'Science - Evaporation': [
    {
      q: "What provides the main heat energy source for the Earth's evaporation cycles?",
      options: ["A) The core temperature", "B) The Sun", "C) Wind patterns", "D) Ocean waves"],
      correct: 1,
      explain: "The Sun is the driving heat force that warms the surface water of rivers, lakes, and oceans, turning it into vapor."
    },
    {
      q: "During evaporation, water changes from a ______ to a ______.",
      options: ["A) Liquid to Gas", "B) Gas to Solid", "C) Solid to Liquid", "D) Liquid to Solid"],
      correct: 0,
      explain: "Evaporation is the transition of matter from a liquid state into a gaseous state (vapor)."
    },
    {
      q: "What happens to water molecules as they get warmer?",
      options: ["A) They slow down", "B) They clump closer together", "C) They move faster and spread apart", "D) They dissolve entirely"],
      correct: 2,
      explain: "Thermal energy makes molecules vibrate and travel faster, allowing them to bounce away from one another."
    }
  ],
  'Math - Fractions': [
    {
      q: "What is the result when you divide 1/2 by 2?",
      options: ["A) 1", "B) 1/4", "C) 1/3", "D) 2/2"],
      correct: 1,
      explain: "Dividing a half in two leaves you with four equal shares of the whole, which is 1/4."
    },
    {
      q: "In the fraction 3/8, what is the number 8 called?",
      options: ["A) Numerator", "B) Product", "C) Quotient", "D) Denominator"],
      correct: 3,
      explain: "The bottom number is the denominator, indicating the total equal parts that make up a whole."
    }
  ]
};

let currentQuizTopic = '';
let currentQuizDifficulty = '';
let quizIndex = 0;
let quizScore = 0;
let activeQuestions = [];
let quizOptionSelected = null;

function initQuiz() {
  resetQuizView();
}

function resetQuizView() {
  document.getElementById('quizWelcomeScreen').style.display = 'block';
  document.getElementById('quizActiveScreen').style.display = 'none';
  document.getElementById('quizResultsScreen').style.display = 'none';
}

function startMockQuiz() {
  const topicSelect = document.getElementById('quizTopic');
  const diffSelect = document.getElementById('quizDifficulty');
  
  currentQuizTopic = topicSelect.value;
  currentQuizDifficulty = diffSelect.value;

  activeQuestions = quizQuestions[currentQuizTopic] || quizQuestions['Science - Evaporation'];
  
  quizIndex = 0;
  quizScore = 0;

  document.getElementById('quizWelcomeScreen').style.display = 'none';
  document.getElementById('quizActiveScreen').style.display = 'block';
  
  showQuizQuestion();
}

function showQuizQuestion() {
  const question = activeQuestions[quizIndex];
  
  document.getElementById('quizQuestionNumber').textContent = `Question ${quizIndex + 1} of ${activeQuestions.length}`;
  document.getElementById('quizQuestionCategory').textContent = currentQuizTopic.split(' - ')[0];
  document.getElementById('quizQuestionText').textContent = question.q;
  
  // Set progress bar
  const progressPercent = (quizIndex / activeQuestions.length) * 100;
  document.getElementById('quizProgressBar').style.width = `${progressPercent}%`;

  // Render options list
  const list = document.getElementById('quizOptionsList');
  list.innerHTML = '';
  quizOptionSelected = null;

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
    const isCorrect = (quizOptionSelected === question.correct);
    
    // Highlight options
    const options = document.querySelectorAll('.quiz-option-item');
    options.forEach((opt, idx) => {
      if (idx === question.correct) {
        opt.classList.add('correct');
      } else if (idx === quizOptionSelected) {
        opt.classList.add('incorrect');
      }
    });

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
