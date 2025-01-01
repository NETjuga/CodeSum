function initSnow() {
    const snowCanvas = document.getElementById('snow-canvas');
    const ctx = snowCanvas.getContext('2d');

    const snowflakes = [];
    const maxSnowflakes = 50;
    const spawnInterval = 200;
    let currentSnowflakes = 0;
    let lastSpawnTime = 0;

    function resizeCanvas() {
        snowCanvas.width = window.innerWidth;
        snowCanvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Snowflake {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * snowCanvas.width;
            this.y = 0;
            this.size = Math.random() * 3 + 2;
            this.speed = Math.random() * 1 + 0.5;
            this.wind = Math.random() * 0.5 - 0.25;
        }

        update() {
            this.y += this.speed;
            this.x += this.wind;

            if (this.y > snowCanvas.height) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    function animate(currentTime) {
        ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

        if (currentSnowflakes < maxSnowflakes && currentTime - lastSpawnTime > spawnInterval) {
            snowflakes.push(new Snowflake());
            currentSnowflakes++;
            lastSpawnTime = currentTime;
        }

        snowflakes.forEach(snowflake => {
            snowflake.update();
            snowflake.draw();
        });

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function copyText(elementId) {
    // Get the specific container for the section
    let containerSelector;
    switch(elementId) {
        case 'bullet-points':
            containerSelector = '#bullet_points';
            break;
        case 'detailed-essay':
            containerSelector = '#detailed_essay';
            break;
        case 'navigation-guide':
            containerSelector = '#navigation_guide';
            break;
        default:
            console.error('Invalid element ID');
            return;
    }

    // Get the text content, removing any Prism highlighting if present
    const container = document.querySelector(containerSelector);
    const textToCopy = container.textContent || container.innerText;

    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
        const button = event.currentTarget;
        const originalText = button.innerHTML;
        
        // Change button text to "COPIED!"
        button.innerHTML = 'COPIED!';
        
        // Revert back after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}
function detectLanguage(code) {
    // Simple language detection logic
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'javascript';
    if (code.includes('#!/bin/') || code.includes('&&')) return 'bash';
    return 'javascript'; // default
}

function highlightCode(code) {
    const language = detectLanguage(code);
    return `<pre class="language-${language} rounded-lg"><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
}

// Add error tracking and logging
function logError(error) {
    console.error('Application Error:', error);
    // Optional: Send error to monitoring service
}

// Enhanced fetch with timeout and error handling
async function safeFetch(url, options = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(id);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        clearTimeout(id);
        logError(error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('summaryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const resultsSection = document.getElementById('results');
        const submitButton = e.target.querySelector('button[type="submit"]');
        const inputText = document.getElementById('input_text').value;
        
        submitButton.disabled = true;
        submitButton.innerHTML = 'Generating...';
        
        const sections = ['bullet_points', 'detailed_essay', 'navigation_guide'];
        sections.forEach(section => {
            document.getElementById(section).innerHTML = `Generating ${section.replace('_', ' ')}...`;
        });

        try {
            console.log('Starting API call...');
            
            const response = await fetch('http://localhost:3000/api/summarize', {
                method: 'POST',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: inputText })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response received:', data);

            document.getElementById('bullet_points').innerHTML = formatBulletPoints(data.bulletPoints);
            document.getElementById('detailed_essay').innerHTML = data.detailedEssay;
            document.getElementById('navigation_guide').innerHTML = highlightCode(data.navigationGuide);

            Prism.highlightAll();
            resultsSection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Detailed error:', error);
            sections.forEach(section => {
                document.getElementById(section).innerHTML = `Error: ${error.message}`;
            });
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Generate Summaries';
        }
    });
});

function formatBulletPoints(points) {
    return points
        .map(point => `<li class="mb-2">• ${point.replace(/^-\s*/, '')}</li>`)
        .join('');
}

function highlightCode(code) {
    const language = detectLanguage(code);
    return `<pre class="language-${language} rounded-lg"><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
}

function detectLanguage(code) {
    // Simple language detection logic
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'javascript';
    if (code.includes('#!/bin/') || code.includes('&&')) return 'bash';
    return 'javascript'; // default
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "")
         .replace(/'/g, "'");
}