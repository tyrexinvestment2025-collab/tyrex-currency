import React from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Sheet } from '../../ui';

/** QR реферальной ссылки — для встреч вживую */
const ShareSheet: React.FC<{ open: boolean; onClose: () => void; link: string }> = ({ open, onClose, link }) => {
    const { t } = useTranslation('partners');
    return (
        <Sheet open={open} onClose={onClose} title={t('link.qrTitle')}>
            <div className="flex flex-col items-center py-4">
                <div className="bg-white p-4 rounded-card">
                    <QRCodeSVG value={link} size={220} level="M" marginSize={0} />
                </div>
                <p className="text-callout text-muted text-center mt-4 max-w-[280px]">{t('link.qrHint')}</p>
                <p className="font-mono text-caption text-muted break-all text-center mt-3">{link}</p>
            </div>
        </Sheet>
    );
};

export default ShareSheet;
