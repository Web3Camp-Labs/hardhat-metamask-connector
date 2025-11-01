export const styles = `
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.root {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2em;
    padding: 3em 2.5em;
    max-width: 600px;
    width: 100%;
    animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.title {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    margin: 0;
    line-height: 1.2;
}

.subtitle {
    color: #4a5568;
    font-size: 1rem;
    font-weight: 500;
    padding: 0.75em 1.5em;
    background: #f7fafc;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    font-family: 'Monaco', 'Courier New', monospace;
}

.myButton {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 16px 40px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    position: relative;
    overflow: hidden;
    min-width: 200px;
}

.myButton::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
}

.myButton:hover::before {
    left: 100%;
}

.myButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.myButton:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
}

.transitionBox {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.5em;
    gap: 1em;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.transitionBox:hover {
    border-color: #667eea;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    transform: translateY(-2px);
}

.transactionLabel {
    color: #2d3748;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5em;
}

.errorBox {
    background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1em 1.5em;
    display: none;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
    animation: shake 0.5s ease-in-out;
}

.warningBox {
    background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 1em 1.5em;
    display: none;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}

/* Loading animation */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Add visual feedback for connection status */
.subtitle:empty::before {
    content: 'Not Connected';
    color: #a0aec0;
    animation: pulse 2s infinite;
}

/* Responsive design */
@media (max-width: 640px) {
    .container {
        padding: 2em 1.5em;
    }

    .title {
        font-size: 1.5rem;
    }

    .myButton {
        padding: 14px 32px;
        font-size: 0.95rem;
        min-width: 180px;
    }
}
`;
