'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, HardDriveDownload, QrCode, Share2 } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { encodeResumeLink, type TransferLink } from '@/utils/transfer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/**
 * "Save and move": the résumé lives in this browser (autosave). To open it on another device, a link
 * carries the data after "#" (never sent anywhere), copyable, shareable or as a QR code. No server involved.
 */
export function TransferPanel() {
  const { resume, lastSaved } = useResumeStore();
  const [link, setLink] = useState<TransferLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qr, setQr] = useState<{ dataUrl: string | null; tooBig: boolean }>({ dataUrl: null, tooBig: false });
  const [canShare, setCanShare] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // client-only capabilities, read after mount (keeps server and first client render identical)
    const t = setTimeout(() => {
      setCanShare(typeof navigator.share === 'function');
      setIsLocalhost(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Keep the link in sync with the résumé (debounced while typing)
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      encodeResumeLink(resume, window.location.origin)
        .then((l) => !cancelled && setLink(l))
        .catch(() => !cancelled && setLink(null));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [resume]);

  useEffect(() => {
    if (!showQr || !link) return;
    let cancelled = false;
    QRCode.toDataURL(link.url, { errorCorrectionLevel: 'L', margin: 1, width: 360 })
      .then((dataUrl) => !cancelled && setQr({ dataUrl, tooBig: false }))
      .catch(() => !cancelled && setQr({ dataUrl: null, tooBig: true })); // more data than a QR code can hold
    return () => {
      cancelled = true;
    };
  }, [showQr, link]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
    } catch {
      // clipboard blocked: select the field so the user can copy by hand
      const input = document.getElementById('transfer-link') as HTMLInputElement | null;
      input?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const share = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: 'Моё резюме', url: link.url });
    } catch {
      /* the user closed the share sheet */
    }
  };

  const sizeLabel = link ? `${(link.length / 1024).toFixed(1)} КБ` : '…';
  const long = (link?.length ?? 0) > 2000;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <HardDriveDownload className="mt-0.5 size-4 shrink-0" />
        <span>
          Резюме автоматически сохраняется <b className="font-medium text-foreground">на этом устройстве</b>
          {lastSaved || resume.updatedAt ? ` (${formatTime(lastSaved ?? resume.updatedAt)})` : ''}. На другое
          устройство его можно перенести ссылкой: данные никуда не отправляются.
        </span>
      </p>

      <div className="flex gap-2">
        <Input id="transfer-link" readOnly value={link?.url ?? 'Готовлю ссылку…'} onFocus={(e) => e.currentTarget.select()} className="h-9 min-w-0 flex-1 text-xs" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={copy} disabled={!link} className="flex-1">
          {copied ? <Check /> : <Copy />} {copied ? 'Скопировано' : 'Скопировать ссылку'}
        </Button>
        {canShare && (
          <Button type="button" size="sm" variant="outline" onClick={share} disabled={!link}>
            <Share2 /> Поделиться
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          <QrCode /> QR-код
        </Button>
      </div>

      {showQr && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white p-3">
          {qr.dataUrl ? (
            <img src={qr.dataUrl} alt="QR-код со ссылкой на резюме" className="h-auto w-full max-w-[300px]" />
          ) : qr.tooBig ? (
            <p className="text-center text-xs text-neutral-600">
              Резюме слишком большое для QR-кода. Отправьте ссылку кнопкой «Скопировать» или «Поделиться».
            </p>
          ) : (
            <p className="text-xs text-neutral-600">Рисую QR-код…</p>
          )}
          {qr.dataUrl && (
            <p className="text-center text-[11px] text-neutral-600">
              Наведите камеру другого устройства
              {(link?.length ?? 0) > 1200 && ' (код плотный: держите камеру ближе или отправьте ссылку)'}
            </p>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        <li>• Размер ссылки: {sizeLabel}. Фото не переносится: добавьте его на новом устройстве.</li>
        {long && <li>• Ссылка длинная: если мессенджер её обрезает, используйте «Поделиться» или копируйте целиком.</li>}
        {isLocalhost && (
          <li className="text-amber-600 dark:text-amber-400">
            • Сейчас приложение открыто на localhost: с другого устройства такая ссылка не откроется. На опубликованном
            сайте всё заработает.
          </li>
        )}
        <li>• Ссылка содержит ваши данные в открытом виде: не публикуйте её в общих чатах.</li>
      </ul>
    </div>
  );
}
