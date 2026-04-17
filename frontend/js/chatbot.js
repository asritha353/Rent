// frontend/js/chatbot.js — Floating AI assistant widget
(function initChatbot() {
  const user = getUser();
  if (!user) return;   // Only show when logged in

  document.body.insertAdjacentHTML('beforeend', `
    <div id="chatbot-widget">
      <button id="chat-toggle" onclick="toggleChat()" title="Ask RentLux AI">
        <span id="chat-icon">💬</span>
      </button>
      <div id="chat-window" class="chat-hidden">
        <div class="chat-header">
          <div class="chat-avatar">🤖</div>
          <div>
            <div class="chat-name">RentLux AI</div>
            <div class="chat-status">● Online</div>
          </div>
          <button onclick="toggleChat()" class="chat-close" title="Close">✕</button>
        </div>
        <div id="chat-messages">
          <div class="chat-msg bot">
            <div class="msg-bubble">
              Hi <strong>${escapeHtml(user.name)}</strong>! 👋 I'm your RentLux AI assistant.<br><br>
              I can help you find properties, explain the rental process, or answer any questions about RentLux. What would you like to know?
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Ask anything…" onkeydown="if(event.key==='Enter')sendChat()">
          <button onclick="sendChat()" title="Send">➤</button>
        </div>
      </div>
    </div>`);
})();

function toggleChat() {
  const win = document.getElementById('chat-window');
  if (!win) return;
  win.classList.toggle('chat-hidden');
  if (!win.classList.contains('chat-hidden')) {
    document.getElementById('chat-input')?.focus();
    scrollChatBottom();
  }
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg   = input?.value?.trim();
  if (!msg) return;

  appendMsg(msg, 'user');
  input.value = '';

  const typing = appendMsg('Thinking…', 'bot typing');

  try {
    const res = await chatAPI.send(msg, window.location.pathname);
    typing.remove();
    appendMsg(res.data.reply, 'bot');
  } catch (err) {
    typing.remove();
    appendMsg('Sorry, I couldn\'t respond right now. Please try again.', 'bot');
  }
}

function appendMsg(text, cls) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${cls.includes('user') ? 'user' : 'bot'}${cls.includes('typing') ? ' typing' : ''}`;
  div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  container.appendChild(div);
  scrollChatBottom();
  return div;
}

function scrollChatBottom() {
  const c = document.getElementById('chat-messages');
  if (c) c.scrollTop = c.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
