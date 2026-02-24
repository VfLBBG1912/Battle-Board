function normalize(str){ return (str || "").toString().trim().toLowerCase(); }

function deriveLevel(xp, levelXP){
  const x = Math.max(0, Number(xp) || 0);
  const t = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];
  let idx = 0;
  for(let i=0;i<t.length;i++){
    if(x >= t[i]) idx = i;
  }
  return idx + 1;
}

function allTimeTotal(p){
  const a = p.allTimeSkills || {};
  return (Number(a.DEF)||0) + (Number(a.TOR)||0) + (Number(a.MAS)||0) + (Number(a.ANF)||0) + (Number(a.PLY)||0);
}

function teamClass(team){
  const t = normalize(team);
  if(t.includes("alpha")) return "alpha";
  if(t.includes("bravo")) return "bravo";
  return "joker";
}

function renderList(elId, list, valueFn, valueLabelFn){
  const el = document.getElementById(elId);
  const top = [...list]
    .sort((a,b)=> valueFn(b)-valueFn(a) || a.name.localeCompare(b.name))
    .slice(0,10);

  el.innerHTML = top.map((p,i)=> `
    <div class="mini-row">
      <div class="mini-left">
        <span class="rank">#${i+1}</span>
        <span class="mini-name">${p.name}</span>
        <span class="mini-team ${teamClass(p.team)}">${p.team || "Joker"}</span>
      </div>
      <div class="mini-val">${valueLabelFn(p)}</div>
    </div>
  `).join("") || `<div class="muted">Keine Daten.</div>`;
}

fetch("data.json", { cache:"no-store" })
  .then(r=>r.json())
  .then(data=>{
    const players = data.players || [];
    const levelXP = data.levelXP || [0,100];

    // ⭐ Höchstes Level
    renderList("hof-level", players,
      (p)=> deriveLevel(p.xp, levelXP),
      (p)=> `Level ${deriveLevel(p.xp, levelXP)}`
    );

    // 🎯 Gewonnene Challenges
    renderList("hof-challenges", players,
      (p)=> Number(p.challengeWins)||0,
      (p)=> `${Number(p.challengeWins)||0} Siege`
    );

    // 🏅 All-Time Skills (Gesamt)
    renderList("hof-alltime-total", players,
      (p)=> allTimeTotal(p),
      (p)=> `${allTimeTotal(p)} Punkte`
    );
  })
  .catch(err => console.error(err));
