/**
 * NeoVim Simulator Plugin - JavaScript Functions (Parte 1/5)
 * Configuración inicial, gestión de estado y utilidades básicas
 */

console.log('NeoVim Simulator Plugin loading - v1.1.0');

// Configuración global del plugin
const NVIM_CONFIG = {
  VERSION: '1.1.0',
  DEBUG: true,
  SUPPORTED_LANGUAGES: ['HTML', 'JavaScript', 'Python', 'Java', 'Swift', 'CSS'],
  VIM_MODES: ['Normal', 'Insert', 'Visual'],
  DEFAULT_LANGUAGE: 'JavaScript',
  DEFAULT_MODE: 'Normal',
  FIELD_NAMES: ['CodeBefore', 'CodeAfter'],

  // Selectores DOM optimizados
  SELECTORS: {
    fieldContainer: '.field-container',
    labelName: '.label-name',
    richTextEditable: '.rich-text-editable',
    contentEditable: '[contenteditable="true"]',
    textarea: 'textarea',
    fieldContent: '.field-content',
    editorField: '.editor-field textarea',
    editingArea: '.editing-area [contenteditable]',
  },

  // IDs de elementos generados
  IDS: {
    pluginStyle: 'nvim-plugin-style',
    pluginScript: 'nvim-plugin-script',
    controls: (fieldId) => `nvim-controls-${fieldId}`,
    langSelect: (fieldId) => `nvim-lang-${fieldId}`,
    modeSelect: (fieldId) => `nvim-mode-${fieldId}`,
    convertBtn: (fieldId) => `nvim-convert-${fieldId}`,
  },
};

// Estado centralizado del plugin
const NeoVimState = {
  initialized: false,
  currentLanguage: {
    CodeBefore: NVIM_CONFIG.DEFAULT_LANGUAGE,
    CodeAfter: NVIM_CONFIG.DEFAULT_LANGUAGE,
  },
  currentMode: {
    CodeBefore: NVIM_CONFIG.DEFAULT_MODE,
    CodeAfter: NVIM_CONFIG.DEFAULT_MODE,
  },
  eventListenersAttached: false,

  // Getters y setters para el estado
  getLanguage(fieldName) {
    return this.currentLanguage[fieldName] || NVIM_CONFIG.DEFAULT_LANGUAGE;
  },

  setLanguage(fieldName, language) {
    if (NVIM_CONFIG.SUPPORTED_LANGUAGES.includes(language)) {
      this.currentLanguage[fieldName] = language;
      this.log(`Language set for ${fieldName}: ${language}`);
    } else {
      this.warn(`Unsupported language: ${language}`);
    }
  },

  getMode(fieldName) {
    return this.currentMode[fieldName] || NVIM_CONFIG.DEFAULT_MODE;
  },

  setMode(fieldName, mode) {
    if (NVIM_CONFIG.VIM_MODES.includes(mode)) {
      this.currentMode[fieldName] = mode;
      this.log(`Mode set for ${fieldName}: ${mode}`);
    } else {
      this.warn(`Unsupported mode: ${mode}`);
    }
  },

  // Logging con control de debug
  log(...args) {
    if (NVIM_CONFIG.DEBUG) {
      console.log('[NeoVim]', ...args);
    }
  },

  warn(...args) {
    console.warn('[NeoVim]', ...args);
  },

  error(...args) {
    console.error('[NeoVim]', ...args);
  },
};

// Utilidades mejoradas
const NeoVimUtils = {
  /**
   * Escape HTML de forma segura
   */
  escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Unescape HTML de forma segura
   */
  unescapeHTML(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },

  /**
   * Convierte nombre de campo a ID válido
   */
  fieldNameToId(fieldName) {
    return fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
  },

  /**
   * Verifica si un elemento es visible y accesible
   */
  isElementVisible(element) {
    if (!element) return false;

    return (
      !element.hidden &&
      element.style.display !== 'none' &&
      element.offsetParent !== null &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  },

  /**
   * Busca elemento padre que coincida con selector
   */
  findClosest(element, selector) {
    if (!element) return null;

    // Usar método nativo si está disponible
    if (element.closest) {
      return element.closest(selector);
    }

    // Fallback para navegadores antiguos
    let current = element;
    while (current && current.nodeType === 1) {
      if (current.matches && current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  },

  /**
   * Debounce function para evitar ejecuciones múltiples
   */
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
  },

  /**
   * Crea un ID único para evitar colisiones
   */
  generateUniqueId(prefix = 'nvim') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Valida que un campo sea válido para el plugin
   */
  isValidField(fieldName) {
    return NVIM_CONFIG.FIELD_NAMES.includes(fieldName);
  },
};

// Sistema de eventos mejorado y consolidado
const NeoVimEvents = {
  handlers: new Map(),

  /**
   * Registra un handler de evento
   */
  register(eventType, selector, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType).push({
      selector,
      handler,
      id: NeoVimUtils.generateUniqueId('handler'),
    });

    NeoVimState.log(`Event handler registered: ${eventType} for ${selector}`);
  },

  /**
   * Maneja eventos de forma delegada
   */
  handleEvent(event) {
    const eventType = event.type;
    const handlers = this.handlers.get(eventType);

    if (!handlers) return;

    for (const { selector, handler } of handlers) {
      if (this.matchesSelector(event.target, selector)) {
        try {
          handler(event);
        } catch (error) {
          NeoVimState.error(`Error in event handler for ${selector}:`, error);
        }
        break; // Solo ejecutar el primer handler que coincida
      }
    }
  },

  /**
   * Verifica si un elemento coincide con un selector
   */
  matchesSelector(element, selector) {
    if (!element || !element.matches) return false;

    // Para selectores de ID que empiezan con cierto prefijo
    if (selector.startsWith('[id^=')) {
      const prefix = selector.match(/\[id\^="([^"]+)"\]/)[1];
      return element.id && element.id.startsWith(prefix);
    }

    return element.matches(selector);
  },

  /**
   * Inicializa el sistema de eventos
   */
  init() {
    if (NeoVimState.eventListenersAttached) {
      this.cleanup();
    }

    // Registrar handlers específicos
    this.register(
      'change',
      '[id^="nvim-lang-"]',
      this.handleLanguageChange.bind(this)
    );
    this.register(
      'change',
      '[id^="nvim-mode-"]',
      this.handleModeChange.bind(this)
    );
    this.register(
      'click',
      '[id^="nvim-convert-"]',
      this.handleConvertClick.bind(this)
    );

    // Usar event delegation en el documento
    document.addEventListener('change', this.handleEvent.bind(this), true);
    document.addEventListener('click', this.handleEvent.bind(this), true);

    NeoVimState.eventListenersAttached = true;
    NeoVimState.log('Event system initialized');
  },

  /**
   * Limpia todos los event listeners
   */
  cleanup() {
    document.removeEventListener('change', this.handleEvent.bind(this), true);
    document.removeEventListener('click', this.handleEvent.bind(this), true);
    this.handlers.clear();
    NeoVimState.eventListenersAttached = false;
    NeoVimState.log('Event system cleaned up');
  },

  /**
   * Maneja cambios de lenguaje
   */
  handleLanguageChange(event) {
    const fieldName = event.target.getAttribute('data-field');
    const newLanguage = event.target.value;

    if (NeoVimUtils.isValidField(fieldName)) {
      NeoVimState.setLanguage(fieldName, newLanguage);
    }
  },

  /**
   * Maneja cambios de modo
   */
  handleModeChange(event) {
    const fieldName = event.target.getAttribute('data-field');
    const newMode = event.target.value;

    if (NeoVimUtils.isValidField(fieldName)) {
      NeoVimState.setMode(fieldName, newMode);
    }
  },

  /**
   * Maneja clicks del botón convertir
   */
  handleConvertClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const fieldName = event.target.getAttribute('data-field');
    const button = event.target;

    if (!NeoVimUtils.isValidField(fieldName)) {
      NeoVimState.warn(`Invalid field for conversion: ${fieldName}`);
      return;
    }

    this.performConversion(fieldName, button);
  },

  /**
   * Ejecuta la conversión con manejo de estado del botón
   */
  async performConversion(fieldName, button) {
    // Deshabilitar botón y mostrar estado de carga
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Converting...';
    button.classList.add('nvim-converting');

    try {
      // La función de conversión se definirá en la siguiente parte
      if (window.NeoVimConverter && window.NeoVimConverter.convert) {
        await window.NeoVimConverter.convert(fieldName);
      } else {
        throw new Error('NeoVimConverter not available');
      }
    } catch (error) {
      NeoVimState.error(`Conversion failed for ${fieldName}:`, error);
      alert(`Error converting ${fieldName}: ${error.message}`);
    } finally {
      // Restaurar estado del botón
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.classList.remove('nvim-converting');
      }, 1000);
    }
  },
};

/**
 * NeoVim Simulator Plugin - JavaScript Functions (Parte 2/5)
 * DOM Utilities y Field Management - Funciones simplificadas y robustas
 */

// Gestión de campos mejorada
const NeoVimFieldManager = {
  /**
   * Cache para contenedores de campos encontrados
   */
  fieldContainerCache: new Map(),

  /**
   * Busca el contenedor de un campo por nombre
   * Versión optimizada con cache
   */
  findFieldContainer(fieldName) {
    // Verificar cache primero
    if (this.fieldContainerCache.has(fieldName)) {
      const cached = this.fieldContainerCache.get(fieldName);
      if (document.contains(cached)) {
        return cached;
      } else {
        // Limpiar cache si el elemento ya no existe
        this.fieldContainerCache.delete(fieldName);
      }
    }

    NeoVimState.log(`Searching for field container: ${fieldName}`);

    // Buscar por etiquetas
    const labels = document.querySelectorAll(NVIM_CONFIG.SELECTORS.labelName);

    for (const label of labels) {
      if (label.textContent.trim() === fieldName) {
        const container = NeoVimUtils.findClosest(
          label,
          NVIM_CONFIG.SELECTORS.fieldContainer
        );
        if (container) {
          // Guardar en cache
          this.fieldContainerCache.set(fieldName, container);
          NeoVimState.log(`Field container found and cached for: ${fieldName}`);
          return container;
        }
      }
    }

    NeoVimState.warn(`Field container not found for: ${fieldName}`);
    return null;
  },

  /**
   * Busca el elemento editable dentro de un contenedor de campo
   */
  findEditableElement(fieldContainer) {
    if (!fieldContainer) return null;

    const selectors = [
      NVIM_CONFIG.SELECTORS.richTextEditable,
      NVIM_CONFIG.SELECTORS.contentEditable,
      NVIM_CONFIG.SELECTORS.textarea,
      NVIM_CONFIG.SELECTORS.fieldContent,
      NVIM_CONFIG.SELECTORS.editorField,
      NVIM_CONFIG.SELECTORS.editingArea,
    ];

    for (const selector of selectors) {
      const elements = fieldContainer.querySelectorAll(selector);

      for (const element of elements) {
        if (NeoVimUtils.isElementVisible(element)) {
          NeoVimState.log(`Found editable element with selector: ${selector}`);
          return element;
        }
      }
    }

    return null;
  },

  /**
   * Obtiene el contenido de texto de un elemento editable
   */
  getElementTextContent(element) {
    if (!element) return '';

    switch (element.tagName.toLowerCase()) {
      case 'textarea':
        return element.value || '';
      case 'input':
        return element.value || '';
      default:
        if (
          element.contentEditable === 'true' ||
          element.classList.contains('rich-text-editable')
        ) {
          return element.textContent || element.innerText || '';
        }
        return element.textContent || element.innerText || '';
    }
  },

  /**
   * Establece el contenido de un elemento editable
   */
  setElementContent(element, content, isHTML = false) {
    if (!element) return false;

    try {
      switch (element.tagName.toLowerCase()) {
        case 'textarea':
        case 'input':
          element.value = isHTML ? NeoVimUtils.unescapeHTML(content) : content;
          break;
        default:
          if (
            element.contentEditable === 'true' ||
            element.classList.contains('rich-text-editable')
          ) {
            if (isHTML) {
              element.innerHTML = content;
            } else {
              element.textContent = content;
            }
          } else {
            element.textContent = content;
          }
      }

      // Disparar eventos para notificar cambios
      this.triggerChangeEvents(element);
      return true;
    } catch (error) {
      NeoVimState.error('Error setting element content:', error);
      return false;
    }
  },

  /**
   * Dispara eventos de cambio para notificar a Anki
   */
  triggerChangeEvents(element) {
    const events = ['input', 'change', 'blur'];

    events.forEach((eventType) => {
      try {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
      } catch (error) {
        // Fallback para navegadores antiguos
        try {
          const event = document.createEvent('Event');
          event.initEvent(eventType, true, true);
          element.dispatchEvent(event);
        } catch (fallbackError) {
          NeoVimState.warn(`Could not dispatch ${eventType} event`);
        }
      }
    });

    // Notificación específica para Anki si existe
    if (typeof pycmd !== 'undefined') {
      try {
        pycmd('ankiFieldChanged');
      } catch (error) {
        NeoVimState.warn('Could not notify Anki of field change');
      }
    }
  },

  /**
   * Obtiene el contenido completo de un campo por nombre
   */
  getFieldContent(fieldName) {
    const container = this.findFieldContainer(fieldName);
    if (!container) {
      NeoVimState.warn(
        `Cannot get content - field container not found: ${fieldName}`
      );
      return '';
    }

    const element = this.findEditableElement(container);
    if (!element) {
      NeoVimState.warn(
        `Cannot get content - editable element not found: ${fieldName}`
      );
      return '';
    }

    const content = this.getElementTextContent(element);
    NeoVimState.log(
      `Retrieved content for ${fieldName} (${content.length} characters)`
    );

    return content;
  },

  /**
   * Actualiza el contenido de un campo
   */
  updateFieldContent(fieldName, content, isHTML = false) {
    const container = this.findFieldContainer(fieldName);
    if (!container) {
      throw new Error(`Field container not found: ${fieldName}`);
    }

    const element = this.findEditableElement(container);
    if (!element) {
      throw new Error(`Editable element not found: ${fieldName}`);
    }

    const success = this.setElementContent(element, content, isHTML);
    if (!success) {
      throw new Error(`Failed to update content for: ${fieldName}`);
    }

    NeoVimState.log(`Successfully updated ${fieldName} field`);
    return true;
  },

  /**
   * Limpia el cache de contenedores
   */
  clearCache() {
    this.fieldContainerCache.clear();
    NeoVimState.log('Field container cache cleared');
  },
};

// Gestión de selección de texto mejorada
const NeoVimSelectionManager = {
  /**
   * Obtiene información de la selección actual en un campo específico
   */
  getFieldSelection(fieldName) {
    try {
      NeoVimState.log(`Getting selection for field: ${fieldName}`);

      const container = NeoVimFieldManager.findFieldContainer(fieldName);
      if (!container) {
        NeoVimState.warn(`Field container not found: ${fieldName}`);
        return null;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        NeoVimState.warn('No selection found');
        return null;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (!selectedText) {
        NeoVimState.warn('Selected text is empty');
        return null;
      }

      // Verificar que la selección esté dentro del campo correcto
      const fieldElement = NeoVimFieldManager.findEditableElement(container);
      if (!fieldElement) {
        NeoVimState.warn(`Editable element not found for: ${fieldName}`);
        return null;
      }

      const isWithinField = this.isSelectionWithinElement(range, fieldElement);
      if (!isWithinField) {
        NeoVimState.warn(`Selection is not within field: ${fieldName}`);
        return null;
      }

      // Calcular posiciones relativas
      const fieldContent =
        NeoVimFieldManager.getElementTextContent(fieldElement);
      const offsets = this.calculateSelectionOffsets(fieldElement, range);

      const selectionInfo = {
        text: selectedText,
        startOffset: offsets.start,
        endOffset: offsets.end,
        range: range,
        fieldElement: fieldElement,
        fieldContent: fieldContent,
      };

      NeoVimState.log('Selection details:', selectionInfo);
      return selectionInfo;
    } catch (error) {
      NeoVimState.error('Error getting selection:', error);
      return null;
    }
  },

  /**
   * Verifica si la selección está dentro de un elemento específico
   */
  isSelectionWithinElement(range, element) {
    try {
      return (
        element.contains(range.commonAncestorContainer) ||
        element === range.commonAncestorContainer ||
        range.commonAncestorContainer.contains(element)
      );
    } catch (error) {
      NeoVimState.warn('Error checking selection bounds:', error);
      return false;
    }
  },

  /**
   * Calcula los offsets de inicio y fin de la selección
   */
  calculateSelectionOffsets(fieldElement, range) {
    try {
      // Para elementos textarea/input, usar selectionStart/End si está disponible
      if (
        fieldElement.tagName.toLowerCase() === 'textarea' ||
        fieldElement.tagName.toLowerCase() === 'input'
      ) {
        return {
          start: fieldElement.selectionStart || 0,
          end: fieldElement.selectionEnd || 0,
        };
      }

      // Para contenteditable, calcular usando ranges
      const beforeRange = document.createRange();
      beforeRange.selectNodeContents(fieldElement);
      beforeRange.setEnd(range.startContainer, range.startOffset);

      const start = beforeRange.toString().length;
      const end = start + range.toString().length;

      return { start, end };
    } catch (error) {
      NeoVimState.warn('Could not calculate selection offsets:', error);
      return { start: 0, end: 0 };
    }
  },
};

// Sistema de notificaciones y feedback
const NeoVimNotifications = {
  /**
   * Muestra notificación de éxito
   */
  showSuccess(fieldName, language, mode, selectedText) {
    const container = NeoVimFieldManager.findFieldContainer(fieldName);
    if (!container) return;

    const notification = this.createNotificationElement('success', {
      icon: '✅',
      title: `${fieldName} converted successfully!`,
      subtitle: `${language} - ${mode} mode`,
      duration: 3000,
    });

    this.showNotification(container, notification);
  },

  /**
   * Muestra notificación de error
   */
  showError(fieldName, errorMessage) {
    const container = NeoVimFieldManager.findFieldContainer(fieldName);
    if (!container) return;

    const notification = this.createNotificationElement('error', {
      icon: '❌',
      title: `Error converting ${fieldName}`,
      subtitle: errorMessage,
      duration: 5000,
    });

    this.showNotification(container, notification);
  },

  /**
   * Crea elemento de notificación
   */
  createNotificationElement(type, { icon, title, subtitle, duration }) {
    const notification = document.createElement('div');
    notification.className = `nvim-${type}-indicator`;
    notification.innerHTML = `
            <span class="nvim-${type}-icon">${icon}</span>
            <div class="nvim-${type}-content">
                <span class="nvim-${type}-title">${title}</span>
                ${
                  subtitle
                    ? `<span class="nvim-${type}-subtitle">${subtitle}</span>`
                    : ''
                }
            </div>
        `;

    return { element: notification, duration };
  },

  /**
   * Muestra notificación en el DOM
   */
  showNotification(container, { element, duration }) {
    // Remover notificaciones existentes del mismo tipo
    const existingNotifications = container.querySelectorAll(
      '.nvim-success-indicator, .nvim-error-indicator'
    );
    existingNotifications.forEach((el) => el.remove());

    container.appendChild(element);

    // Auto-remover después del tiempo especificado
    setTimeout(() => {
      if (element.parentNode) {
        element.remove();
      }
    }, duration);
  },
};

/**
 * NeoVim Simulator Plugin - JavaScript Functions (Parte 3/5)
 * Sistema de Syntax Highlighting modularizado y optimizado
 */

// Motor de syntax highlighting
const NeoVimSyntaxHighlighter = {
  /**
   * Aplica syntax highlighting según el lenguaje
   */
  highlight(text, language) {
    if (!text) return '';

    // Escape HTML por seguridad (excepto para HTML que necesita manejo especial)
    const safeText =
      language.toLowerCase() === 'html' ? text : NeoVimUtils.escapeHTML(text);

    const highlighter = this.getHighlighter(language);
    if (!highlighter) {
      NeoVimState.warn(`No highlighter found for language: ${language}`);
      return safeText;
    }

    try {
      return highlighter(safeText);
    } catch (error) {
      NeoVimState.error(`Error highlighting ${language} code:`, error);
      return safeText;
    }
  },

  /**
   * Obtiene la función de highlighting para un lenguaje
   */
  getHighlighter(language) {
    const highlighters = {
      javascript: this.highlightJavaScript.bind(this),
      python: this.highlightPython.bind(this),
      java: this.highlightJava.bind(this),
      swift: this.highlightSwift.bind(this),
      html: this.highlightHTML.bind(this),
      css: this.highlightCSS.bind(this),
    };

    return highlighters[language.toLowerCase()] || null;
  },

  /**
   * Utilidad para aplicar regex con clase CSS
   */
  applyHighlightRule(text, pattern, className, flags = 'g') {
    const regex = new RegExp(pattern, flags);
    return text.replace(regex, `<span class="${className}">$&</span>`);
  },

  /**
   * Utilidad para aplicar múltiples reglas de highlighting
   */
  applyMultipleRules(text, rules) {
    return rules.reduce((highlightedText, rule) => {
      const { pattern, className, flags = 'g' } = rule;
      return highlightedText.replace(
        new RegExp(pattern, flags),
        `<span class="${className}">$&</span>`
      );
    }, text);
  },

  /**
   * JavaScript syntax highlighting
   */
  highlightJavaScript(text) {
    const rules = [
      // Comentarios (primero para evitar conflictos)
      {
        pattern: '\\/\\/.*$',
        className: 'nvim-js-comment',
        flags: 'gm',
      },
      {
        pattern: '\\/\\*[\\s\\S]*?\\*\\/',
        className: 'nvim-js-comment',
      },

      // Strings (con escape de comillas)
      {
        pattern: '(["`\'])(?:(?!\\1)[^\\\\\\r\\n]|\\\\.|\\r?\\n)*\\1',
        className: 'nvim-js-string',
      },

      // Template literals
      {
        pattern: '`(?:[^`\\\\]|\\\\.)*`',
        className: 'nvim-js-template',
      },

      // Keywords
      {
        pattern:
          '\\b(function|var|let|const|if|else|for|while|return|class|extends|import|export|async|await|try|catch|finally|throw|new|this|super|typeof|instanceof)\\b',
        className: 'nvim-js-keyword',
      },

      // Números
      {
        pattern: '\\b\\d+\\.?\\d*\\b',
        className: 'nvim-js-number',
      },

      // Booleans y null/undefined
      {
        pattern: '\\b(true|false|null|undefined)\\b',
        className: 'nvim-js-boolean',
      },

      // Operadores
      {
        pattern: '[+\\-*/=<>!&|?:]+',
        className: 'nvim-js-operator',
      },
    ];

    return this.applyMultipleRules(text, rules);
  },

  /**
   * Python syntax highlighting
   */
  highlightPython(text) {
    const rules = [
      // Comentarios
      {
        pattern: '#.*$',
        className: 'nvim-py-comment',
        flags: 'gm',
      },

      // Strings (incluyendo triple quotes)
      {
        pattern: '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\')',
        className: 'nvim-py-string',
      },
      {
        pattern: '(["\'])(?:(?!\\1)[^\\\\\\r\\n]|\\\\.|\\r?\\n)*\\1',
        className: 'nvim-py-string',
      },

      // F-strings
      {
        pattern: 'f(["\'])(?:(?!\\1)[^\\\\\\r\\n]|\\\\.|\\r?\\n)*\\1',
        className: 'nvim-py-fstring',
      },

      // Decorators
      {
        pattern: '@\\w+',
        className: 'nvim-py-decorator',
      },

      // Keywords
      {
        pattern:
          '\\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|global|nonlocal|assert|del|raise|and|or|not|in|is)\\b',
        className: 'nvim-py-keyword',
      },

      // Built-ins
      {
        pattern:
          '\\b(print|len|range|str|int|float|list|dict|tuple|set|bool|type|isinstance|hasattr|getattr|setattr|enumerate|zip|map|filter|sum|max|min|sorted|reversed)\\b',
        className: 'nvim-py-builtin',
      },

      // Números
      {
        pattern: '\\b\\d+\\.?\\d*\\b',
        className: 'nvim-py-number',
      },
    ];

    return this.applyMultipleRules(text, rules);
  },

  /**
   * Java syntax highlighting
   */
  highlightJava(text) {
    const rules = [
      // Comentarios
      {
        pattern: '\\/\\/.*$',
        className: 'nvim-java-comment',
        flags: 'gm',
      },
      {
        pattern: '\\/\\*[\\s\\S]*?\\*\\/',
        className: 'nvim-java-comment',
      },

      // Strings
      {
        pattern: '"(?:[^"\\\\]|\\\\.)*"',
        className: 'nvim-java-string',
      },

      // Annotations
      {
        pattern: '@\\w+',
        className: 'nvim-java-annotation',
      },

      // Keywords
      {
        pattern:
          '\\b(public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp|class|interface|extends|implements|if|else|for|while|do|return|new|this|super|try|catch|finally|throw|throws|package|import|enum|switch|case|default|break|continue|instanceof)\\b',
        className: 'nvim-java-keyword',
      },

      // Primitive types
      {
        pattern: '\\b(byte|short|int|long|float|double|boolean|char|void)\\b',
        className: 'nvim-java-primitive',
      },

      // Common types
      {
        pattern:
          '\\b(String|Object|Integer|Double|Boolean|Character|List|ArrayList|HashMap|HashSet|Array)\\b',
        className: 'nvim-java-type',
      },

      // Números
      {
        pattern: '\\b\\d+[lLfFdD]?\\b',
        className: 'nvim-java-number',
      },
    ];

    return this.applyMultipleRules(text, rules);
  },

  /**
   * Swift syntax highlighting
   */
  highlightSwift(text) {
    const rules = [
      // Comentarios
      {
        pattern: '\\/\\/.*$',
        className: 'nvim-swift-comment',
        flags: 'gm',
      },
      {
        pattern: '\\/\\*[\\s\\S]*?\\*\\/',
        className: 'nvim-swift-comment',
      },

      // Strings
      {
        pattern: '"(?:[^"\\\\]|\\\\.)*"',
        className: 'nvim-swift-string',
      },

      // Attributes
      {
        pattern: '@\\w+',
        className: 'nvim-swift-attribute',
      },

      // Keywords
      {
        pattern:
          '\\b(func|var|let|if|else|for|while|return|class|struct|enum|protocol|extension|import|init|deinit|override|final|public|private|internal|fileprivate|open|static|mutating|lazy|weak|unowned|guard|defer|throws|rethrows|try|catch|switch|case|default|break|continue|fallthrough|where|as|is|in|inout)\\b',
        className: 'nvim-swift-keyword',
      },

      // Types
      {
        pattern:
          '\\b(String|Int|Double|Float|Bool|Character|Array|Dictionary|Set|Optional|Any|AnyObject|Void)\\b',
        className: 'nvim-swift-type',
      },

      // Números
      {
        pattern: '\\b\\d+\\.?\\d*\\b',
        className: 'nvim-swift-number',
      },
    ];

    return this.applyMultipleRules(text, rules);
  },

  /**
   * HTML syntax highlighting (manejo especial sin escape)
   */
  highlightHTML(text) {
    let highlightedText = text;

    // Comentarios HTML
    highlightedText = highlightedText.replace(
      /<!--[\s\S]*?-->/g,
      '<span class="nvim-html-comment">$&</span>'
    );

    // DOCTYPE
    highlightedText = highlightedText.replace(
      /<!DOCTYPE[^>]*>/gi,
      '<span class="nvim-html-doctype">$&</span>'
    );

    // Tags con atributos
    highlightedText = highlightedText.replace(
      /(<\/?)(\w+)((?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*)(\/?>)/g,
      function (match, openBracket, tagName, attributes, closeBracket) {
        let result = `<span class="nvim-tag-bracket">${openBracket}</span>`;
        result += `<span class="nvim-tag-name">${tagName}</span>`;

        // Highlight attributes
        if (attributes) {
          result += attributes.replace(
            /(\w+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/g,
            '<span class="nvim-attribute-name">$1</span><span class="nvim-equals">$2</span><span class="nvim-attribute-value">$3</span>'
          );
        }

        result += `<span class="nvim-tag-bracket">${closeBracket}</span>`;
        return result;
      }
    );

    return highlightedText;
  },

  /**
   * CSS syntax highlighting
   */
  highlightCSS(text) {
    const rules = [
      // Comentarios
      {
        pattern: '\\/\\*[\\s\\S]*?\\*\\/',
        className: 'nvim-css-comment',
      },

      // At-rules
      {
        pattern: '@[\\w-]+',
        className: 'nvim-css-at-rule',
      },

      // Selectors (aproximación)
      {
        pattern:
          '^\\s*[.#]?[\\w-]+(?:\\[[^\\]]*\\]|:[\\w-]+)*(?:\\s*[>+~]\\s*[.#]?[\\w-]+(?:\\[[^\\]]*\\]|:[\\w-]+)*)*\\s*(?=\\{)',
        className: 'nvim-css-selector',
        flags: 'gm',
      },

      // Properties
      {
        pattern: '([\\w-]+)\\s*:',
        className: 'nvim-css-property',
      },

      // Colors (hex, rgb, etc.)
      {
        pattern: '#[0-9a-fA-F]{3,8}\\b|\\b(?:rgb|rgba|hsl|hsla)\\([^)]*\\)',
        className: 'nvim-css-color',
      },

      // Numbers with units
      {
        pattern:
          '\\b\\d+(?:\\.\\d+)?(?:px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|fr)\\b',
        className: 'nvim-css-unit',
      },

      // Plain numbers
      {
        pattern: '\\b\\d+(?:\\.\\d+)?\\b',
        className: 'nvim-css-number',
      },
    ];

    return this.applyMultipleRules(text, rules);
  },
};

/**
 * NeoVim Simulator Plugin - JavaScript Functions (Parte 4/5)
 * Simulación de cursor y selección visual, generación de HTML del editor
 */

// Simulador de cursor y modos de Vim
const NeoVimCursorSimulator = {
  /**
   * Añade simulación de cursor al texto según el modo
   */
  addCursor(text, mode, position) {
    if (!text || position < 0) return text;

    const lines = text.split('\n');
    const cursorPos = this.findCursorPosition(lines, position);

    if (cursorPos.line >= lines.length) return text;

    const line = lines[cursorPos.line];
    const modifiedLine = this.applyCursorToLine(line, mode, cursorPos.char);

    lines[cursorPos.line] = modifiedLine;
    return lines.join('\n');
  },

  /**
   * Encuentra la línea y posición del cursor
   */
  findCursorPosition(lines, position) {
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length;

      if (currentPos + lineLength >= position) {
        return {
          line: i,
          char: position - currentPos,
        };
      }

      currentPos += lineLength + 1; // +1 for newline
    }

    // Si la posición está más allá del texto, colocar al final
    return {
      line: Math.max(0, lines.length - 1),
      char: lines[lines.length - 1]?.length || 0,
    };
  },

  /**
   * Aplica el cursor a una línea específica según el modo
   */
  applyCursorToLine(line, mode, charPosition) {
    const safePos = Math.max(0, Math.min(charPosition, line.length));

    switch (mode.toLowerCase()) {
      case 'normal':
        return this.addNormalModeCursor(line, safePos);
      case 'insert':
        return this.addInsertModeCursor(line, safePos);
      case 'visual':
        // Visual mode se maneja separadamente con selecciones
        return line;
      default:
        return line;
    }
  },

  /**
   * Cursor en modo Normal (bloque sobre el carácter)
   */
  addNormalModeCursor(line, position) {
    if (position >= line.length) {
      // Cursor al final de la línea
      return line + '<span class="nvim-cursor"> </span>';
    }

    const char = line.charAt(position);
    const before = line.substring(0, position);
    const after = line.substring(position + 1);

    return before + `<span class="nvim-cursor">${char}</span>` + after;
  },

  /**
   * Cursor en modo Insert (línea vertical antes del carácter)
   */
  addInsertModeCursor(line, position) {
    const before = line.substring(0, position);
    const after = line.substring(position);

    return before + '<span class="nvim-cursor-insert"></span>' + after;
  },

  /**
   * Añade selección visual al texto con cursor al final
   */
  addVisualSelection(text, startPos, endPos) {
    if (!text || startPos < 0 || endPos <= startPos) return text;

    // Asegurar que los offsets están dentro del rango
    const maxPos = text.length;
    const safeStart = Math.max(0, Math.min(startPos, maxPos));
    const safeEnd = Math.max(safeStart, Math.min(endPos, maxPos));

    const beforeSelection = text.substring(0, safeStart);
    const selection = text.substring(safeStart, safeEnd);
    const afterSelection = text.substring(safeEnd);

    return (
      beforeSelection +
      `<span class="nvim-visual-selection">${selection}</span>` +
      `<span class="nvim-visual-cursor"></span>` +
      afterSelection
    );
  },
  addVisualSelectionOnly(text, startPos, endPos) {
    if (!text || startPos < 0 || endPos <= startPos) return text;

    const maxPos = text.length;
    const safeStart = Math.max(0, Math.min(startPos, maxPos));
    const safeEnd = Math.max(safeStart, Math.min(endPos, maxPos));

    const beforeSelection = text.substring(0, safeStart);
    const selection = text.substring(safeStart, safeEnd);
    const afterSelection = text.substring(safeEnd);

    return (
      beforeSelection +
      `<span class="nvim-visual-selection">${selection}</span>` +
      afterSelection
    );
  },
};

// Generador de HTML del editor NeoVim
const NeoVimEditorGenerator = {
  /**
   * Genera el HTML completo de la simulación del editor
   */
  generateEditorHTML(content, language, mode, selection) {
    const escapedContent = NeoVimUtils.escapeHTML(content);
    let processedContent = NeoVimSyntaxHighlighter.highlight(
      escapedContent,
      language
    );

    // Aplicar cursor o selección según el modo
    if (mode.toLowerCase() === 'visual' && selection) {
      processedContent = NeoVimCursorSimulator.addVisualSelection(
        processedContent,
        selection.startOffset,
        selection.endOffset
      );
    } else if (selection) {
      const cursorPos =
        mode.toLowerCase() === 'insert'
          ? selection.startOffset
          : selection.startOffset;
      processedContent = NeoVimCursorSimulator.addCursor(
        processedContent,
        mode,
        cursorPos
      );
    }

    return this.createEditorStructure(processedContent, language, mode);
  },

  /**
   * Crea la estructura HTML del editor
   */
  createEditorStructure(content, language, mode) {
    const header = this.generateHeader(language, mode);
    const editorContent = this.generateEditorContent(content);

    return `
<div class="nvim-editor-simulation">
    ${header}
    ${editorContent}
</div>`.trim();
  },

  /**
   * Genera el header del editor
   */
  generateHeader(language, mode) {
    return `
    <div class="nvim-editor-header">
        <div class="nvim-editor-title">
            <span class="nvim-filename">nvim</span>
            <span class="nvim-language-indicator">${language}</span>
        </div>
        <div class="nvim-mode-indicator nvim-mode-${mode.toLowerCase()}">
            -- ${mode.toUpperCase()} --
        </div>
    </div>`.trim();
  },

  /**
   * Genera el contenido del editor con números de línea
   */
  generateEditorContent(content) {
    const lines = content.split('\n');
    const lineNumbers = this.generateLineNumbers(lines.length);
    const codeLines = this.generateCodeLines(lines);

    return `
    <div class="nvim-editor-content">
        <div class="nvim-line-numbers">
            ${lineNumbers}
        </div>
        <div class="nvim-code-area">
            ${codeLines}
        </div>
    </div>`.trim();
  },

  /**
   * Genera los números de línea
   */
  generateLineNumbers(lineCount) {
    const numbers = [];
    for (let i = 1; i <= lineCount; i++) {
      numbers.push(`<div class="nvim-line-number">${i}</div>`);
    }
    return numbers.join('\n            ');
  },

  /**
   * Genera las líneas de código
   */
  generateCodeLines(lines) {
    return lines
      .map((line) => {
        const displayLine = line || '&nbsp;'; // Espacio no-breaking para líneas vacías
        return `<div class="nvim-code-line">${displayLine}</div>`;
      })
      .join('\n            ');
  },
};

// Convertidor principal que integra todo
const NeoVimConverter = {
  /**
   * Función principal de conversión
   */
  async convert(fieldName) {
    try {
      NeoVimState.log(`Starting conversion for ${fieldName}`);

      // Validar campo
      if (!NeoVimUtils.isValidField(fieldName)) {
        throw new Error(`Invalid field name: ${fieldName}`);
      }

      // Obtener configuración
      const language = NeoVimState.getLanguage(fieldName);
      const mode = NeoVimState.getMode(fieldName);

      // Obtener contenido del campo
      const fieldContent = NeoVimFieldManager.getFieldContent(fieldName);
      if (!fieldContent.trim()) {
        throw new Error(
          `No content found in ${fieldName} field. Please add some code first.`
        );
      }

      // Obtener selección
      const selection = NeoVimSelectionManager.getFieldSelection(fieldName);
      if (!selection || !selection.text.trim()) {
        throw new Error(
          `Please select some text in the ${fieldName} field first.`
        );
      }

      NeoVimState.log(
        `Converting ${fieldName}: ${language} (${mode}) - Selected: "${selection.text}"`
      );

      // Generar HTML del editor
      const editorHTML = NeoVimEditorGenerator.generateEditorHTML(
        fieldContent,
        language,
        mode,
        selection
      );

      // Actualizar el campo
      NeoVimFieldManager.updateFieldContent(fieldName, editorHTML, true);

      // Mostrar notificación de éxito
      NeoVimNotifications.showSuccess(
        fieldName,
        language,
        mode,
        selection.text
      );

      NeoVimState.log(`✅ Conversion completed successfully for ${fieldName}`);
    } catch (error) {
      NeoVimState.error(`Conversion failed for ${fieldName}:`, error);
      NeoVimNotifications.showError(fieldName, error.message);
      throw error; // Re-throw para que el UI pueda manejarlo
    }
  },

  /**
   * Función de conversión específica para CodeBefore
   */
  async convertCodeBefore() {
    return this.convert('CodeBefore');
  },

  /**
   * Función de conversión específica para CodeAfter
   */
  async convertCodeAfter() {
    return this.convert('CodeAfter');
  },
};

/**
 * NeoVim Simulator Plugin - JavaScript Functions (Parte 5/5)
 * Inicialización, manejo de eventos del DOM y exports globales
 */

// Plugin principal que coordina todos los módulos
const NeoVimSimulator = {
  /**
   * Inicializa el plugin completo
   */
  init() {
    if (NeoVimState.initialized) {
      NeoVimState.log('Plugin already initialized, skipping...');
      return;
    }

    try {
      NeoVimState.log('Initializing NeoVim Simulator...');

      // Limpiar estado anterior si existe
      this.cleanup();

      // Inicializar sistema de eventos
      NeoVimEvents.init();

      // Marcar como inicializado
      NeoVimState.initialized = true;

      NeoVimState.log('✅ NeoVim Simulator initialized successfully');
    } catch (error) {
      NeoVimState.error('Failed to initialize plugin:', error);
      throw error;
    }
  },

  /**
   * Limpia el estado del plugin
   */
  cleanup() {
    NeoVimState.log('Cleaning up plugin state...');

    // Limpiar eventos
    if (NeoVimState.eventListenersAttached) {
      NeoVimEvents.cleanup();
    }

    // Limpiar cache
    NeoVimFieldManager.clearCache();

    // Reset estado
    NeoVimState.initialized = false;

    NeoVimState.log('Plugin cleanup completed');
  },

  /**
   * Re-inicializa el plugin (útil para debugging)
   */
  reinit() {
    NeoVimState.log('Re-initializing plugin...');
    this.cleanup();
    setTimeout(() => this.init(), 100);
  },

  /**
   * Verifica el estado del plugin
   */
  getStatus() {
    return {
      initialized: NeoVimState.initialized,
      eventsAttached: NeoVimState.eventListenersAttached,
      supportedLanguages: NVIM_CONFIG.SUPPORTED_LANGUAGES,
      supportedModes: NVIM_CONFIG.VIM_MODES,
      version: NVIM_CONFIG.VERSION,
    };
  },
};

// Manejo de eventos del DOM
const DOMEventManager = {
  /**
   * Inicializa cuando el DOM está listo
   */
  initWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        this.handleDOMReady.bind(this)
      );
    } else {
      // DOM ya está listo
      this.handleDOMReady();
    }
  },

  /**
   * Maneja el evento DOMContentLoaded
   */
  handleDOMReady() {
    NeoVimState.log('DOM ready, initializing plugin...');

    // Delay para asegurar que Anki ha terminado de cargar
    setTimeout(() => {
      try {
        NeoVimSimulator.init();
      } catch (error) {
        NeoVimState.error('Error during DOM ready initialization:', error);
      }
    }, 1000);
  },

  /**
   * Maneja cambios en el DOM (para re-attachment si es necesario)
   */
  handleDOMChanges() {
    // Usar MutationObserver si está disponible para detectar cambios
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(
        NeoVimUtils.debounce(() => {
          if (NeoVimState.initialized && !NeoVimState.eventListenersAttached) {
            NeoVimState.log('DOM changes detected, re-attaching events...');
            NeoVimEvents.init();
          }
        }, 500)
      );

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
      });
    }
  },
};

// Funciones de compatibilidad hacia atrás
const LegacyCompatibility = {
  /**
   * Funciones legacy para mantener compatibilidad
   */
  attachEventListeners() {
    NeoVimState.log(
      'Legacy attachEventListeners called, using new event system...'
    );
    if (!NeoVimState.eventListenersAttached) {
      NeoVimEvents.init();
    }
  },

  reattachListeners() {
    NeoVimState.log(
      'Legacy reattachListeners called, using new event system...'
    );
    NeoVimEvents.cleanup();
    setTimeout(() => NeoVimEvents.init(), 100);
  },

  convertCodeBefore() {
    return NeoVimConverter.convertCodeBefore();
  },

  convertCodeAfter() {
    return NeoVimConverter.convertCodeAfter();
  },
};

// Exports globales para compatibilidad y acceso externo
const GlobalExports = {
  /**
   * Exporta todas las funciones y objetos necesarios al scope global
   */
  exportToWindow() {
    if (typeof window === 'undefined') return;

    // Objetos principales
    window.NeoVimSimulator = NeoVimSimulator;
    window.NeoVimState = NeoVimState;
    window.NeoVimConverter = NeoVimConverter;
    window.NeoVimUtils = NeoVimUtils;

    // Funciones de utilidad
    window.generateNeoVimSimulationHTML =
      NeoVimEditorGenerator.generateEditorHTML.bind(NeoVimEditorGenerator);
    window.updateAnkiField =
      NeoVimFieldManager.updateFieldContent.bind(NeoVimFieldManager);
    window.showConversionSuccess =
      NeoVimNotifications.showSuccess.bind(NeoVimNotifications);

    // Funciones legacy para compatibilidad
    window.attachEventListeners = LegacyCompatibility.attachEventListeners;
    window.reattachListeners = LegacyCompatibility.reattachListeners;
    window.convertCodeBefore = LegacyCompatibility.convertCodeBefore;
    window.convertCodeAfter = LegacyCompatibility.convertCodeAfter;

    // Handlers de eventos (para debugging)
    window.handleLanguageChange =
      NeoVimEvents.handleLanguageChange.bind(NeoVimEvents);
    window.handleModeChange = NeoVimEvents.handleModeChange.bind(NeoVimEvents);
    window.handleConvertClick =
      NeoVimEvents.handleConvertClick.bind(NeoVimEvents);

    NeoVimState.log('✅ All functions exported to global scope');
  },
};

// Auto-inicialización
(function autoInit() {
  try {
    // Export to global scope immediately
    GlobalExports.exportToWindow();

    // Initialize DOM event handling
    DOMEventManager.initWhenReady();
    DOMEventManager.handleDOMChanges();

    // Try immediate initialization if DOM is ready
    if (document.readyState !== 'loading') {
      setTimeout(() => {
        if (!NeoVimState.initialized) {
          try {
            NeoVimSimulator.init();
          } catch (error) {
            NeoVimState.error('Auto-initialization failed:', error);
          }
        }
      }, 500);
    }

    NeoVimState.log(
      `🚀 NeoVim Simulator Plugin v${NVIM_CONFIG.VERSION} loaded and ready`
    );
  } catch (error) {
    console.error('[NeoVim] Critical error during plugin load:', error);
  }
})();

// Debug utilities (solo en modo debug)
if (NVIM_CONFIG.DEBUG) {
  window.NeoVimDebug = {
    getState: () => NeoVimState,
    getConfig: () => NVIM_CONFIG,
    reinit: () => NeoVimSimulator.reinit(),
    getStatus: () => NeoVimSimulator.getStatus(),
    testHighlighting: (text, lang) =>
      NeoVimSyntaxHighlighter.highlight(text, lang),
    testCursor: (text, mode, pos) =>
      NeoVimCursorSimulator.addCursor(text, mode, pos),
    clearCache: () => NeoVimFieldManager.clearCache(),
    version: NVIM_CONFIG.VERSION,
  };

  console.log('🔧 Debug utilities available at window.NeoVimDebug');
}
