class AIAgentInterface {
    constructor() {
        this.currentModel = 'gpt-4-turbo';
        this.selectedTool = null;
        this.isProcessing = false;
        this.sidebarVisible = true;

        this.chats = [];
        this.currentChatId = null;
        this.chatCounter = 0;

        this.titleGenerationRules = [
            { pattern: ["integrate", "integration", "api"], template: "{subject} Integration" },
            { pattern: ["review", "check", "audit"], template: "{subject} Review" },
            { pattern: ["debug", "fix", "error", "bug"], template: "Debug {subject}" },
            { pattern: ["create", "build", "make", "generate"], template: "{subject} Creation" },
            { pattern: ["optimize", "improve", "performance"], template: "{subject} Optimization" },
            { pattern: ["help", "how to", "tutorial"], template: "{subject} Help" }
        ];

        this.tools = [
            { name: "search", description: "Web search functionality", enabled: true },
            { name: "code", description: "JavaScript code execution", enabled: true },
            { name: "aipipe", description: "AI pipeline workflows", enabled: true }
        ];

        this.initializeElements();
        this.bindEvents();
        this.setupAutoResize();
        this.updateChatList();
        this.updateWelcomeState();
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.modelSelector = document.getElementById('modelSelector');

        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.chatSidebar = document.getElementById('chatSidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatList = document.getElementById('chatList');

        this.toolButtons = document.querySelectorAll('.tool-button');

        console.log('Elements initialized:', {
            messagesContainer: !!this.messagesContainer,
            messageInput: !!this.messageInput,
            sendButton: !!this.sendButton,
            chatSidebar: !!this.chatSidebar
        });
    }

    bindEvents() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (this.modelSelector) {
            this.modelSelector.addEventListener('change', (e) => {
                this.currentModel = e.target.value;
                console.log('Model changed to:', this.currentModel);
            });
        }

        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.hideSidebar());
        }

        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.startNewChat());
        }

        this.toolButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleTool(button));
        });

        window.addEventListener('resize', () => this.handleResize());

        this.handleResize();
    }

    setupAutoResize() {
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
            });
        }
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && this.sidebarVisible) {
            this.chatSidebar?.classList.add('visible');
            this.sidebarOverlay?.classList.add('visible');
        } else if (!isMobile) {
            this.chatSidebar?.classList.remove('visible');
            this.sidebarOverlay?.classList.remove('visible');
            if (this.sidebarVisible) {
                this.chatSidebar?.classList.remove('hidden');
            }
        }
    }

    toggleSidebar() {
        // this.sidebarVisible = !this.sidebarVisible;
        // const isMobile = window.innerWidth <= 768;

        // if (isMobile) {
        //     if (this.sidebarVisible) {
        //         this.chatSidebar?.classList.add('visible');
        //         this.sidebarOverlay?.classList.add('visible');
        //     } else {
        //         this.chatSidebar?.classList.remove('visible');
        //         this.sidebarOverlay?.classList.remove('visible');
        //     }
        // } else {
        //     this.chatSidebar?.classList.toggle('hidden', !this.sidebarVisible);
        // }

        // console.log('Sidebar toggled:', this.sidebarVisible);
    }

    hideSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebarVisible = false;
            this.chatSidebar?.classList.remove('visible');
            this.sidebarOverlay?.classList.remove('visible');
        }
    }

    generateChatTitle(message) {
        // Clean and prepare the message
        const cleanMessage = message.toLowerCase().trim();
        const words = cleanMessage.split(/\s+/);

        // Try to match title generation rules
        for (const rule of this.titleGenerationRules) {
            const matchedPattern = rule.pattern.find(pattern =>
                cleanMessage.includes(pattern)
            );

            if (matchedPattern) {
                let subject = '';
                const patternIndex = words.findIndex(word => word.includes(matchedPattern));

                if (patternIndex !== -1) {
                    const contextWords = [];
                    for (let i = Math.max(0, patternIndex - 2); i < Math.min(words.length, patternIndex + 3); i++) {
                        if (i !== patternIndex && words[i].length > 2) {
                            contextWords.push(words[i]);
                        }
                    }

                    if (contextWords.length > 0) {
                        subject = contextWords.slice(0, 2).join(' ');
                        subject = subject.charAt(0).toUpperCase() + subject.slice(1);
                        return rule.template.replace('{subject}', subject);
                    }
                }
            }
        }

        const significantWords = words
            .filter(word => word.length > 3)
            .slice(0, 3)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1));

        if (significantWords.length > 0) {
            let title = significantWords.join(' ');
            if (title.length > 30) {
                title = title.substring(0, 30) + '...';
            }
            return title;
        }

        let title = message.substring(0, 30);
        if (message.length > 30) {
            title += '...';
        }
        return title.charAt(0).toUpperCase() + title.slice(1);
    }

    formatTimestamp(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;

        return date.toLocaleDateString();
    }

    createNewChat(initialMessage = null) {
        this.chatCounter++;
        const chatId = `chat_${this.chatCounter}_${Date.now()}`;
        const timestamp = new Date();

        const newChat = {
            id: chatId,
            title: initialMessage ? this.generateChatTitle(initialMessage) : `New Chat ${this.chatCounter}`,
            timestamp,
            messages: []
        };

        // Add to beginning of chats array (newest first)
        this.chats.unshift(newChat);
        this.currentChatId = chatId;

        console.log('New chat created:', newChat);
        return newChat;
    }

    startNewChat() {
        this.currentChatId = null;
        this.clearMessages();
        this.updateWelcomeState();
        this.updateChatList();

        if (this.messageInput) {
            this.messageInput.focus();
        }

        if (window.innerWidth <= 768) {
            this.hideSidebar();
        }

        console.log('Started new chat');
    }

    switchToChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        this.currentChatId = chatId;
        this.loadChatMessages(chat);
        this.updateChatList();

        if (window.innerWidth <= 768) {
            this.hideSidebar();
        }

        console.log('Switched to chat:', chatId);
    }

    loadChatMessages(chat) {
        this.clearMessages();
        this.updateWelcomeState();

        chat.messages.forEach(msg => {
            this.addMessageToDOM(msg.role, msg.content, msg.toolData);
        });

        this.scrollToBottom();
    }

    clearMessages() {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
    }

    updateWelcomeState() {
        if (this.messagesContainer) {
            const hasMessages = this.messagesContainer.children.length > 0;
            this.messagesContainer.classList.toggle('welcome-state', !hasMessages);
        }
    }

    updateChatList() {
        if (!this.chatList) return;

        if (this.chats.length === 0) {
            this.chatList.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
                    </svg>
                    <p>No conversations yet</p>
                    <span>Start a new chat to get started</span>
                </div>
            `;
        } else {
            this.chatList.innerHTML = this.chats.map(chat => `
                <div class="chat-item ${chat.id === this.currentChatId ? 'active' : ''}" 
                     data-chat-id="${chat.id}">
                    <div class="chat-title">${chat.title}</div>
                    <div class="chat-timestamp">${this.formatTimestamp(chat.timestamp)}</div>
                </div>
            `).join('');

            this.chatList.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) {
                    const chatId = chatItem.dataset.chatId;
                    this.switchToChat(chatId);
                }
            });
        }
    }

    getCurrentChat() {
        if (!this.currentChatId) return null;
        return this.chats.find(c => c.id === this.currentChatId);
    }

    addMessageToChat(role, content, toolData = null) {
        this.promptForApiKey();

        let chat = this.getCurrentChat();

        if (!chat && role === 'user') {
            chat = this.createNewChat(content);
            this.updateChatList();
        }

        if (chat) {
            chat.messages.push({
                role,
                content,
                toolData,
                timestamp: new Date()
            });
        }
    }

    toggleTool(button) {
        const tool = button.dataset.tool;

        this.toolButtons.forEach(btn => btn.classList.remove('active'));

        if (this.selectedTool === tool) {
            this.selectedTool = null;
        } else {
            this.selectedTool = tool;
            button.classList.add('active');
        }

        console.log('Tool selected:', this.selectedTool);
    }

    async sendMessage() {
        if (!this.messageInput || !this.messagesContainer) return;
        this.promptForApiKey();
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.updateSendButton(false);

        this.updateWelcomeState();

        this.addMessageToChat('user', message);
        this.addMessageToDOM('user', message);

        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        const loadingId = this.addLoadingMessage();

        // await this.delay(800 + Math.random() * 1200);

        const agentResponse = await this.generateAgentResponse(message);
        this.updateLoadingMessage(loadingId, agentResponse);
        this.addMessageToChat('agent', agentResponse);

        // if (this.selectedTool) {
        //     // await this.delay(500);
        //     await this.executeTool(this.selectedTool, message);

        //     this.toolButtons.forEach(btn => btn.classList.remove('active'));
        //     this.selectedTool = null;
        // }

        this.isProcessing = false;
        this.updateSendButton(true);
        this.updateChatList();
    }

    runSandboxedJS(code) {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.setAttribute("sandbox", "allow-scripts");
            document.body.appendChild(iframe);

            function cleanup() {
                window.removeEventListener("message", onMessage);
                document.body.removeChild(iframe);
            }

            function onMessage(event) {
                if (event.source !== iframe.contentWindow) return;
                const { type, value } = event.data;

                if (type === "log") {
                    console.log("[sandbox]", ...value);
                    return;
                }
                if (type === "error") {
                    cleanup();
                    reject(new Error(value));
                }
                if (type === "result") {
                    cleanup();
                    resolve(value);
                }
            }

            window.addEventListener("message", onMessage);

            const injected = `
            <script>
                (async () => {
                    const send = (type, value) => parent.postMessage({ type, value }, "*");

                    ["log","warn","error","info"].forEach(fn => {
                        console[fn] = (...args) => {
                            send("log", [fn, ...args]);
                        };
                    });

                    try {
                        const result = await (async function() {
                            ${code}
                        })();
                        send("result", result);
                    } catch (e) {
                        send("error", e.message);
                    }
                })();
            <\/script>
        `;

            iframe.srcdoc = injected;
        });
    }


    async generateAgentResponse(userMessage) {

        // this.runSandboxedJS(userMessage).then(result => { return result }).catch(err => { console.error(err); return err; })
        // if i need a code execution output! -> provide runSandboxedJs, google search and llm call to the llm and ask which we should use.
        // add the calls used to final answer
        let arr = [];
        return +" Tools Used: "+arr;
    }

    addMessageToDOM(role, content, toolData = null) {
        if (!this.messagesContainer) return null;

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        messageElement.id = messageId;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = content;

        messageElement.appendChild(contentElement);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        return messageId;
    }

    addLoadingMessage() {
        if (!this.messagesContainer) return null;

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageElement = document.createElement('div');
        messageElement.className = 'message agent loading';
        messageElement.id = messageId;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = 'Thinking';

        messageElement.appendChild(contentElement);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        return messageId;
    }

    updateLoadingMessage(messageId, content) {
        if (!messageId) return;

        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.className = 'message agent';
            const contentElement = messageElement.querySelector('.message-content');
            if (contentElement) {
                contentElement.textContent = content;
            }
        }
    }

    addToolMessage(tool, content, contentType) {
        if (!this.messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'message tool';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Tool header
        const toolHeader = document.createElement('div');
        toolHeader.className = 'tool-header';

        const toolIcons = {
            search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                     </svg>`,
            code: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="16,18 22,12 16,6"></polyline>
                      <polyline points="8,6 2,12 8,18"></polyline>
                   </svg>`,
            aipipe: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7v10l10 5 10-5V7z"></path>
                        <polyline points="2,7 12,12 22,7"></polyline>
                        <polyline points="12,22 12,12"></polyline>
                     </svg>`
        };

        const toolNames = {
            search: 'Web Search',
            code: 'Code Execution',
            aipipe: 'AI Pipeline'
        };

        toolHeader.innerHTML = `${toolIcons[tool]} ${toolNames[tool]}`;

        // Tool content
        const toolContent = document.createElement('div');
        toolContent.className = 'tool-content';

        if (contentType && contentType !== 'markdown') {
            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.className = `language-${contentType}`;
            codeElement.textContent = content;
            preElement.appendChild(codeElement);
            toolContent.appendChild(preElement);
        } else {
            toolContent.innerHTML = this.formatMarkdown(content);
        }

        messageContent.appendChild(toolHeader);
        messageContent.appendChild(toolContent);
        messageElement.appendChild(messageContent);

        this.messagesContainer.appendChild(messageElement);

        if (window.Prism && contentType && contentType !== 'markdown') {
            setTimeout(() => {
                Prism.highlightAllUnder(messageElement);
            }, 10);
        }

        this.scrollToBottom();
    }

    formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^â€¢ (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }

    updateSendButton(enabled) {
        if (this.sendButton) {
            this.sendButton.disabled = !enabled;
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 10);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    promptForApiKey() {
        let apiKey = sessionStorage.getItem('llmApiKey');
        if (!apiKey) {
            apiKey = prompt('Please enter your API key to continue:');
            if (apiKey && apiKey.trim() !== '') {
                sessionStorage.setItem('llmApiKey', apiKey.trim());
            } else {
                alert('API key is required to use this app.');
                return this.promptForApiKey();
            }
        }
        return apiKey;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AI Agent Interface...');
    new AIAgentInterface();
});