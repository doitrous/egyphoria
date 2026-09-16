// Progressive upgrade for the server-rendered .seo-share block (see build.mjs
// shareBlockHtml()). The WhatsApp/X/Facebook/LinkedIn links and the copy-link
// button already work with zero JS; this only adds navigator.share() on
// phones and wires the clipboard copy. No-op on pages with no .seo-share block.
document.querySelectorAll('.seo-share').forEach((el) => {
  const url = el.dataset.shareUrl, title = el.dataset.shareTitle;
  if (navigator.share) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seo-share-native';
    btn.textContent = 'Share';
    btn.addEventListener('click', () => navigator.share({ url, title }).catch(() => {}));
    el.prepend(btn);
  }
  const copyBtn = el.querySelector('.seo-share-copy');
  if (copyBtn) {
    const label = copyBtn.textContent;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = copyBtn.dataset.copied || 'Copied!';
        setTimeout(() => { copyBtn.textContent = label; }, 1500);
      } catch {}
    });
  }
});
