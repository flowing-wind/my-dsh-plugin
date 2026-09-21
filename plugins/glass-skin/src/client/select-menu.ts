/** Browser-rendered menus for native select controls while the skin is enabled.
 * @returns disposer restoring native controls and removing the open menu.
 */
export function installSelectMenus(): () => void {
  let popup: HTMLDivElement | undefined
  let source: HTMLSelectElement | undefined
  let active = 0
  const close = () => { popup?.remove(); popup = undefined; source?.removeAttribute('aria-expanded'); source = undefined }
  const position = () => { if(!popup || !source) return; const r = source.getBoundingClientRect(); const height = Math.min(320, innerHeight - 32); popup.style.width = `${Math.min(Math.max(r.width, 180), innerWidth - 24)}px`; popup.style.maxHeight = `${height}px`; popup.style.left = `${Math.max(12, Math.min(r.left, innerWidth - popup.offsetWidth - 12))}px`; popup.style.top = `${r.bottom + 6 + popup.offsetHeight <= innerHeight - 12 ? r.bottom + 6 : Math.max(12, r.top - popup.offsetHeight - 6)}px` }
  const choose = (index: number) => { if(!source) return; const select = source; const option = select.options[index]; if(!option || option.disabled) return; select.value = option.value; select.dispatchEvent(new Event('change', { bubbles: true })); close(); select.focus() }
  const highlight = () => { if(!popup) return; for(const item of popup.querySelectorAll<HTMLButtonElement>('button')) item.dataset.active = String(Number(item.dataset.index) === active); popup.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }) }
  const open = (select: HTMLSelectElement) => {
    close(); source = select; active = select.selectedIndex; popup = document.createElement('div'); popup.dataset.skinSelect = ''; popup.setAttribute('role', 'listbox'); popup.setAttribute('popover', 'manual'); popup.setAttribute('aria-label', select.getAttribute('aria-label') ?? select.labels?.[0]?.textContent ?? '');
    for(const [index, option] of [...select.options].entries()){ if(option.hidden) continue; const button = document.createElement('button'); button.type = 'button'; button.textContent = option.text; button.disabled = option.disabled; button.dataset.index = String(index); button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(option.selected)); button.addEventListener('click', () => choose(index)); popup.append(button) }
    document.body.append(popup); popup.showPopover(); select.setAttribute('aria-expanded','true'); select.focus(); position(); highlight()
  }
  const pointer = (event: PointerEvent) => { const target = event.target; if(target instanceof HTMLSelectElement && !target.disabled && !target.multiple){ event.preventDefault(); if(source === target) close(); else open(target); return } if(popup && target instanceof Node && !popup.contains(target)) close() }
  const key = (event: KeyboardEvent) => { const target = event.target; if(!(target instanceof HTMLSelectElement) || target.disabled || target.multiple) return; if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();if(!popup){open(target);return}if(event.key==='Enter'||event.key===' '){choose(active);return}const step=event.key==='ArrowDown'?1:-1;let next=active+step;while(next>=0&&next<target.options.length&&(target.options[next]!.disabled||target.options[next]!.hidden))next+=step;active=Math.max(0,Math.min(target.options.length-1,next));highlight()}else if(event.key==='Escape'&&popup){event.preventDefault();event.stopImmediatePropagation();close()}else if(event.key==='Tab'){close()} }
  document.addEventListener('pointerdown',pointer,true);document.addEventListener('keydown',key,true);window.addEventListener('resize',position);document.addEventListener('scroll',position,true)
  return () => { close();document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('keydown',key,true);window.removeEventListener('resize',position);document.removeEventListener('scroll',position,true) }
}
