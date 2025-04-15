
import { useEffect, useRef } from 'react';

type Point = { x: number; y: number; };

const MarketVisuals = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Generate initial chart data
    let data: Point[] = [];
    const generateData = () => {
      data = [];
      const steps = 100;
      let lastY = Math.random() * 100 + 100;
      
      for (let i = 0; i < steps; i++) {
        const x = (canvas.width / steps) * i;
        // Random walk with mean reversion
        lastY = lastY + (Math.random() - 0.51) * 10;
        // Ensure we don't go too high or too low
        lastY = Math.max(50, Math.min(lastY, 250));
        data.push({ x, y: lastY });
      }
    };
    
    generateData();
    
    // Variables for animation
    let animationFrame: number;
    let lastTime = 0;
    let updateInterval = 100; // ms between data updates
    
    // Draw price chart
    const drawChart = (time: number) => {
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update data periodically
      if (time - lastTime > updateInterval) {
        // Shift data points left
        data = data.map((point, i) => {
          return {
            x: point.x,
            y: i < data.length - 1 ? data[i + 1].y : data[i].y + (Math.random() - 0.51) * 8
          };
        });
        
        // Ensure last point doesn't go too high or low
        const lastPoint = data[data.length - 1];
        lastPoint.y = Math.max(50, Math.min(lastPoint.y, 250));
        
        lastTime = time;
      }
      
      // Draw chart line
      ctx.beginPath();
      ctx.moveTo(data[0].x, data[0].y);
      
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(data[i].x, data[i].y);
      }
      
      // Style line
      ctx.strokeStyle = '#ea384c';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Fill area under the line
      ctx.lineTo(data[data.length - 1].x, canvas.height);
      ctx.lineTo(data[0].x, canvas.height);
      ctx.closePath();
      
      // Create gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(234, 56, 76, 0.3)');
      gradient.addColorStop(1, 'rgba(234, 56, 76, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw grid lines
      drawGrid();
      
      // Draw ticker symbols
      drawTickers();
      
      // Continue animation
      animationFrame = requestAnimationFrame(drawChart);
    };
    
    // Draw background grid
    const drawGrid = () => {
      if (!ctx) return;
      
      ctx.beginPath();
      const gridSize = 50;
      
      // Draw vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      // Draw horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      
      ctx.strokeStyle = 'rgba(64, 62, 67, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };
    
    // Draw financial ticker symbols
    const drawTickers = () => {
      if (!ctx) return;
      
      const tickers = [
        { symbol: 'EURUSD', price: '1.0' + Math.floor(Math.random() * 900 + 100).toString(), change: Math.random() > 0.5 },
        { symbol: 'SPX', price: Math.floor(Math.random() * 1000 + 4000).toString(), change: Math.random() > 0.5 },
        { symbol: 'AAPL', price: Math.floor(Math.random() * 50 + 150).toString(), change: Math.random() > 0.5 },
        { symbol: 'TSLA', price: Math.floor(Math.random() * 100 + 200).toString(), change: Math.random() > 0.5 },
        { symbol: 'BTC', price: Math.floor(Math.random() * 5000 + 30000).toString(), change: Math.random() > 0.5 },
        { symbol: 'VIX', price: (Math.random() * 10 + 15).toFixed(2), change: Math.random() > 0.5 }
      ];
      
      ctx.font = '12px Roboto Mono';
      ctx.textAlign = 'left';
      
      tickers.forEach((ticker, i) => {
        const x = 20;
        const y = 30 + i * 25;
        
        // Symbol
        ctx.fillStyle = 'rgba(238, 238, 238, 0.7)';
        ctx.fillText(ticker.symbol, x, y);
        
        // Price
        ctx.fillStyle = ticker.change ? '#4ade80' : '#ef4444';
        ctx.fillText(ticker.price, x + 80, y);
        
        // Arrow
        ctx.fillText(ticker.change ? '▲' : '▼', x + 150, y);
      });
    };
    
    // Start animation
    animationFrame = requestAnimationFrame(drawChart);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full -z-10 opacity-20"
    />
  );
};

export default MarketVisuals;
