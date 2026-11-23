/* ==========================================================================
   CONFIG — the only place you need to edit if the Google Form changes.
   Option text must match the Google Form EXACTLY (including curly ’).
   Verified against the live form's FB_PUBLIC_LOAD_DATA_ on 2026-11-23.

   type: "checkbox" (multiple answers), "radio" (one answer), "scale" (linear scale)
   other: true  -> Google's built-in "Other" option with a text box
   ========================================================================== */
const CONFIG = {
  formId: '1FAIpQLSctEjG5cFtYR0NGwohlyUQcscaagunSVes6E_1ieL_YF19T3Q',

  questions: [
    {
      entry: '942339231',
      type: 'checkbox',
      required: true,
      label: 'How did you learn about the Data Liberation Project?',
      options: [
        'Friend or Family Member',
        'Email / Newsletter',
        'Social Media',
        'Word of Mouth',
        'While Filing a Request',
      ],
    },
    {
      entry: '343321527',
      type: 'checkbox',
      required: true,
      label: 'In which sectors are you interested in?',
      options: [
        'Healthcare',
        'Military',
        'Government',
        'Education',
        'Climate / Environment',
        'Civil Rights',
        'Immigration',
        'Policing',
        'Data Centers and AI',
      ],
      other: true,
      columns: 2,
    },
    {
      entry: '2071234059',
      type: 'radio',
      required: true,
      label: 'Are you interested in volunteering for the Data Liberation Project?',
      options: ['Yes', 'No'],
    },
    {
      entry: '946806936',
      type: 'checkbox',
      required: true,
      label: 'How would you like to help?',
      options: [
        'I would like to file FOIA Requests for DLP',
        'I can Proofread FOIA Data for DLP',
        'I would like to Analyze Data',
        'I would love to Clean FOIA Data',
        'I can’t help right now, but I would like to help later',
      ],
    },
    {
      entry: '2006114676',
      type: 'radio',
      required: true,
      label: 'How do you prefer to learn about the Data Liberation Project?',
      options: [
        'Social Media (Instagram, BlueSky, LinkedIn)',
        'YouTube',
        'Podcasts',
        'Email',
        'Slack',
        'FOIA Friday’s',
        'MuckRock Website',
      ],
      other: true,
    },
    {
      entry: '2145231935',
      type: 'radio',
      required: true,
      label: 'Which newsrooms do you know about?',
      options: ['MuckRock Foundation'],
      other: true,
    },
    {
      entry: '1573240963',
      type: 'scale',
      required: true,
      label: 'How likely would you recommend DLP to a friend?',
      min: 1,
      max: 5,
      minLabel: 'Worst',
      maxLabel: 'Best',
      emojis: ['😞', '🙁', '😐', '🙂', '🤩'],
    },
  ],

  /* The "little something" shown on the thank-you screen.
     Set to null to hide the card. linkText/linkUrl are optional. */
  reward: null,
  // Example:
  // reward: {
  //   title: 'Free DLP sticker pack',
  //   text: 'Use the link below to claim it.',
  //   linkText: 'Claim my gift',
  //   linkUrl: 'https://example.com',
  // },
};

const FORM_RESPONSE_URL = `https://docs.google.com/forms/d/e/${CONFIG.formId}/formResponse`;
const FORM_VIEW_URL = `https://docs.google.com/forms/d/e/${CONFIG.formId}/viewform`;
const OTHER_VALUE = '__other_option__';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TOTAL = CONFIG.questions.length;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (id) => document.getElementById(id);
const els = {
  form: $('dlp-form'),
  questions: $('questions'),
  progress: $('progress'),
  progressFill: $('progress-fill'),
  stepper: $('stepper'),
  prev: $('prev-btn'),
  next: $('next-btn'),
  announcer: $('announcer'),
  success: $('success-view'),
  successHeading: $('success-heading'),
  again: $('again-btn'),
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value; // only used with static strings below
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

const ARROW_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>';
const TICK_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ==========================================================================
   Rendering: one <fieldset> "screen" per question
   ========================================================================== */
function renderQuestion(q, index) {
  const n = index + 1;
  const qid = `q${n}`;
  const name = `entry.${q.entry}`;
  const isLast = n === TOTAL;

  // Screen wrapper > inner > <fieldset> whose first child is its <legend>
  const screen = el('div', { class: 'step question', id: qid, 'data-step': n, 'data-index': index });
  const inner = el('div', { class: 'step-inner' });
  const box = el('fieldset', { class: 'q-fieldset', 'aria-describedby': `${qid}-hint ${qid}-error` });

  box.append(
    el('legend', { class: 'q-head' }, [
      el('span', { class: 'q-num', html: `${n}${ARROW_SVG}` }),
      el('span', { class: 'q-title', id: `${qid}-title`, tabindex: '-1' }, [
        document.createTextNode(q.label),
        q.required ? el('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null,
        el('span', { class: 'sr-only', text: ` (question ${n} of ${TOTAL}${q.required ? ', required' : ''})` }),
      ]),
    ]),
  );

  const hintText = q.type === 'checkbox' ? 'Choose as many as you like'
    : q.type === 'scale' ? `${q.min} = ${q.minLabel}, ${q.max} = ${q.maxLabel}`
    : 'Choose one';
  box.append(el('p', { class: 'hint', id: `${qid}-hint`, text: hintText }));

  if (q.type === 'scale') {
    const options = el('div', { class: 'scale-options' });
    for (let v = q.min; v <= q.max; v++) {
      const endLabel = v === q.min ? q.minLabel : v === q.max ? q.maxLabel : '';
      options.append(el('label', { class: 'scale-option', 'data-key': String(v) }, [
        el('input', { type: 'radio', name, value: String(v) }),
        el('span', { class: 'scale-face' }, [
          el('span', { class: 'emoji', 'aria-hidden': 'true', text: (q.emojis || [])[v - q.min] || '' }),
          el('span', { class: 'num', text: String(v) }),
          endLabel ? el('span', { class: 'sr-only', text: ` (${endLabel})` }) : null,
        ]),
      ]));
    }
    box.append(el('div', { class: 'scale' }, [
      options,
      el('div', { class: 'scale-labels', 'aria-hidden': 'true' }, [
        el('span', { text: q.minLabel }),
        el('span', { text: q.maxLabel }),
      ]),
    ]));
  } else {
    const items = q.options.map((text) => ({ text, value: text }));
    if (q.other) items.push({ text: 'Other', value: OTHER_VALUE, other: true });

    const options = el('div', { class: `options${q.columns === 2 ? ' two-col' : ''}` });
    items.forEach((item, i) => {
      options.append(el('label', { class: 'option', 'data-key': LETTERS[i] }, [
        el('input', {
          type: q.type, name, value: item.value,
          'data-other': item.other ? 'true' : null,
          'aria-controls': item.other ? `${qid}-other-wrap` : null,
        }),
        el('span', { class: 'key', 'aria-hidden': 'true', text: LETTERS[i] }),
        el('span', { class: 'option-text', text: item.text }),
        el('span', { class: 'tick', html: TICK_SVG }),
      ]));
    });
    box.append(options);

    if (q.other) {
      box.append(el('div', { class: 'other-wrap', id: `${qid}-other-wrap`, hidden: true }, [
        el('label', { for: `${qid}-other-text`, text: 'Tell us more' }),
        el('input', {
          type: 'text', class: 'text-input', id: `${qid}-other-text`,
          name: `${name}.other_option_response`,
          placeholder: 'Type your answer here…', autocomplete: 'off',
          disabled: true, // disabled inputs are left out of the submission
        }),
      ]));
    }
  }

  box.append(el('p', { class: 'field-error', id: `${qid}-error`, role: 'alert' }));

  const actions = el('div', { class: 'actions' }, [
    isLast
      ? el('button', { type: 'submit', class: 'btn btn-ok', id: 'submit-btn' }, [el('span', { class: 'btn-label', text: 'Submit' })])
      : el('button', { type: 'button', class: 'btn btn-ok', 'data-action': 'ok', html: `OK ${TICK_SVG}` }),
    el('span', { class: 'enter-hint', 'aria-hidden': 'true', html: 'press <kbd>Enter ↵</kbd>' }),
  ]);
  box.append(actions);

  inner.append(box);
  screen.append(inner);
  return screen;
}

CONFIG.questions.forEach((q, i) => els.questions.append(renderQuestion(q, i)));
const steps = [...els.form.querySelectorAll('.step')]; // [welcome, q1..q7]
const submitBtn = $('submit-btn');

/* ==========================================================================
   Answer state + validation (mirrors the Google Form's required questions)
   ========================================================================== */
const questionOf = (fs) => CONFIG.questions[Number(fs.dataset.index)];

function syncOther(fs) {
  const otherInput = fs.querySelector('input[data-other]');
  if (!otherInput) return null;
  const wrap = fs.querySelector('.other-wrap');
  const text = wrap.querySelector('input');
  const on = otherInput.checked;
  wrap.hidden = !on;
  text.disabled = !on;
  text.required = on;
  otherInput.setAttribute('aria-expanded', String(on));
  return { on, text };
}

function problemWith(fs) {
  const q = questionOf(fs);
  const checked = fs.querySelectorAll('input:checked');
  const otherOn = !!fs.querySelector('input[data-other]:checked');
  const otherText = fs.querySelector('.other-wrap input');
  if (q.required && checked.length === 0) {
    return {
      message: q.type === 'checkbox' ? 'Please select at least one option'
        : q.type === 'scale' ? `Please pick a number from ${q.min} to ${q.max}`
        : 'Please choose an option',
      focus: fs.querySelector('input'),
    };
  }
  if (otherOn && !otherText.value.trim()) {
    return { message: 'Please type your “Other” answer', focus: otherText };
  }
  return null;
}

function showError(fs, problem) {
  const errorEl = fs.querySelector('.field-error');
  errorEl.textContent = '';
  if (problem) {
    // re-trigger the shake animation
    void errorEl.offsetWidth;
    errorEl.textContent = problem.message;
  }
  const otherText = fs.querySelector('.other-wrap input');
  if (otherText) otherText.setAttribute('aria-invalid', String(!!problem && problem.focus === otherText));
}

function updateProgress() {
  const answered = steps.slice(1).filter((fs) => !problemWith(fs)).length;
  els.progressFill.style.width = `${(answered / TOTAL) * 100}%`;
  els.progress.setAttribute('aria-valuenow', String(answered));
  els.progress.setAttribute('aria-valuetext', `${answered} of ${TOTAL} answered`);
}

/* ==========================================================================
   Navigation
   ========================================================================== */
let current = 0;
let autoAdvanceTimer = null;

function goTo(index, { focus = true } = {}) {
  clearTimeout(autoAdvanceTimer);
  if (index < 0 || index >= steps.length || index === current) return;
  const dir = index > current ? 'enter-forward' : 'enter-back';
  const from = steps[current];
  const to = steps[index];

  from.classList.remove('is-active', 'enter-forward', 'enter-back');
  to.classList.remove('enter-forward', 'enter-back');
  to.classList.add('is-active');
  if (!reducedMotion) to.classList.add(dir);
  current = index;

  const inQuestions = current > 0;
  els.progress.hidden = !inQuestions;
  els.stepper.hidden = !inQuestions;
  els.prev.disabled = current <= 1;
  els.next.disabled = current >= steps.length - 1;
  updateProgress();
  window.scrollTo({ top: 0 });

  if (inQuestions) els.announcer.textContent = `Question ${current} of ${TOTAL}`;
  if (focus) {
    const target = inQuestions ? to.querySelector('.q-title') : to.querySelector('h1');
    target.focus({ preventScroll: true });
  }
}

/** "OK" on the current screen: validate, then move on (or submit on the last one). */
function confirmStep() {
  if (current === 0) return goTo(1);
  const fs = steps[current];
  const problem = problemWith(fs);
  showError(fs, problem);
  if (problem) { problem.focus.focus(); return; }
  if (current === steps.length - 1) els.form.requestSubmit(submitBtn);
  else goTo(current + 1);
}

function queueAutoAdvance() {
  clearTimeout(autoAdvanceTimer);
  if (current === steps.length - 1) return; // never auto-submit
  const from = current;
  autoAdvanceTimer = setTimeout(() => { if (current === from) confirmStep(); }, 450);
}

/* ==========================================================================
   Events
   ========================================================================== */
// Pointer clicks on single-choice options auto-advance (like Typeform).
// Arrow-key changes inside a radio group don't, so keyboard users can browse.
let lastPointer = 0;
els.form.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.option, .scale-option')) lastPointer = Date.now();
});

els.form.addEventListener('change', (e) => {
  const fs = e.target.closest('.question');
  if (!fs || !e.target.matches('input[type=checkbox], input[type=radio]')) return;
  const other = syncOther(fs);
  if (other && other.on && e.target.dataset.other && e.target.checked) other.text.focus();
  if (fs.querySelector('.field-error').textContent) showError(fs, problemWith(fs));
  updateProgress();

  const isSingle = e.target.type === 'radio';
  const fromPointer = Date.now() - lastPointer < 800;
  if (isSingle && fromPointer && !e.target.dataset.other) queueAutoAdvance();
});

els.form.addEventListener('input', (e) => {
  if (!e.target.matches('.text-input')) return;
  const fs = e.target.closest('.question');
  if (fs.querySelector('.field-error').textContent) showError(fs, problemWith(fs));
  updateProgress();
});

els.form.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'next' || btn.dataset.action === 'ok') confirmStep();
});

els.prev.addEventListener('click', () => goTo(current - 1));
els.next.addEventListener('click', confirmStep);

// Keyboard shortcuts: Enter = OK, letters pick options, 1–5 pick a rating.
document.addEventListener('keydown', (e) => {
  if (!els.success.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  const inText = t.matches && t.matches('input[type=text], textarea');

  if (e.key === 'Enter' && !e.shiftKey) {
    if (t.closest && t.closest('button, a')) return; // let buttons/links act normally
    e.preventDefault();
    if (!submitBtn.disabled) confirmStep();
    return;
  }
  if (inText || current === 0 || e.key.length !== 1) return;

  const fs = steps[current];
  const opt = fs.querySelector(`[data-key="${CSS.escape(e.key.toUpperCase())}"]`);
  if (!opt) return;
  e.preventDefault();
  const input = opt.querySelector('input');
  input.focus({ preventScroll: true }); // before change, so "Other" can move focus to its text box
  input.checked = input.type === 'checkbox' ? !input.checked : true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  if (!reducedMotion) { opt.classList.remove('flash'); void opt.offsetWidth; opt.classList.add('flash'); }
  if (input.type === 'radio' && !input.dataset.other) queueAutoAdvance();
});

/* ==========================================================================
   Submit
   ========================================================================== */
function setSending(sending) {
  submitBtn.disabled = sending;
  els.form.setAttribute('aria-busy', String(sending));
  submitBtn.replaceChildren(
    ...(sending ? [el('span', { class: 'spinner', 'aria-hidden': 'true' })] : []),
    el('span', { class: 'btn-label', text: sending ? 'Sending…' : 'Submit' }),
  );
}

function buildPayload() {
  // Checkbox questions produce one entry.ID pair per selected option.
  // Disabled "Other" text boxes are skipped automatically by FormData.
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(els.form)) {
    params.append(key, key.endsWith('.other_option_response') ? value.trim() : value);
  }
  params.append('fvv', '1');
  params.append('pageHistory', '0');
  return params;
}

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitBtn.disabled) return;

  // Final safety net: every required answer must be present, or Google silently drops the response.
  const firstBad = steps.slice(1).find((fs) => problemWith(fs));
  if (firstBad) {
    goTo(steps.indexOf(firstBad));
    const problem = problemWith(firstBad);
    showError(firstBad, problem);
    problem.focus.focus();
    return;
  }

  const lastFs = steps[steps.length - 1];
  setSending(true);
  try {
    // no-cors: the response is opaque, so a resolved fetch is treated as success.
    await fetch(FORM_RESPONSE_URL, { method: 'POST', mode: 'no-cors', body: buildPayload() });
    showSuccess();
  } catch (err) {
    console.error('Submission failed:', err);
    const errorEl = lastFs.querySelector('.field-error');
    errorEl.textContent = '';
    errorEl.append(
      'Couldn’t send. Check your connection and try again, or ',
      el('a', { href: FORM_VIEW_URL, target: '_blank', rel: 'noopener', text: 'use Google Forms' }),
      '.',
    );
  } finally {
    setSending(false);
  }
});

/* ==========================================================================
   Thank-you screen + confetti
   ========================================================================== */
function showSuccess() {
  steps[current].classList.remove('is-active');
  els.form.hidden = true;
  els.stepper.hidden = true;
  els.progressFill.style.width = '100%';

  const r = CONFIG.reward;
  $('reward-card').hidden = !r;
  if (r) {
    $('reward-title').textContent = r.title || '';
    $('reward-text').textContent = r.text || '';
    const link = $('reward-link');
    link.hidden = !(r.linkUrl && r.linkText);
    if (!link.hidden) { link.href = r.linkUrl; link.textContent = r.linkText; }
  }

  els.success.hidden = false;
  els.success.classList.add('is-active');
  window.scrollTo({ top: 0 });
  els.successHeading.focus({ preventScroll: true });
  launchConfetti();
}

function launchConfetti() {
  if (reducedMotion) return;
  const canvas = el('canvas', { class: 'confetti', 'aria-hidden': 'true' });
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const colors = ['#ffffff', '#9cc2ff', '#3b7bff', '#dbe7ff', '#ffd166'];
  const pieces = Array.from({ length: 180 }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? -10 : innerWidth + 10,
      y: innerHeight * (0.55 + Math.random() * 0.35),
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
      vy: -(10 + Math.random() * 12),
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: colors[i % colors.length],
    };
  });

  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pieces) {
      p.vy += 0.38; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 2600) / 900);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
      ctx.restore();
    }
    if (t < 3500) requestAnimationFrame(frame);
    else { removeEventListener('resize', resize); canvas.remove(); }
  })(start);
}

els.again.addEventListener('click', () => {
  els.form.reset();
  steps.slice(1).forEach((fs) => { syncOther(fs); showError(fs, null); });
  els.success.hidden = true;
  els.success.classList.remove('is-active');
  els.form.hidden = false;
  steps.forEach((s) => s.classList.remove('is-active', 'enter-forward', 'enter-back'));
  steps[0].classList.add('is-active');
  current = 0;
  els.progress.hidden = true;
  els.stepper.hidden = true;
  updateProgress();
  window.scrollTo({ top: 0 });
  steps[0].querySelector('h1').focus({ preventScroll: true });
});
