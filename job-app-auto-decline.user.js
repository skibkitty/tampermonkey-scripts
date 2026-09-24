// ==UserScript==
// @name         Job App Auto-Decline (EEO / Self-ID Questions)
// @namespace    skibkitty-job-tools
// @version      1.0
// @description  Press Ctrl+Shift+D (or click the floating button) to auto-select "decline to answer" style options on voluntary self-identification / EEO questions (gender, race, ethnicity, veteran status, disability). Manual trigger only -- nothing runs automatically on page load.
// @author       you
// @homepageURL  https://github.com/67Midas/tampermonkey-scripts
// @supportURL   https://github.com/67Midas/tampermonkey-scripts/issues
// @updateURL    https://raw.githubusercontent.com/67Midas/tampermonkey-scripts/main/job-app-auto-decline.user.js
// @downloadURL  https://raw.githubusercontent.com/67Midas/tampermonkey-scripts/main/job-app-auto-decline.user.js
// @match        https://*.greenhouse.io/*
// @match        https://boards.greenhouse.io/*
// @match        https://job-boards.greenhouse.io/*
// @match        https://*.myworkdayjobs.com/*
// @match        https://jobs.lever.co/*
// @match        https://*.icims.com/*
// @match        https://*.smartrecruiters.com/*
// @match        https://*.taleo.net/*
// @match        https://*.successfactors.com/*
// @grant        none
// ==/UserScript==

/*
 HOW TO ADD MORE SITES:
 If a company uses an ATS not listed above, add a line like:
     // @match        https://*.somecompany-ats.com/*
 in the header block, then re-save the script in Tampermonkey (Dashboard ->
 click the script -> edit -> save). Tampermonkey will re-prompt for
 permission on the new domain.

 WHAT THIS DOES:
 - Does nothing until you press Ctrl+Shift+D or click the small floating
   button it adds in the bottom-right corner of the page.
 - When triggered, it scans the page for question groups (radio button
   groups and <select> dropdowns) whose nearby label/legend text looks
   like a demographic/EEO question (gender, race, ethnicity, veteran,
   disability, orientation, etc.), and within those groups only, selects
   the option whose text matches a "decline to answer" style phrase.
 - It briefly outlines whatever it selects in yellow so you can see what
   happened, and shows a small summary count in the corner.
 - It does NOT touch any field outside those matched demographic groups --
   salary questions, work authorization, etc. are left alone.

 LIMITATIONS:
 - This is text-matching heuristics, not a certified integration with any
   ATS. Form markup varies by company/version, so on unusual layouts it
   may miss a question, or (rarely) misjudge one. Always glance at the
   page after running it, before you submit the application.
*/

(function () {
    'use strict';

    const DECLINE_PATTERNS = [
        'decline to self identify',
        'decline to answer',
        'decline to specify',
        'decline to state',
        'i do not wish to answer',
        'i do not wish to self',
        'do not wish to answer',
        'do not wish to disclose',
        'prefer not to answer',
        'prefer not to say',
        'prefer not to disclose',
        'choose not to disclose',
        'choose not to answer',
        'not specified',
        'not disclosed',
        'i don\'t wish to answer',
    ];

    const DEMOGRAPHIC_KEYWORDS = [
        'gender', 'sex', 'race', 'ethnicity', 'ethnic', 'veteran',
        'disability', 'disabled', 'sexual orientation', 'transgender',
        'hispanic', 'latino', 'latina', 'self-identif', 'self identif',
        'protected veteran', 'gender identity',
    ];

    function normText(s) {
        return (s || '').toLowerCase().trim();
    }

    function textMatchesAny(text, patterns) {
        const t = normText(text);
        return patterns.some(p => t.includes(p));
    }

    // Walk up from an element a few levels looking for a container whose
    // text content suggests this is a demographic/EEO question.
    function isInDemographicContext(el) {
        let node = el;
        for (let i = 0; i < 6 && node; i++) {
            const label = getGroupLabelText(node);
            if (label && textMatchesAny(label, DEMOGRAPHIC_KEYWORDS)) {
                return true;
            }
            node = node.parentElement;
        }
        return false;
    }

    // Best-effort: find the "heading" text for a container -- a <legend>,
    // a preceding <label>, an aria-label, or just its own first line of text.
    function getGroupLabelText(node) {
        if (!node || !node.getAttribute) return '';
        const legend = node.querySelector && node.querySelector('legend');
        if (legend) return legend.textContent;
        const ariaLabel = node.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;
        const labelledBy = node.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelEl = document.getElementById(labelledBy);
            if (labelEl) return labelEl.textContent;
        }
        // Fall back to the container's own visible text, truncated --
        // enough to catch a heading/question line without the whole DOM subtree.
        return (node.textContent || '').slice(0, 300);
    }

    function highlight(el) {
        const prevOutline = el.style.outline;
        el.style.outline = '3px solid #f5c518';
        setTimeout(() => { el.style.outline = prevOutline; }, 2000);
    }

    function fireChange(el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function handleRadioGroups() {
        let count = 0;
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const groups = {};
        radios.forEach(r => {
            const key = r.name || r.getAttribute('data-group') || 'ungrouped-' + Math.random();
            groups[key] = groups[key] || [];
            groups[key].push(r);
        });

        Object.values(groups).forEach(group => {
            if (group.length < 2) return; // not really a group
            const anyInDemographicContext = group.some(r => isInDemographicContext(r));
            if (!anyInDemographicContext) return;

            for (const radio of group) {
                let labelText = '';
                if (radio.id) {
                    const lbl = document.querySelector(`label[for="${CSS.escape(radio.id)}"]`);
                    if (lbl) labelText = lbl.textContent;
                }
                if (!labelText && radio.closest('label')) {
                    labelText = radio.closest('label').textContent;
                }
                if (!labelText) {
                    // Sometimes the label is a sibling span/div right after the input
                    const sibling = radio.nextElementSibling;
                    if (sibling) labelText = sibling.textContent;
                }
                if (textMatchesAny(labelText, DECLINE_PATTERNS)) {
                    radio.checked = true;
                    fireChange(radio);
                    highlight(radio.closest('label') || radio);
                    count++;
                    break; // one selection per group
                }
            }
        });
        return count;
    }

    function handleSelects() {
        let count = 0;
        const selects = Array.from(document.querySelectorAll('select'));
        selects.forEach(sel => {
            if (!isInDemographicContext(sel)) return;
            for (let i = 0; i < sel.options.length; i++) {
                if (textMatchesAny(sel.options[i].textContent, DECLINE_PATTERNS)) {
                    sel.selectedIndex = i;
                    fireChange(sel);
                    highlight(sel);
                    count++;
                    break;
                }
            }
        });
        return count;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '70px', right: '20px', zIndex: 999999,
            background: '#222', color: '#fff', padding: '10px 14px',
            borderRadius: '6px', fontSize: '13px', fontFamily: 'sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', maxWidth: '280px',
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function runAutoDecline() {
        const radioCount = handleRadioGroups();
        const selectCount = handleSelects();
        const total = radioCount + selectCount;
        showToast(total > 0
            ? `Auto-declined ${total} demographic question(s). Double-check before submitting.`
            : 'No matching demographic questions found on this page.');
    }

    function addFloatingButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Decline demo Qs';
        btn.title = 'Auto-select "decline to answer" on demographic questions (Ctrl+Shift+D)';
        Object.assign(btn.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 999999,
            padding: '8px 12px', background: '#333', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        });
        btn.addEventListener('click', runAutoDecline);
        document.body.appendChild(btn);
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            runAutoDecline();
        }
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        addFloatingButton();
    } else {
        window.addEventListener('DOMContentLoaded', addFloatingButton);
    }
})();