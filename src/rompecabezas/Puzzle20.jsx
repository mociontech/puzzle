import { useMemo, useState, useEffect, useRef } from "react";
import "./puzzle20.css";

const ROWS = 4, COLS = 5, COUNT = ROWS * COLS;
const ASPECT = 16 / 9; // mismo de tus imágenes

function makeTiles(){ return Array.from({length:COUNT}, (_,i)=>({correctIndex:i,index:i})) }
function shuffle(arr){
  const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];}
  if (a.every((t,i)=>t.correctIndex===i)) [a[0],a[1]]=[a[1],a[0]];
  return a.map((t,i)=>({...t,index:i}));
}

export default function Puzzle20({ image, onWin }) {
  const baseTiles = useMemo(()=>makeTiles(),[]);
  const [tiles,setTiles]=useState(()=>shuffle(baseTiles));
  const [moves,setMoves]=useState(0);
  const [selected,setSelected]=useState(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: Math.round(800/ASPECT) });

  // --- Auto-fit a la ventana: máximo tamaño sin salirse (mantiene 16:9)
useEffect(() => {
  function fit() {
    if (!wrapRef.current) return;
    const top = wrapRef.current.getBoundingClientRect().top;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const padding = 16;                       // respiración lateral y superior
    const bottomGap = Math.max(56, vh * 0.06); // ← franja negra (~6% del alto, mín 56px)

    const availableH = Math.max(200, vh - top - padding - bottomGap);
    const widthByHeight = availableH * ASPECT;
    const widthByViewport = vw - padding * 2;

    const w = Math.floor(Math.min(widthByHeight, widthByViewport));
    const h = Math.floor(w / ASPECT);

    setSize({ w, h });
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  return () => {
    window.removeEventListener("resize", fit);
    window.removeEventListener("orientationchange", fit);
  };
}, []);


  const solved = tiles.every((t,i)=>t.correctIndex===i);
  useEffect(()=>{ if(solved && onWin) onWin(moves); },[solved]);

  function swap(i,j){ if(i===j) return;
    setTiles(prev=>{ const next=[...prev]; [next[i],next[j]]=[next[j],next[i]]; return next.map((t,idx)=>({...t,index:idx}));});
    setMoves(m=>m+1);
  }
  function onDragStart(e,i){ e.dataTransfer.setData("text/plain",String(i)); }
  function onDrop(e,j){ e.preventDefault(); const i=Number(e.dataTransfer.getData("text/plain")); swap(i,j); }
  function onDragOver(e){ e.preventDefault(); }
  function handleClick(i){ setSelected(sel=> sel==null ? i : (swap(sel,i), null)); }
  function reset(){ setTiles(shuffle(baseTiles)); setMoves(0); setSelected(null); }

  return (
    <div ref={wrapRef} className="pzl-wrap" style={{ width: size.w, height: size.h }}>
      <div className="pzl-toolbar">
        <button onClick={reset}>Mezclar</button>
        <span>Movimientos: {moves}</span>
        {solved && <span className="ok">¡Completado! 🎉</span>}
      </div>

      <div className="pzl-board" style={{ width: size.w, height: size.h }} role="grid">
        {tiles.map((t,curPos)=>{
          const row=Math.floor(t.correctIndex/COLS), col=t.correctIndex%COLS;
          const wPct=100/COLS, hPct=100/ROWS;
          const bgPosX=(col/(COLS-1))*100, bgPosY=(row/(ROWS-1))*100;
          return (
            <div key={curPos}
                 className={`pzl-tile ${selected===curPos?'sel':''}`}
                 draggable
                 onDragStart={(e)=>onDragStart(e,curPos)}
                 onDrop={(e)=>onDrop(e,curPos)}
                 onDragOver={onDragOver}
                 onClick={()=>handleClick(curPos)}
                 style={{
                   width:`${wPct}%`, height:`${hPct}%`,
                   backgroundImage:`url(${image})`,
                   backgroundSize:`${COLS*100}% ${ROWS*100}%`,
                   backgroundPosition:`${bgPosX}% ${bgPosY}%`,
                 }}/>
          );
        })}
      </div>
    </div>
  );
}


