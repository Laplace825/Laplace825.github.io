/* Math render plugin */
NexT.plugins.others.math = function() {
  console.log('Math plugin called');
  console.log('NexT.CONFIG.page.math:', NexT.CONFIG.page.math);
  
  const render = NexT.CONFIG.page.math.render;
  
  if (render === 'mathjax') {
    const render_js = NexT.utils.getCDNResource(NexT.CONFIG.page.math.js);
    const mathjaxCfg = `
      window.MathJax = {
        // 自定义内联数学公式的分隔符号
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
          processEscapes: true,
          processEnvironments: true,
          packages: {'[+]': ['noerrors']}
        },
        // SVG 渲染配置为全局共享字体缓存
        svg: {
          fontCache: 'global'
        },
        // 排除特定的HTML标签，避免过度渲染
        options: {
          skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          ignoreHtmlClass: "no-mathjax|code"
        },
        startup: {
          ready: function () {
            MathJax.startup.defaultReady();
            console.log('MathJax is loaded and ready.');
          }
        }
      };
    `;
    
    try {
      NexT.utils.getScript(null, { textContent: mathjaxCfg });
      NexT.utils.getScript(render_js, { 
        attributes: { 
          id: "MathJax-script", 
          "async": true 
        },
        onerror: function() {
          console.error('Failed to load MathJax from CDN, trying fallback...');
          // Fallback CDN
          const fallbackUrl = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
          NexT.utils.getScript(fallbackUrl, { 
            attributes: { 
              id: "MathJax-script-fallback", 
              "async": true 
            }
          });
        }
      });
    } catch (error) {
      console.error('Error loading MathJax:', error);
    }
  }

  if (render === 'katex') {
    const render_css = NexT.utils.getCDNResource(NexT.CONFIG.page.math.css);
    const render_js_list = NexT.CONFIG.page.math.js;
    
    // Load CSS with fallback
    try {
      NexT.utils.getStyle(render_css, {
        onerror: function() {
          console.error('Failed to load KaTeX CSS from CDN, trying fallback...');
          const fallbackCss = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
          NexT.utils.getStyle(fallbackCss);
        }
      });
    } catch (error) {
      console.error('Error loading KaTeX CSS:', error);
    }
    
    // Load JS with better error handling
    render_js_list.forEach(js => {
      const js_loader = NexT.utils.getScript(NexT.utils.getCDNResource(js), {
        onerror: function() {
          console.error(`Failed to load ${js.name} from CDN`);
          if (js.name === 'katex') {
            // Fallback for KaTeX main library
            const fallbackUrl = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
            NexT.utils.getScript(fallbackUrl);
          } else if (js.name === 'auto-render') {
            // Fallback for auto-render
            const fallbackUrl = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js';
            NexT.utils.getScript(fallbackUrl).then(function(){
              renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError : false,
                strict: false
              });
            });
          }
        }
      });
      
      if(js.name === 'auto-render') {
        js_loader.then(function(){
          try {
            renderMathInElement(document.body, {
              delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false},
                  {left: '\\(', right: '\\)', display: false},
                  {left: '\\[', right: '\\]', display: true}
              ],
              throwOnError : false,
              strict: false,
              ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
              ignoredClasses: ["no-katex", "code"]
            });
            console.log('KaTeX rendering completed.');
          } catch (error) {
            console.error('Error rendering KaTeX:', error);
          }
        }).catch(function(error) {
          console.error('Error loading auto-render:', error);
        });
      }
    });
  }
}