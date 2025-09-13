class SimonGame {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.round = 0;
        this.score = 0;
        this.isPlaying = false;
        this.isShowingSequence = false;
        this.isPlayerTurn = false;
        this.gameActive = false;
        
        // Audio context for sound generation
        this.audioContext = null;
        this.sounds = {
            red: 261.63,    // C4
            blue: 329.63,   // E4
            yellow: 392.00, // G4
            green: 523.25   // C5
        };
        
        // Difficulty settings
        this.difficulties = {
            easy: { delay: 1200, name: 'Easy' },
            medium: { delay: 800, name: 'Medium' },
            hard: { delay: 500, name: 'Hard' }
        };
        
        this.currentDifficulty = 'medium';
        
        // DOM elements
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeAudio();
        
        this.updateDisplay();
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.scoreElement = document.getElementById('score');
        this.roundElement = document.getElementById('round');
        this.messageElement = document.getElementById('message');
        this.difficultySelect = document.getElementById('difficulty-select');
        
        this.buttons = {
            red: document.getElementById('red'),
            blue: document.getElementById('blue'),
            yellow: document.getElementById('yellow'),
            green: document.getElementById('green')
        };
        
        this.colors = ['red', 'blue', 'yellow', 'green'];
    }
    
    initializeEventListeners() {
        // Control buttons
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        // Difficulty selector
        this.difficultySelect.addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
        });
        
        // Simon buttons
        Object.keys(this.buttons).forEach(color => {
            this.buttons[color].addEventListener('click', () => this.handlePlayerInput(color));
            
            // Add visual feedback for button press
            this.buttons[color].addEventListener('mousedown', () => {
                if (this.isPlayerTurn) {
                    this.buttons[color].classList.add('active');
                }
            });
            
            this.buttons[color].addEventListener('mouseup', () => {
                this.buttons[color].classList.remove('active');
            });
            
            this.buttons[color].addEventListener('mouseleave', () => {
                this.buttons[color].classList.remove('active');
            });
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    initializeAudio() {
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(color, duration = 300) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = this.sounds[color];
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    playSuccessSound() {
        if (!this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }
    
    playErrorSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 150; // Low frequency for error
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    startGame() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.gameActive = true;
        this.isPlaying = true;
        this.sequence = [];
        this.playerSequence = [];
        this.round = 0;
        this.score = 0;
        
        this.updateDisplay();
        this.updateMessage('Get ready!', 'info');
        this.disableControls();
        
        setTimeout(() => {
            this.nextRound();
        }, 1000);
    }
    
    resetGame() {
        this.gameActive = false;
        this.isPlaying = false;
        this.isShowingSequence = false;
        this.isPlayerTurn = false;
        this.sequence = [];
        this.playerSequence = [];
        this.round = 0;
        this.score = 0;
        
        this.updateDisplay();
        this.updateMessage('Press START to begin!', '');
        this.enableControls();
        this.enableButtons();
    }
    
    nextRound() {
        this.round++;
        this.playerSequence = [];
        
        // Add random color to sequence
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);
        
        this.updateDisplay();
        this.updateMessage(`Round ${this.round} - Watch carefully!`, 'info');
        
        setTimeout(() => {
            this.showSequence();
        }, 1000);
    }
    
    showSequence() {
        this.isShowingSequence = true;
        this.isPlayerTurn = false;
        this.disableButtons();
        
        const delay = this.difficulties[this.currentDifficulty].delay;
        
        this.sequence.forEach((color, index) => {
            setTimeout(() => {
                this.lightUpButton(color);
                this.playSound(color);
                
                // If this is the last color in sequence, prepare for player input
                if (index === this.sequence.length - 1) {
                    setTimeout(() => {
                        this.isShowingSequence = false;
                        this.isPlayerTurn = true;
                        this.enableButtons();
                        this.updateMessage('Your turn! Repeat the sequence.', 'info');
                    }, delay);
                }
            }, index * delay);
        });
    }
    
    lightUpButton(color) {
        const button = this.buttons[color];
        button.classList.add('playing');
        
        setTimeout(() => {
            button.classList.remove('playing');
        }, this.difficulties[this.currentDifficulty].delay * 0.7);
    }
    
    handlePlayerInput(color) {
        if (!this.isPlayerTurn || this.isShowingSequence) return;
        
        this.playSound(color);
        this.playerSequence.push(color);
        
        // Check if current input matches the sequence
        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.gameOver(false);
            return;
        }
        
        // Check if player completed the sequence
        if (this.playerSequence.length === this.sequence.length) {
            this.score += this.round * 10; // Bonus points for higher rounds
            this.updateDisplay();
            
            this.isPlayerTurn = false;
            this.disableButtons();
            
            if (this.round >= 20) {
                this.gameOver(true); // Won the game!
            } else {
                this.updateMessage('Correct! Get ready for the next round...', 'success');
                this.playSuccessSound();
                
                setTimeout(() => {
                    this.nextRound();
                }, 1500);
            }
        }
    }
    
    gameOver(won = false) {
        this.gameActive = false;
        this.isPlaying = false;
        this.isPlayerTurn = false;
        this.isShowingSequence = false;
        
        this.disableButtons();
        this.enableControls();
        
        if (won) {
            this.updateMessage(`🎉 You won! Perfect score: ${this.score}`, 'success');
            this.playSuccessSound();
        } else {
            this.updateMessage(`Game Over! Final score: ${this.score}`, 'error');
            this.playErrorSound();
            
            // Flash the correct button
            const correctColor = this.sequence[this.playerSequence.length - 1];
            if (correctColor) {
                this.lightUpButton(correctColor);
            }
        }
    }
    
    handleKeyPress(event) {
        if (!this.isPlayerTurn) return;
        
        const keyMap = {
            '1': 'red',
            '2': 'blue',
            '3': 'yellow',
            '4': 'green',
            'q': 'red',
            'w': 'blue',
            'a': 'yellow',
            's': 'green'
        };
        
        const color = keyMap[event.key.toLowerCase()];
        if (color) {
            this.handlePlayerInput(color);
        }
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.roundElement.textContent = this.round;
    }
    
    updateMessage(message, type = '') {
        this.messageElement.textContent = message;
        this.messageElement.className = 'message ' + type;
    }
    
    disableControls() {
        this.startBtn.disabled = true;
        this.difficultySelect.disabled = true;
    }
    
    enableControls() {
        this.startBtn.disabled = false;
        this.difficultySelect.disabled = false;
    }
    
    disableButtons() {
        Object.values(this.buttons).forEach(button => {
            button.disabled = true;
        });
    }
    
    enableButtons() {
        Object.values(this.buttons).forEach(button => {
            button.disabled = false;
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SimonGame();
    
    // Add some helpful information
    console.log('Simon Says Game Controls:');
    console.log('- Click buttons with mouse');
    console.log('- Use keyboard: Q=Red, W=Blue, A=Yellow, S=Green');
    console.log('- Or use numbers: 1=Red, 2=Blue, 3=Yellow, 4=Green');
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimonGame;
}
