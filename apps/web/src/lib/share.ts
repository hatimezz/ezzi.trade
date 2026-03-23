// Share card generation for social media
interface ShareCardData {
  rarity?: string;
  name?: string;
  resultType?: 'nft' | 'tokens';
  nftName?: string;
  amount?: number;
  hours?: number;
}

export async function generateShareCard({
  type,
  data,
}: {
  type: 'nft' | 'capsule' | 'mining';
  data: ShareCardData;
}): Promise<string> {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 675);
  gradient.addColorStop(0, '#02020a');
  gradient.addColorStop(1, '#0d0d1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 675);

  // Border
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, 1160, 635);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px Rajdhani';
  ctx.textAlign = 'center';

  if (type === 'nft') {
    ctx.fillText('I just got an NFT!', 600, 150);

    // NFT Name
    ctx.font = 'bold 80px Rajdhani';
    ctx.fillStyle = getRarityColor(data.rarity ?? 'common');
    ctx.fillText(data.name ?? 'Unknown NFT', 600, 300);

    // Rarity
    ctx.font = '40px Inter';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${(data.rarity ?? 'common').toUpperCase()}`, 600, 380);

    // From
    ctx.font = '30px Inter';
    ctx.fillStyle = '#888888';
    ctx.fillText('from EZZI World', 600, 450);
  } else if (type === 'capsule') {
    ctx.fillText('I opened a capsule!', 600, 150);

    // Result
    ctx.font = 'bold 80px Rajdhani';
    ctx.fillStyle = data.resultType === 'nft' ? '#00d4ff' : '#ffd700';
    const displayText = data.resultType === 'nft'
      ? (data.nftName ?? 'Unknown NFT')
      : `${data.amount ?? 0} EZZI`;
    ctx.fillText(displayText, 600, 300);
  } else if (type === 'mining') {
    ctx.fillText('I mined EZZI!', 600, 150);

    // Amount
    ctx.font = 'bold 100px Rajdhani';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText(`${data.amount ?? 0} EZZI`, 600, 300);

    // Time
    ctx.font = '40px Inter';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`in ${data.hours ?? 0} hours`, 600, 380);
  }

  // Footer
  ctx.font = '30px Inter';
  ctx.fillStyle = '#888888';
  ctx.fillText('ezzi.trade', 600, 580);

  // Convert to data URL
  return canvas.toDataURL('image/png');
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#8a9bb0',
    rare: '#4d9fff',
    epic: '#b44dff',
    legendary: '#ffd700',
    mythic: '#ff00ff',
  };
  return colors[rarity] || '#ffffff';
}

// Download share card
export function downloadShareCard(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Share on Twitter
export function shareOnTwitter(text: string, _imageUrl?: string) {
  const url = encodeURIComponent('https://ezzi.trade');
  const tweetText = encodeURIComponent(text);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`;
  window.open(twitterUrl, '_blank');
}

// Share on Telegram
export function shareOnTelegram(text: string) {
  const url = encodeURIComponent('https://ezzi.trade');
  const message = encodeURIComponent(text);
  const telegramUrl = `https://t.me/share/url?url=${url}&text=${message}`;
  window.open(telegramUrl, '_blank');
}
