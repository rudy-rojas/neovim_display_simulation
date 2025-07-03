# -*- coding: utf-8 -*-
"""
Anki NeoVim Simulator Plugin
Main plugin file for adding NeoVim visual simulation controls to CodeBefore and CodeAfter fields
"""

import os
from aqt import mw, gui_hooks
from aqt.editor import Editor
from aqt.utils import showInfo
from anki.hooks import addHook

# Plugin configuration
PLUGIN_NAME = "NeoVim Simulator"
VERSION = "1.0.0"

# Get plugin directory
PLUGIN_DIR = os.path.dirname(__file__)

# Supported languages for syntax highlighting
SUPPORTED_LANGUAGES = [
    "HTML",
    "JavaScript", 
    "Python",
    "Java",
    "Swift",
    "CSS"
]

# Vim modes
VIM_MODES = [
    "Normal",
    "Insert", 
    "Visual"
]

def load_file_content(filename):
    """Load content from a file in the plugin directory"""
    try:
        file_path = os.path.join(PLUGIN_DIR, filename)
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Warning: {filename} not found in plugin directory")
        return ""
    except Exception as e:
        print(f"Error loading {filename}: {str(e)}")
        return ""

def generate_controls_html(field_name):
    """Generate HTML for NeoVim controls for a specific field"""
    
    # Language dropdown options
    language_options = ""
    for lang in SUPPORTED_LANGUAGES:
        selected = "selected" if lang == "JavaScript" else ""
        language_options += f'<option value="{lang}" {selected}>{lang}</option>'
    
    # Mode dropdown options  
    mode_options = ""
    for mode in VIM_MODES:
        selected = "selected" if mode == "Normal" else ""
        mode_options += f'<option value="{mode}" {selected}>{mode}</option>'
    
    # Field identifier for JavaScript functions
    field_id = field_name.lower().replace(" ", "")
    
    # Generate HTML without inline event handlers (CSP compliant)
    controls_html = f"""
    <div class="nvim-controls" id="nvim-controls-{field_id}">
        <label>Language:</label>
        <select id="nvim-lang-{field_id}" data-field="{field_name}">
            {language_options}
        </select>
        
        <label>Mode:</label>
        <select id="nvim-mode-{field_id}" data-field="{field_name}">
            {mode_options}
        </select>
        
        <button type="button" id="nvim-convert-{field_id}" data-field="{field_name}">Convert</button>
        <a href="https://rudy-rojas.github.io/nvim-view-simulator/">Open Editor</a>
    </div>
    """
    
    return controls_html

def inject_nvim_controls(editor):
    """Inject NeoVim controls into the editor"""
    
    # Check if we're in a note type that has CodeBefore and CodeAfter fields
    if not hasattr(editor, 'note') or not editor.note:
        return
        
    note_type = editor.note.note_type()
    field_names = [field['name'] for field in note_type['flds']]
    
    # Only inject if we have the required fields
    if 'CodeBefore' not in field_names or 'CodeAfter' not in field_names:
        return
    
    # Load CSS and JavaScript from external files
    css_content = load_file_content("nvim_styles.css")
    js_content = load_file_content("nvim_functions.js")
    
    # Escape content for safe injection
    css_content_escaped = css_content.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    js_content_escaped = js_content.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    
    editor.web.eval(f"""
        // Check if plugin is already loaded to avoid duplicates
        if (!window.nvimPluginLoaded) {{
            // Remove existing plugin styles/scripts
            const existingStyle = document.getElementById('nvim-plugin-style');
            if (existingStyle) existingStyle.remove();
            
            const existingScript = document.getElementById('nvim-plugin-script');
            if (existingScript) existingScript.remove();
            
            // Add plugin CSS
            const style = document.createElement('style');
            style.id = 'nvim-plugin-style';
            style.textContent = `{css_content_escaped}`;
            document.head.appendChild(style);
            
            // Add plugin JavaScript
            const script = document.createElement('script');
            script.id = 'nvim-plugin-script';
            script.textContent = `{js_content_escaped}`;
            document.head.appendChild(script);
            
            // Mark as loaded
            window.nvimPluginLoaded = true;
            console.log('NeoVim plugin styles and scripts loaded');
        }}
    """)

    # Inject controls for CodeBefore and CodeAfter fields
    for field_name in ['CodeBefore', 'CodeAfter']:
        if field_name in field_names:
            field_ord = None
            for i, field in enumerate(note_type['flds']):
                if field['name'] == field_name:
                    field_ord = i
                    break
            
            if field_ord is not None:
                # Insert the controls in the correct position
                controls_html = generate_controls_html(field_name)
                controls_html_escaped = controls_html.replace('`', '\\`').replace('${', '\\${')
                field_id = field_name.lower().replace(' ', '')
                
                editor.web.eval(f"""
                    setTimeout(function() {{
                        console.log('Injecting controls for {field_name}...');
                        
                        // Find the label for this field
                        const labels = document.querySelectorAll('.label-name');
                        let targetLabel = null;
                        
                        for (let label of labels) {{
                            if (label.textContent.trim() === '{field_name}') {{
                                targetLabel = label;
                                break;
                            }}
                        }}
                        
                        if (targetLabel) {{
                            // Get the field container (parent of label-container)
                            const fieldContainer = targetLabel.closest('.field-container');
                            
                            if (fieldContainer) {{
                                // Remove existing controls to avoid duplicates
                                const existingControls = fieldContainer.querySelector('#nvim-controls-{field_id}');
                                if (existingControls) {{
                                    console.log('Removing existing controls for {field_name}');
                                    existingControls.remove();
                                }}
                                
                                // Find the label-container
                                const labelContainer = fieldContainer.querySelector('.label-container');
                                
                                if (labelContainer) {{
                                    // Create controls element
                                    const controlsDiv = document.createElement('div');
                                    controlsDiv.innerHTML = `{controls_html_escaped}`;
                                    const controlsElement = controlsDiv.firstElementChild;
                                    
                                    // Insert controls after the label-container
                                    labelContainer.insertAdjacentElement('afterend', controlsElement);
                                    
                                    console.log('NeoVim controls inserted for {field_name}');
                                    
                                    // CRITICAL: Re-attach event listeners after injection
                                    if (window.reattachListeners) {{
                                        console.log('Re-attaching listeners for {field_name}...');
                                        window.reattachListeners();
                                    }} else {{
                                        console.warn('reattachListeners function not available');
                                        // Fallback: try to call attachEventListeners directly
                                        setTimeout(() => {{
                                            if (window.attachEventListeners) {{
                                                console.log('Calling attachEventListeners as fallback...');
                                                window.attachEventListeners();
                                            }}
                                        }}, 200);
                                    }}
                                }} else {{
                                    console.warn('Label container not found for {field_name}');
                                }}
                            }} else {{
                                console.warn('Field container not found for {field_name}');
                            }}
                        }} else {{
                            console.warn('Label not found for {field_name}');
                        }}
                    }}, 1200); // Increased timeout for better reliability
                """)

def on_editor_did_init(editor):
    """Hook called when editor is initialized"""
    # Delay to ensure editor is fully loaded
    mw.progress.timer(2500, lambda: inject_nvim_controls(editor), False)

def on_editor_did_load_note(editor):
    """Hook called when a note is loaded in the editor"""
    # Delay to ensure all fields are rendered
    mw.progress.timer(2000, lambda: inject_nvim_controls(editor), False)

def on_editor_did_unfocus_field(editor, field, text):
    """Hook called when user unfocuses a field"""
    # Check if controls exist and re-inject only if missing
    if hasattr(editor, 'note') and editor.note:
        editor.web.eval("""
            setTimeout(() => {
                const codeBeforeControls = document.getElementById('nvim-controls-codebefore');
                const codeAfterControls = document.getElementById('nvim-controls-codeafter');
                
                if (!codeBeforeControls || !codeAfterControls) {
                    console.log('NeoVim controls missing, triggering re-injection...');
                    // This will trigger the Python re-injection
                    window.nvimControlsMissing = true;
                } else {
                    // Controls exist, just make sure listeners are attached
                    if (window.reattachListeners) {
                        window.reattachListeners();
                    }
                }
            }, 300);
        """)
        
        # Re-inject if needed
        mw.progress.timer(1000, lambda: inject_nvim_controls(editor), False)

# Register hooks
gui_hooks.editor_did_init.append(on_editor_did_init)
gui_hooks.editor_did_load_note.append(on_editor_did_load_note)
gui_hooks.editor_did_unfocus_field.append(on_editor_did_unfocus_field)

# Plugin initialization
def init_plugin():
    """Initialize the plugin"""
    print(f"{PLUGIN_NAME} v{VERSION} - Plugin initialized")

# Initialize when Anki loads
init_plugin()