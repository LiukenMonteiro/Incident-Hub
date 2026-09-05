const DISPLAY_TIME_ZONE = process.env.DISPLAY_TIME_ZONE || 'America/Sao_Paulo';

function formatDateTime(value, timeZone = DISPLAY_TIME_ZONE) {
  if (!value) return '';

  const utcDate = new Date(`${value.replace(' ', 'T')}Z`);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(utcDate);
}

module.exports = { DISPLAY_TIME_ZONE, formatDateTime };
