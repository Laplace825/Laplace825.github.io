// Welcome Page JavaScript
(function() {
  'use strict';
  
  // Default configuration
  const config = {
    enable: true,
    title: document.title || 'Welcome',
    subtitle: '欢迎来到我的博客世界 🌟',
    autoHide: false,
    showOnEveryVisit: true, // Show welcome page on every visit
    showSocialLinks: true // Show social links in welcome page
  };
  
  // Override with Hugo config if available
  if (typeof window.welcomePageConfig !== 'undefined') {
    Object.assign(config, window.welcomePageConfig);
    console.log('Welcome page: Using config from Hugo:', config);
  } else {
    console.log('Welcome page: Using default config:', config);
  }
  
  // Social links configuration (can be customized)
  // This will be overridden by welcomeSocialConfig if available
  let socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/Laplace825',
      icon: 'fab fa-github',
      color: '#333'
    },
    {
      name: 'Email',
      url: 'mailto:laplace_yongle_he@163.com',
      icon: 'fa fa-envelope',
      color: '#ea4335'
    }
  ];
  
  // Use social links from Hugo config if available
  if (typeof window.welcomeSocialConfig !== 'undefined') {
    socialLinks = Object.values(window.welcomeSocialConfig).map(social => ({
      name: social.name,
      url: social.url,
      icon: social.icon,
      color: getSocialColor(social.name) // Get color based on platform
    }));
    console.log('Welcome page: Using social links from config:', socialLinks);
  } else {
    console.log('Welcome page: Using default social links:', socialLinks);
  }
  
  // Helper function to get colors for different social platforms
  function getSocialColor(name) {
    const colors = {
      'Github': '#333',
      'GitHub': '#333',
      'E-Mail': '#ea4335',
      'Email': '#ea4335',
      'Twitter': '#1da1f2',
      'Facebook': '#1877f2',
      'Instagram': '#e4405f',
      'LinkedIn': '#0077b5',
      'YouTube': '#ff0000',
      'Telegram': '#0088cc',
      'WhatsApp': '#25d366',
      'Discord': '#7289da',
      'Skype': '#00aff0',
      '知乎': '#0084ff'
    };
    return colors[name] || '#667eea';
  }
  
  // Check if welcome page was dismissed in current session
  console.log('Checking session storage...');
  console.log('config.showOnEveryVisit:', config.showOnEveryVisit);
  
  // For showOnEveryVisit mode, check if we've already shown the welcome page in this session
  const sessionKey = config.showOnEveryVisit ? 'welcome-shown-in-session' : 'welcome-dismissed';
  const alreadyHandled = sessionStorage.getItem(sessionKey);
  console.log('alreadyHandled:', alreadyHandled);
  
  function createWelcomePage() {
    console.log('createWelcomePage called');
    console.log('alreadyHandled:', alreadyHandled);
    console.log('config.enable:', config.enable);
    
    // Don't show welcome page if already handled in this session or if disabled
    if (alreadyHandled || !config.enable) {
      console.log('Welcome page creation skipped - already handled or disabled');
      return;
    }
    
    console.log('Creating welcome page...');
    
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'welcome-overlay';
    welcomeOverlay.id = 'welcome-overlay';
    
    // Create wave glow effect element
    const waveGlow = document.createElement('div');
    waveGlow.className = 'wave-glow';
    
    // Create particles
    const particlesDiv = document.createElement('div');
    particlesDiv.className = 'welcome-particles';
    for (let i = 0; i < 9; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particlesDiv.appendChild(particle);
    }
    
    // Create welcome content
    const welcomeContent = document.createElement('div');
    welcomeContent.className = 'welcome-content';
    
    // Generate social links HTML
    let socialLinksHTML = '';
    if (config.showSocialLinks && socialLinks.length > 0) {
      socialLinksHTML = `
        <table class="welcome-social">
          <tr>
            <td class="social-text">[👉 Contact Me]</td>
            <td class="social-links">
              ${socialLinks.map(link => `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="social-link" title="${link.name}">
                  <i class="${link.icon}"></i>
                </a>
              `).join('')}
            </td>
          </tr>
        </table>
      `;
    }
    
    welcomeContent.innerHTML = `
      <div class="welcome-header">
        <div class="welcome-avatar">
          <img src="${config.avatarUrl || '/imgs/AnnaYanami.png'}" alt="Avatar" />
        </div>
        <div class="welcome-text">
          <h1 class="welcome-title">${config.title}</h1>
          <p class="welcome-subtitle" id="welcome-subtitle"></p>
        </div>
      </div>
      <div class="welcome-divider"></div>
      ${socialLinksHTML}
      <button class="welcome-button" onclick="hideWelcomePage()">进入博客</button>
    `;
    
    welcomeOverlay.appendChild(waveGlow);
    welcomeOverlay.appendChild(particlesDiv);
    welcomeOverlay.appendChild(welcomeContent);
    
    // Add to body
    document.body.appendChild(welcomeOverlay);
    console.log('Welcome overlay added to body:', welcomeOverlay);
    
    // Start typewriter animation for subtitle
    startTypewriterAnimation(config.subtitle);
    
    // Double check if element exists in DOM
    setTimeout(() => {
      const check = document.getElementById('welcome-overlay');
      console.log('Welcome overlay check after 100ms:', check);
      if (check) {
        console.log('Welcome overlay styles:', window.getComputedStyle(check));
      }
    }, 100);
    
    // Prevent scrolling when welcome page is shown
    document.body.style.overflow = 'hidden';
    
    // Mark as shown for current session (only for showOnEveryVisit mode)
    if (config.showOnEveryVisit) {
      sessionStorage.setItem('welcome-shown-in-session', 'true');
    }
  }
  
  // Typewriter animation function
  function startTypewriterAnimation(text) {
    const subtitleElement = document.getElementById('welcome-subtitle');
    if (!subtitleElement) return;
    
    let index = 0;
    let currentText = '';
    const typingSpeed = 100; // milliseconds per character
    const pauseAtEnd = 2000; // pause at the end before deleting
    const deleteSpeed = 50; // milliseconds per character deletion
    const pauseBeforeRestart = 1000; // pause before restarting
    
    function typeCharacter() {
      if (index < text.length) {
        currentText += text.charAt(index);
        subtitleElement.innerHTML = currentText + '<span class="typewriter-cursor">|</span>';
        index++;
        setTimeout(typeCharacter, typingSpeed);
      } else {
        // Animation complete, show blinking cursor and then start deleting
        setTimeout(() => {
          subtitleElement.innerHTML = currentText + '<span class="typewriter-cursor-blink">|</span>';
          setTimeout(startDeleting, pauseAtEnd);
        }, 500);
      }
    }
    
    function startDeleting() {
      function deleteCharacter() {
        if (currentText.length > 0) {
          currentText = currentText.slice(0, -1);
          subtitleElement.innerHTML = currentText + '<span class="typewriter-cursor">|</span>';
          setTimeout(deleteCharacter, deleteSpeed);
        } else {
          // Deletion complete, restart the animation
          setTimeout(() => {
            index = 0;
            typeCharacter();
          }, pauseBeforeRestart);
        }
      }
      deleteCharacter();
    }
    
    // Start typing animation after a small delay
    setTimeout(typeCharacter, 800); // Wait for title animation to start
  }
  
  function hideWelcomePage() {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (welcomeOverlay) {
      welcomeOverlay.classList.add('hidden');
      
      // Remove the overlay after animation
      setTimeout(() => {
        welcomeOverlay.remove();
        document.body.style.overflow = '';
        
        // Mark as handled for current session
        const sessionKey = config.showOnEveryVisit ? 'welcome-shown-in-session' : 'welcome-dismissed';
        sessionStorage.setItem(sessionKey, 'true');
      }, 800);
    }
  }
  
  // Auto hide after configured time if user doesn't click
  function autoHideWelcomePage() {
    // autoHide is now just a boolean - true to enable auto-hide, false to disable
    if (config.autoHide === true) {
      console.log('Welcome page: Auto-hide enabled (10 seconds)');
      setTimeout(() => {
        if (document.getElementById('welcome-overlay')) {
          hideWelcomePage();
        }
      }, 10000); // Default 10 seconds
    } else {
      console.log('Welcome page: Auto-hide disabled');
    }
  }
  
  // Make hideWelcomePage globally available
  window.hideWelcomePage = hideWelcomePage;
  
  // Development helper: reset session dismissed status
  window.resetWelcomeVisited = function() {
    sessionStorage.removeItem('welcome-dismissed');
    sessionStorage.removeItem('welcome-shown-in-session');
    console.log('Welcome page session status has been reset. Refresh to see the welcome page again.');
  };
  
  // Development helper: force show welcome page
  window.forceShowWelcome = function() {
    console.log('Force showing welcome page...');
    createWelcomePage();
  };
  
  // Development helper: check if welcome page exists
  window.checkWelcome = function() {
    const overlay = document.getElementById('welcome-overlay');
    console.log('Welcome overlay element:', overlay);
    if (overlay) {
      console.log('Welcome overlay computed styles:', window.getComputedStyle(overlay));
    }
    return overlay;
  };
  
  // Initialize when DOM is ready
  console.log('Welcome page script loaded');
  if (document.readyState === 'loading') {
    console.log('DOM not ready, adding event listener');
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOMContentLoaded event fired');
      createWelcomePage();
      autoHideWelcomePage();
    });
  } else {
    console.log('DOM already ready, creating welcome page immediately');
    createWelcomePage();
    autoHideWelcomePage();
  }
  
  // Add keyboard support (ESC to close)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('welcome-overlay')) {
      hideWelcomePage();
    }
  });
  
})();
