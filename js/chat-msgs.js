document.addEventListener('DOMContentLoaded', () => {
    const squadCards = document.querySelectorAll('.chat-squad-card');
    const messageList = document.getElementById('chat-message-list');
    const composerForm = document.getElementById('chat-composer');
    const messageField = document.getElementById('chat-message');

    squadCards.forEach(card => {
        card.addEventListener('click', () => {
            squadCards.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-selected', 'false');
            });
            card.classList.add('active');
            card.setAttribute('aria-selected', 'true');
            // Placeholder for future squad switching logic
        });
    });

    composerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = messageField.value.trim();

        if (!message) {
            return;
        }

        const messageArticle = document.createElement('article');
        messageArticle.className = 'chat-message outgoing';
        messageArticle.dataset.author = 'You';

        const header = document.createElement('div');
        header.className = 'chat-message-header';

        const author = document.createElement('span');
        author.textContent = 'You';

        const timestamp = document.createElement('time');
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timestamp.dateTime = now.toISOString();
        timestamp.textContent = `${hours}:${minutes}`;

        header.append(author, timestamp);

        const body = document.createElement('p');
        body.className = 'chat-message-body';
        body.textContent = message;

        messageArticle.append(header, body);
        messageList.appendChild(messageArticle);
        messageList.scrollTop = messageList.scrollHeight;

        composerForm.reset();
        messageField.focus();
    });
});