import { lang } from '../lib/i18n';

const btn = document.getElementById('copy-btn');
const pre = document.getElementById('cmd');
if (btn && pre) {
  const label = (en: string, ms: string) => (lang() === 'ms' ? ms : en);
  const reset = () => { btn.textContent = label('Copy', 'Salin'); };
  btn.addEventListener('click', () => {
    const select = () => {
      const r = document.createRange(); r.selectNodeContents(pre);
      const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
      btn.textContent = label('Selected', 'Dipilih'); setTimeout(reset, 1600);
    };
    const done = () => { btn.textContent = label('Copied', 'Disalin'); setTimeout(reset, 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(pre.innerText).then(done, select);
    else select();
  });
}
