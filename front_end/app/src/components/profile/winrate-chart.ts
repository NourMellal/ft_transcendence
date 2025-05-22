import { fetchMatchHistory, MatchHistoryEntry } from '~/api/user';

class PlayerLineChart extends HTMLElement {
  async connectedCallback() {
    const canvas = document.createElement('canvas');
    this.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const user_id = this.getAttribute('data-uid');

    if (!user_id || !ctx) return;
    const history = await fetchMatchHistory(user_id);

    if (!history.success || !history.data || history.data.length === 0) {
      ctx.fillStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--muted-foreground');
      ctx.font = '16px Inter';
      ctx.fillText('No match data available', 10, 30);
      return;
    }

    const numDays = 7;
    const processedWins = Array(numDays).fill(0);
    const processedDayLabels = Array(numDays).fill('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (numDays - 1 - i));
      processedDayLabels[i] = date.toLocaleDateString(undefined, {
        weekday: 'short',
      });
    }

    history.data.forEach((match: MatchHistoryEntry) => {
      const isWin = match.state === 1 ? true : false;

      if (isWin) {
        const matchDate = new Date(match.started * 1000);
        matchDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < numDays; i++) {
          const dayToCompare = new Date(today);
          dayToCompare.setDate(today.getDate() - (numDays - 1 - i));
          if (matchDate.getTime() === dayToCompare.getTime()) {
            processedWins[i]++;
            break;
          }
        }
      }
    });

    const wins = processedWins;
    const days = processedDayLabels;

    let maxY = Math.max(...wins);
    if (maxY === 0) {
      maxY = 5;
    }
    const width = (canvas.width = this.clientWidth);
    const height = (canvas.height = this.clientHeight);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.strokeStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--muted-foreground');
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = '12px Inter';
    ctx.beginPath();
    for (let i = 0; i <= maxY; i++) {
      const y = height - padding - (i / maxY) * chartHeight;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.fillText(i.toString(), 5, y + 4);
    }
    ctx.stroke();

    const plotPoints = wins.map((val, i) => {
      const x = padding + (i / (wins.length - 1)) * chartWidth;
      const y = height - padding - (val / maxY) * chartHeight;
      return { x, y };
    });

    ctx.beginPath();
    if (plotPoints.length >= 2) {
      ctx.moveTo(plotPoints[0].x, plotPoints[0].y);

      if (plotPoints.length === 2) {
        ctx.lineTo(plotPoints[1].x, plotPoints[1].y);
      } else {
        for (let i = 0; i < plotPoints.length - 2; i++) {
          const p1 = plotPoints[i + 1];
          const p2 = plotPoints[i + 2];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        const lastPoint = plotPoints[plotPoints.length - 1];
        ctx.quadraticCurveTo(
          lastPoint.x,
          lastPoint.y,
          lastPoint.x,
          lastPoint.y
        );
      }
    }
    ctx.strokeStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--chart-2');
    ctx.lineWidth = 2;
    ctx.stroke();

    // plotPoints.forEach((point) => {
    //   ctx.beginPath();
    //   ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    //   ctx.fillStyle = getComputedStyle(
    //     document.documentElement
    //   ).getPropertyValue('--chart-1');
    //   ctx.fill();
    // });

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      '--muted-foreground'
    );
    days.forEach((day, i) => {
      const x = padding + (i / (wins.length - 1)) * chartWidth;
      ctx.fillText(day, x - 10, height - padding + 20);
    });
  }
}

if (!customElements.get('player-line-chart')) {
  customElements.define('player-line-chart', PlayerLineChart);
}
