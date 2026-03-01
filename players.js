function normalize(str){ return (str || "").toString().trim().toLowerCase(); }

function teamKey(team){
  const t = normalize(team);
  if(t.includes("alpha")) return "alpha";
  if(t.includes("bravo")) return "bravo";
  return "joker";
}

function deriveLevel(xp, levelXP){
  const x = Math.max(0, Number(xp) || 0);
  const t = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];
  let idx = 0;
  for(let i=0;i<t.length;i++){
    if(x >= t[i]) idx = i;
  }
  return idx + 1;
}

function levelProgress(xp, levelXP){
  const x = Math.max(0, Number(xp) || 0);
  const t = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];
  let levelIdx = 0;
  for(let i=0;i<t.length;i++){
    if(x >= t[i]) levelIdx = i;
  }
  const cur = t[levelIdx] ?? 0;
  const next = t[levelIdx + 1] ?? (cur + 100);
  const span = Math.max(1, next - cur);
  const pct = Math.max(0, Math.min(100, Math.round(((x - cur) / span) * 100)));
  return { pct, cur, next };
}

function sumSeasonSkills(p){
  const s = p.seasonSkills || {};
  return (Number(s.DEF)||0)+(Number(s.TOR)||0)+(Number(s.MAS)||0)+(Number(s.ANF)||0)+(Number(s.PLY)||0);
}

function sumAllTimeSkills(p){
  const a = p.allTimeSkills || {};
  return (Number(a.DEF)||0)+(Number(a.TOR)||0)+(Number(a.MAS)||0)+(Number(a.ANF)||0)+(Number(a.PLY)||0);
}

function stars(n){
  const x = Math.max(0, Math.min(5, Number(n)||0));
  return "★★★★★".slice(0,x) + "☆☆☆☆☆".slice(0,5-x);
}

function initials(name){
  const parts = (name||"").trim().split(/\s+/).filter(Boolean);
  const a = (parts[0]||"").slice(0,1).toUpperCase();
  const b = (parts[1]||"").slice(0,1).toUpperCase();
  return (a + b) || "P";
}

let STATE = {
  teamFilter: "all",
  query: "",
  sort: "level",
};

function sortPlayers(list, levelXP){
  const s = STATE.sort;

  const keyFns = {
    name: (p)=> (p.name||""),
    xp: (p)=> Number(p.xp)||0,
    level: (p)=> deriveLevel(p.xp, levelXP),
    challenges: (p)=> Number(p.challengeWins)||0,
    skillsSeason: (p)=> sumSeasonSkills(p),
    skillsAllTime: (p)=> sumAllTimeSkills(p)
  };

  const k = keyFns[s] || keyFns.level;
  const desc = (s !== "name");

  return [...list].sort((a,b)=>{
    const av = k(a);
    const bv = k(b);
    if(typeof av === "string") return av.localeCompare(bv);
    return desc ? (bv - av) : (av - bv);
  });
}

function applyFilters(players){
  let list = [...players];

  if(STATE.teamFilter !== "all"){
    list = list.filter(p => (p.team||"Joker") === STATE.teamFilter);
  }

  const q = normalize(STATE.query);
  if(q){
    list = list.filter(p => normalize(p.name).includes(q));
  }

  return list;
}

function render(players, levelXP, cycle){
  const container = document.getElementById("players-page-container");
  const filtered = sortPlayers(applyFilters(players), levelXP);

  const groups = [
    { name: "Alpha Team", key: "alpha" },
    { name: "Team Bravo", key: "bravo" },
    { name: "Joker", key: "joker" }
  ];

  const byTeam = (teamName)=> filtered.filter(p => (p.team||"Joker") === teamName);

  const groupHtml = groups.map(g=>{
    const list = byTeam(g.name);
    if(STATE.teamFilter !== "all" && STATE.teamFilter !== g.name) return "";
    if(!list.length) return "";

    return `
      <div class="group">
        <div class="group-head">
          <h3>${g.name}</h3>
          <div class="group-pill">${list.length} Spieler</div>
        </div>
        <div class="fut-grid">
          ${list.map(p => futCard(p, levelXP)).join("")}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = groupHtml || `<div class="muted">Keine Spieler gefunden.</div>`;

  const summary = document.getElementById("players-summary");
  if(summary && cycle){
    summary.textContent = `${players.length} Spieler · ${cycle.name} (${cycle.start}–${cycle.end})`;
  }
}

function futCard(p, levelXP){
  const tKey = teamKey(p.team);
  const lvl = deriveLevel(p.xp, levelXP);
  const xp = Number(p.xp)||0;
  const cw = Number(p.challengeWins)||0;
  const sTot = sumSeasonSkills(p);
  const aTot = sumAllTimeSkills(p);
  const prog = levelProgress(p.xp, levelXP);

  const s = p.seasonSkills || {DEF:0,TOR:0,MAS:0,ANF:0,PLY:0};
  const a = p.allTimeSkills || {DEF:0,TOR:0,MAS:0,ANF:0,PLY:0};

  const photo = (p.photo || "").trim();
  const photoHtml = photo
    ? `<img class="fut-photo" src="${photo}" alt="${p.name}" loading="lazy"
         onerror="this.outerHTML='<div class=&quot;fut-photo fallback&quot;>${initials(p.name)}</div>'" />`
    : `<div class="fut-photo fallback">${initials(p.name)}</div>`;

  return `
    <div class="fut-card ${tKey}">
      <div class="fut-shine"></div>

      <div class="fut-top">
        <div class="fut-rating">
          <div class="fut-lvl">${lvl}</div>
          <div class="fut-lbl">LEVEL</div>
        </div>

        <div class="fut-portrait">
          ${photoHtml}
          <div class="fut-teambadge ${tKey}">${p.team || "Joker"}</div>
        </div>
      </div>

      <div class="fut-name">${p.name}</div>

      <div class="fut-stats">
        <div class="fut-stat"><div class="k">XP</div><div class="v">${xp}</div></div>
        <div class="fut-stat"><div class="k">CHAL</div><div class="v">${cw}</div></div>
        <div class="fut-stat"><div class="k">SEASON</div><div class="v">${sTot}</div></div>
        <div class="fut-stat"><div class="k">ALL-TIME</div><div class="v">${aTot}</div></div>
      </div>

      <div class="fut-bar"><div class="fut-barfill" style="width:${prog.pct}%"></div></div>
      <div class="fut-bartext">XP bis nächstes Level: ${Math.max(0, (prog.next - xp))}</div>

      <div class="fut-skills">
        <div class="fut-skill-row">
          <span class="tag">Season</span>
          <span class="stars season">${stars(s.DEF)}</span><span class="mini">DEF</span>
          <span class="stars season">${stars(s.TOR)}</span><span class="mini">TOR</span>
          <span class="stars season">${stars(s.MAS)}</span><span class="mini">MAS</span>
          <span class="stars season">${stars(s.ANF)}</span><span class="mini">ANF</span>
          <span class="stars season">${stars(s.PLY)}</span><span class="mini">PLY</span>
        </div>

        <div class="fut-skill-row">
          <span class="tag">All-Time</span>
          <span class="stars alltime">${stars(a.DEF)}</span><span class="mini">DEF</span>
          <span class="stars alltime">${stars(a.TOR)}</span><span class="mini">TOR</span>
          <span class="stars alltime">${stars(a.MAS)}</span><span class="mini">MAS</span>
          <span class="stars alltime">${stars(a.ANF)}</span><span class="mini">ANF</span>
          <span class="stars alltime">${stars(a.PLY)}</span><span class="mini">PLY</span>
        </div>
      </div>
    </div>
  `;
}

function setActiveTeamChip(team){
  document.querySelectorAll(".chip[data-team]").forEach(btn=>{
    btn.classList.toggle("active", btn.getAttribute("data-team") === team);
  });
}

fetch("data.json", { cache:"no-store" })
  .then(r=>r.json())
  .then(data=>{
    const ci = document.getElementById("cycle-info");
    if(ci && data.cycle){
      ci.textContent = `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;
    }

    const players = data.players || [];
    const levelXP = data.levelXP || [0,100];
    const cycle = data.cycle || null;

    document.getElementById("player-search").addEventListener("input", (e)=>{
      STATE.query = e.target.value || "";
      render(players, levelXP, cycle);
    });

    document.getElementById("sort").addEventListener("change", (e)=>{
      STATE.sort = e.target.value;
      render(players, levelXP, cycle);
    });

    document.querySelectorAll(".chip[data-team]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        STATE.teamFilter = btn.getAttribute("data-team");
        setActiveTeamChip(STATE.teamFilter);
        render(players, levelXP, cycle);
      });
    });

    setActiveTeamChip("all");
    render(players, levelXP, cycle);
  })
  .catch(err=>console.error(err));
