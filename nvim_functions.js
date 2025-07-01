/**
 * NeoVim Simulator Plugin - JavaScript Functions
 * Handles syntax highlighting, cursor simulation, and text selection processing
 */

console.log('NeoVim Simulator Plugin loaded - v1.0.0');

// Plugin state management
const NeoVimSimulator = {
    initialized: false,
    currentLanguage: {
        CodeBefore: 'JavaScript',
        CodeAfter: 'JavaScript'
    },
    currentMode: {
        CodeBefore: 'Normal',
        CodeAfter: 'Normal'
    },
    
    // Initialize the plugin
    init() {
        if (this.initialized) return;
        
        console.log('Initializing NeoVim Simulator...');
        this.initialized = true;
        
        // Setup any global event listeners or initialization logic here
        this.setupGlobalListeners();
    },
    
    // Setup global event listeners
    setupGlobalListeners() {
        // Listen for field changes or other global events if needed
        document.addEventListener('DOMContentLoaded', () => {
            console.log('NeoVim Simulator: DOM ready');
        });
    },
    
    // Get selected text from a field
    getSelectedText(fieldName) {
        try {
            // Find the field's textarea or content editable area
            const fieldContainer = this.findFieldContainer(fieldName);
            if (!fieldContainer) {
                console.warn('Field container not found for: ' + fieldName);
                return null;
            }
            
            // Try to get selection from the field
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                
                // Calculate position relative to the field content
                let startOffset = 0;
                let endOffset = 0;
                
                try {
                    // Get the field content to calculate relative position
                    const fieldContent = this.getFieldContent(fieldName);
                    if (fieldContent && selectedText) {
                        startOffset = fieldContent.indexOf(selectedText);
                        endOffset = startOffset + selectedText.length;
                    }
                } catch (error) {
                    console.warn('Could not calculate text position:', error);
                    startOffset = 0;
                    endOffset = selectedText.length;
                }
                
                return {
                    text: selectedText,
                    startOffset: startOffset,
                    endOffset: endOffset,
                    range: range
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting selected text:', error);
            return null;
        }
    },
    
    // Find field container by field name
    findFieldContainer(fieldName) {
        const labels = document.querySelectorAll('.label-name');
        for (let label of labels) {
            if (label.textContent.trim() === fieldName) {
                return label.closest('.field-container');
            }
        }
        return null;
    },
    
    // Get field content (text from textarea or contenteditable)
    getFieldContent(fieldName) {
        try {
            const fieldContainer = this.findFieldContainer(fieldName);
            if (!fieldContainer) {
                console.warn('Field container not found for: ' + fieldName);
                return '';
            }
            
            // Try different selectors for field content
            const textareas = fieldContainer.querySelectorAll('textarea');
            const editableElements = fieldContainer.querySelectorAll('[contenteditable="true"]');
            const richTextElements = fieldContainer.querySelectorAll('.rich-text-editable');
            
            // Priority order: visible textarea, contenteditable, rich-text-editable
            if (textareas.length > 0) {
                // Find the visible/active textarea
                for (let textarea of textareas) {
                    if (!textarea.hidden && 
                        textarea.style.display !== 'none' && 
                        textarea.offsetParent !== null) {
                        return textarea.value || '';
                    }
                }
            }
            
            if (richTextElements.length > 0) {
                for (let element of richTextElements) {
                    if (!element.hidden && 
                        element.style.display !== 'none' && 
                        element.offsetParent !== null) {
                        return element.textContent || element.innerText || '';
                    }
                }
            }
            
            if (editableElements.length > 0) {
                for (let element of editableElements) {
                    if (!element.hidden && 
                        element.style.display !== 'none' && 
                        element.offsetParent !== null) {
                        return element.textContent || element.innerText || '';
                    }
                }
            }
            
            return '';
        } catch (error) {
            console.error('Error getting field content for ' + fieldName + ':', error);
            return '';
        }
    },
    
    // Apply syntax highlighting to text
    applySyntaxHighlighting(text, language) {
        if (!text) return '';
        
        // Escape HTML first
        const escapedText = text.replace(/&/g, '&amp;')
                               .replace(/</g, '&lt;')
                               .replace(/>/g, '&gt;')
                               .replace(/"/g, '&quot;')
                               .replace(/'/g, '&#39;');
        
        // Apply language-specific syntax highlighting
        switch (language.toLowerCase()) {
            case 'javascript':
                return this.highlightJavaScript(escapedText);
            case 'python':
                return this.highlightPython(escapedText);
            case 'java':
                return this.highlightJava(escapedText);
            case 'swift':
                return this.highlightSwift(escapedText);
            case 'html':
                return this.highlightHTML(text); // HTML needs special handling
            case 'css':
                return this.highlightCSS(escapedText);
            default:
                return escapedText;
        }
    },
    
    // JavaScript syntax highlighting
    highlightJavaScript(text) {
        // Keywords
        text = text.replace(/\b(function|var|let|const|if|else|for|while|return|class|extends|import|export|async|await|try|catch|finally)\b/g, 
            '<span class="nvim-js-keyword">$1</span>');
        
        // Strings
        text = text.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
            '<span class="nvim-js-string">$1$2$1</span>');
        
        // Numbers
        text = text.replace(/\b(\d+\.?\d*)\b/g, 
            '<span class="nvim-js-number">$1</span>');
        
        // Comments
        text = text.replace(/(\/\/.*$)/gm, 
            '<span class="nvim-js-comment">$1</span>');
        text = text.replace(/(\/\*[\s\S]*?\*\/)/g, 
            '<span class="nvim-js-comment">$1</span>');
        
        return text;
    },
    
    // Python syntax highlighting
    highlightPython(text) {
        // Keywords
        text = text.replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield)\b/g, 
            '<span class="nvim-py-keyword">$1</span>');
        
        // Decorators
        text = text.replace(/(@\w+)/g, 
            '<span class="nvim-py-decorator">$1</span>');
        
        // Strings
        text = text.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, 
            '<span class="nvim-py-string">$1$2$1</span>');
        
        return text;
    },
    
    // Java syntax highlighting
    highlightJava(text) {
        // Keywords
        text = text.replace(/\b(public|private|protected|static|final|class|interface|extends|implements|if|else|for|while|return|new|this|super)\b/g, 
            '<span class="nvim-java-keyword">$1</span>');
        
        // Types
        text = text.replace(/\b(String|int|double|boolean|void|Object|List|ArrayList|HashMap)\b/g, 
            '<span class="nvim-java-type">$1</span>');
        
        // Annotations
        text = text.replace(/(@\w+)/g, 
            '<span class="nvim-java-annotation">$1</span>');
        
        return text;
    },
    
    // Swift syntax highlighting
    highlightSwift(text) {
        // Keywords
        text = text.replace(/\b(func|var|let|if|else|for|while|return|class|struct|enum|protocol|extension|import)\b/g, 
            '<span class="nvim-swift-keyword">$1</span>');
        
        // Types
        text = text.replace(/\b(String|Int|Double|Bool|Array|Dictionary)\b/g, 
            '<span class="nvim-swift-type">$1</span>');
        
        return text;
    },
    
    // HTML syntax highlighting
    highlightHTML(text) {
        // Tags
        text = text.replace(/(&lt;\/?)(\w+)(.*?)(&gt;)/g, 
            '<span class="nvim-tag-bracket">$1</span><span class="nvim-tag-name">$2</span>$3<span class="nvim-tag-bracket">$4</span>');
        
        // Attributes
        text = text.replace(/(\w+)(=)(".*?")/g, 
            '<span class="nvim-attribute-name">$1</span><span class="nvim-equals">$2</span><span class="nvim-attribute-value">$3</span>');
        
        return text;
    },
    
    // CSS syntax highlighting
    highlightCSS(text) {
        // Selectors
        text = text.replace(/^(\s*)([.#]?\w+[-\w]*)\s*{/gm, 
            '$1<span class="nvim-css-selector">$2</span> {');
        
        // Properties
        text = text.replace(/(\w+[-\w]*)\s*:/g, 
            '<span class="nvim-css-property">$1</span>:');
        
        return text;
    },
    
    // Add cursor simulation to text
    addCursorSimulation(text, mode, position) {
        if (!text || position < 0) return text;
        
        const lines = text.split('\n');
        let currentPos = 0;
        let targetLine = 0;
        let targetChar = 0;
        
        // Find the line and character position
        for (let i = 0; i < lines.length; i++) {
            if (currentPos + lines[i].length >= position) {
                targetLine = i;
                targetChar = position - currentPos;
                break;
            }
            currentPos += lines[i].length + 1; // +1 for newline
        }
        
        if (targetLine < lines.length) {
            const line = lines[targetLine];
            let modifiedLine = '';
            
            switch (mode.toLowerCase()) {
                case 'normal':
                    // Block cursor on character
                    if (targetChar < line.length) {
                        modifiedLine = line.substring(0, targetChar) + 
                                     '<span class="nvim-cursor">' + line.charAt(targetChar) + '</span>' + 
                                     line.substring(targetChar + 1);
                    } else {
                        modifiedLine = line + '<span class="nvim-cursor"> </span>';
                    }
                    break;
                    
                case 'insert':
                    // Vertical cursor before character
                    modifiedLine = line.substring(0, targetChar) + 
                                 '<span class="nvim-cursor-insert"></span>' + 
                                 line.substring(targetChar);
                    break;
                    
                case 'visual':
                    // This will be handled separately for ranges
                    modifiedLine = line;
                    break;
                    
                default:
                    modifiedLine = line;
            }
            
            lines[targetLine] = modifiedLine;
        }
        
        return lines.join('\n');
    },
    
    // Add visual selection to text
    addVisualSelection(text, startPos, endPos) {
        if (!text || startPos < 0 || endPos < startPos) return text;
        
        const beforeSelection = text.substring(0, startPos);
        const selection = text.substring(startPos, endPos);
        const afterSelection = text.substring(endPos);
        
        return beforeSelection + 
               '<span class="nvim-visual-selection">' + selection + '</span>' + 
               afterSelection;
    }
};

// Main conversion functions for each field
function convertCodeBefore() {
    console.log('Converting CodeBefore field...');
    
    const language = NeoVimSimulator.currentLanguage.CodeBefore;
    const mode = NeoVimSimulator.currentMode.CodeBefore;
    
    // Get field content
    const fieldContent = NeoVimSimulator.getFieldContent('CodeBefore');
    if (!fieldContent) {
        alert('No content found in CodeBefore field. Please add some code first.');
        return;
    }
    
    // Get selected text information
    const selection = NeoVimSimulator.getSelectedText('CodeBefore');
    if (!selection || !selection.text) {
        alert('Please select some text in the CodeBefore field first.');
        return;
    }
    
    console.log(`Converting with language: ${language}, mode: ${mode}`);
    console.log('Selected text:', selection);
    
    // Apply syntax highlighting
    let highlightedText = NeoVimSimulator.applySyntaxHighlighting(fieldContent, language);
    
    // Add cursor or selection based on mode
    if (mode.toLowerCase() === 'visual') {
        highlightedText = NeoVimSimulator.addVisualSelection(
            highlightedText, 
            selection.startOffset, 
            selection.endOffset
        );
    } else {
        highlightedText = NeoVimSimulator.addCursorSimulation(
            highlightedText, 
            mode, 
            selection.startOffset
        );
    }
    
    // Create preview HTML
    const previewHTML = `
        <div class="nvim-preview">
            <div class="nvim-code-line">${highlightedText.split('\n').join('</div><div class="nvim-code-line">')}</div>
        </div>
    `;
    
    // Display result (for now, we'll show an alert with basic info)
    // In the future, this could update a preview area or the field itself
    console.log('Generated preview HTML:', previewHTML);
    alert(`✅ CodeBefore converted!\nLanguage: ${language}\nMode: ${mode}\nSelected: "${selection.text}"\nPosition: ${selection.startOffset}`);
    
    // TODO: Update field content or show preview
    // This is where we would inject the highlighted content back into the field
}

function convertCodeAfter() {
    console.log('Converting CodeAfter field...');
    
    const language = NeoVimSimulator.currentLanguage.CodeAfter;
    const mode = NeoVimSimulator.currentMode.CodeAfter;
    
    // Get field content
    const fieldContent = NeoVimSimulator.getFieldContent('CodeAfter');
    if (!fieldContent) {
        alert('No content found in CodeAfter field. Please add some code first.');
        return;
    }
    
    // Get selected text information
    const selection = NeoVimSimulator.getSelectedText('CodeAfter');
    if (!selection || !selection.text) {
        alert('Please select some text in the CodeAfter field first.');
        return;
    }
    
    console.log(`Converting with language: ${language}, mode: ${mode}`);
    console.log('Selected text:', selection);
    
    // Apply syntax highlighting
    let highlightedText = NeoVimSimulator.applySyntaxHighlighting(fieldContent, language);
    
    // Add cursor or selection based on mode
    if (mode.toLowerCase() === 'visual') {
        highlightedText = NeoVimSimulator.addVisualSelection(
            highlightedText, 
            selection.startOffset, 
            selection.endOffset
        );
    } else {
        highlightedText = NeoVimSimulator.addCursorSimulation(
            highlightedText, 
            mode, 
            selection.startOffset
        );
    }
    
    // Create preview HTML
    const previewHTML = `
        <div class="nvim-preview">
            <div class="nvim-code-line">${highlightedText.split('\n').join('</div><div class="nvim-code-line">')}</div>
        </div>
    `;
    
    // Display result
    console.log('Generated preview HTML:', previewHTML);
    alert(`✅ CodeAfter converted!\nLanguage: ${language}\nMode: ${mode}\nSelected: "${selection.text}"\nPosition: ${selection.startOffset}`);
    
    // TODO: Update field content or show preview
}

// Language change handlers
function onLanguageChangeCodeBefore(select) {
    const newLanguage = select.value;
    NeoVimSimulator.currentLanguage.CodeBefore = newLanguage;
    console.log('CodeBefore language changed to:', newLanguage);
    
    // Update UI or perform any necessary updates
    updateFieldIndicators('CodeBefore');
}

function onLanguageChangeCodeAfter(select) {
    const newLanguage = select.value;
    NeoVimSimulator.currentLanguage.CodeAfter = newLanguage;
    console.log('CodeAfter language changed to:', newLanguage);
    
    // Update UI or perform any necessary updates
    updateFieldIndicators('CodeAfter');
}

// Mode change handlers
function onModeChangeCodeBefore(select) {
    const newMode = select.value;
    NeoVimSimulator.currentMode.CodeBefore = newMode;
    console.log('CodeBefore mode changed to:', newMode);
    
    // Update UI or perform any necessary updates
    updateFieldIndicators('CodeBefore');
}

function onModeChangeCodeAfter(select) {
    const newMode = select.value;
    NeoVimSimulator.currentMode.CodeAfter = newMode;
    console.log('CodeAfter mode changed to:', newMode);
    
    // Update UI or perform any necessary updates
    updateFieldIndicators('CodeAfter');
}

// Update field indicators (visual feedback)
function updateFieldIndicators(fieldName) {
    const language = NeoVimSimulator.currentLanguage[fieldName];
    const mode = NeoVimSimulator.currentMode[fieldName];
    
    // Find the controls for this field
    const fieldId = fieldName.toLowerCase().replace(' ', '');
    const controlsContainer = document.getElementById(`nvim-controls-${fieldId}`);
    
    if (controlsContainer) {
        // Update any visual indicators
        controlsContainer.title = `${fieldName}: ${language} - ${mode} mode`;
        
        // Could add visual feedback here (like highlighting the active field)
        console.log(`Updated indicators for ${fieldName}: ${language} (${mode})`);
    }
}

// Utility functions
const NeoVimUtils = {
    // Escape HTML for safe display
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Unescape HTML
    unescapeHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },
    
    // Get cursor position in text
    getCursorPosition(element) {
        let cursorPos = 0;
        if (window.getSelection) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                cursorPos = preCaretRange.toString().length;
            }
        }
        return cursorPos;
    },
    
    // Set cursor position in text
    setCursorPosition(element, pos) {
        if (element.createTextRange) {
            const range = element.createTextRange();
            range.move('character', pos);
            range.select();
        } else if (element.selectionStart !== undefined) {
            element.focus();
            element.setSelectionRange(pos, pos);
        }
    },
    
    // Create HTML element from string
    createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    },
    
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize the plugin when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        NeoVimSimulator.init();
    } catch (error) {
        console.error('Error initializing NeoVim Simulator:', error);
    }
});

// Initialize immediately if DOM is already loaded  
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            try {
                NeoVimSimulator.init();
            } catch (error) {
                console.error('Error initializing NeoVim Simulator:', error);
            }
        });
    } else {
        NeoVimSimulator.init();
    }
} catch (error) {
    console.error('Error setting up NeoVim Simulator initialization:', error);
}

// Export for debugging (if needed) - with error handling
try {
    if (typeof window !== 'undefined') {
        window.NeoVimSimulator = NeoVimSimulator;
        window.NeoVimUtils = NeoVimUtils;
    }
} catch (error) {
    console.warn('Could not export NeoVim objects to window:', error);
}