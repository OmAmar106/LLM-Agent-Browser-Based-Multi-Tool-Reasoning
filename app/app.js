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
        
        await this.delay(800 + Math.random() * 1200);
        
        const agentResponse = this.generateAgentResponse(message);
        this.updateLoadingMessage(loadingId, agentResponse);
        this.addMessageToChat('agent', agentResponse);
        
        if (this.selectedTool) {
            await this.delay(500);
            await this.executeTool(this.selectedTool, message);
            
            this.toolButtons.forEach(btn => btn.classList.remove('active'));
            this.selectedTool = null;
        }
        
        this.isProcessing = false;
        this.updateSendButton(true);
        this.updateChatList();
    }
    
    generateAgentResponse(userMessage) {
        const responses = [
            "I'll help you with that request.",
            "Let me analyze that for you.",
            "I understand what you're looking for.",
            "I'll process that information for you.",
            "That's a great question. Let me help."
        ];
        
        if (this.selectedTool) {
            const toolResponses = {
                search: `I'll search for information about "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}" for you.`,
                code: `I'll execute the code and show you the results.`,
                aipipe: `I'll run that through the AI pipeline workflow.`
            };
            return toolResponses[this.selectedTool] || responses[0];
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    async executeTool(tool, message) {
        let toolOutput = this.generateToolOutput(tool, message);
        this.addToolMessage(tool, toolOutput.content, toolOutput.type);
        this.addMessageToChat('tool', `${tool}: ${toolOutput.content}`, { tool, type: toolOutput.type });
    }
    
    generateToolOutput(tool, input) {
        switch (tool) {
            case 'search':
                return {
                    type: 'markdown',
                    content: `**Search Results for "${input.substring(0, 30)}${input.length > 30 ? '...' : ''}"**

• Latest developments and current trends in the field
• Relevant documentation and technical resources  
• Industry insights and expert analysis
• Community discussions and best practices
• Research papers and case studies`
                };
                
            case 'code':
                return {
                    type: 'javascript',
                    content: `// JavaScript Code Execution
function processData(input) {
    const result = {
        input: input,
        processed: true,
        timestamp: new Date().toISOString(),
        length: input.length,
        words: input.split(' ').length
    };
    
    console.log('Processing result:', result);
    return result;
}

const userInput = "${input.replace(/"/g, '\\"').substring(0, 100)}";
const output = processData(userInput);

// Output: ${JSON.stringify({
                        processed: true,
                        timestamp: new Date().toISOString(),
                        length: input.length,
                        words: input.split(' ').length
                    }, null, 2)}`
                };
                
            case 'aipipe':
                return {
                    type: 'yaml',
                    content: `# AI Pipeline Execution Results
pipeline:
  name: "text-analysis-workflow"
  version: "2.1.0"
  execution_id: "exec_${Date.now()}"
  
stages:
  - stage: "preprocessing"
    status: "completed"
    duration: "0.${Math.floor(Math.random() * 500) + 100}s"
    
  - stage: "analysis"
    status: "completed" 
    duration: "${Math.floor(Math.random() * 2) + 1}.${Math.floor(Math.random() * 900) + 100}s"
    
  - stage: "output"
    status: "completed"
    duration: "0.${Math.floor(Math.random() * 200) + 50}s"

results:
  confidence: ${(Math.random() * 0.3 + 0.7).toFixed(2)}
  tokens_processed: ${input.split(' ').length}
  categories: ["analysis", "processing", "nlp"]
  
metrics:
  total_duration: "${(Math.random() * 3 + 1).toFixed(3)}s"
  memory_usage: "${(Math.random() * 50 + 20).toFixed(1)}MB"`
                };
                
            default:
                return {
                    type: 'text',
                    content: 'Tool execution completed.'
                };
        }
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
            .replace(/^• (.+)$/gm, '<li>$1</li>')
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
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AI Agent Interface...');
    new AIAgentInterface();
});