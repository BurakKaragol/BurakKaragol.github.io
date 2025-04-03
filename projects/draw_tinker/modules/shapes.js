export class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.color = '#00ff88';
    }
  
    draw(ctx) {
      ctx.fillStyle = this.color || '#00ff88';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  
    drawOutline(ctx) {
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  
    isHit(x, y) {
      const dx = this.x - x;
      const dy = this.y - y;
      return dx * dx + dy * dy < 10 * 10;
    }
  }
  
  export class Line {
    constructor(p1, p2) {
      this.p1 = p1;
      this.p2 = p2;
      this.color = '#ffaa00';
    }
  
    draw(ctx) {
      ctx.strokeStyle = this.color || '#ffaa00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.stroke();
    }
  
    isHit(x, y) {
      const tolerance = 6;
      const { x: x1, y: y1 } = this.p1;
      const { x: x2, y: y2 } = this.p2;
  
      const A = x - x1;
      const B = y - y1;
      const C = x2 - x1;
      const D = y2 - y1;
  
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      const param = lenSq !== 0 ? dot / lenSq : -1;
  
      let xx, yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
  
      const dx = x - xx;
      const dy = y - yy;
      return dx * dx + dy * dy <= tolerance * tolerance;
    }

    bounds() {
        const x1 = this.p1.x;
        const y1 = this.p1.y;
        const x2 = this.p2.x;
        const y2 = this.p2.y;
      
        return {
          x1: Math.min(x1, x2),
          y1: Math.min(y1, y2),
          x2: Math.max(x1, x2),
          y2: Math.max(y1, y2),
        };
      }
      
  }
  