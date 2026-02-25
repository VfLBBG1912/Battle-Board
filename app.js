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

function pct(a, b){
  const sum = (Number(a)||0) + (Number(b)||0);
  if(sum <= 0) return 0;
  return Math.round(((Number(a)||0) / sum) * 100);
}

function teamKey(name){
  const t = normalize(name);
  if(t.includes("alpha")) return "alpha";
  if(t.includes("bravo")) return "bravo";
  return "joker";
}

function sumSeasonSkills(p){
  const s = p.seasonSkills || {};
  return (Number(s.DEF)||0) + (Number(s.TOR)||0) + (Number(s.MAS)||0) + (Number(s.ANF)||0) + (Number(s.PLY)||0);
}

function renderTopList(containerId, players, valueFn, labelFn){
  const el = document.getElementById(containerId);
  const sorted = [...players]
    .sort((a,b)=> valueFn(b) - valueFn(a) || a.name.localeCompare(b.name))
    .slice(0,5);

  el.innerHTML = sorted.map((p,i)=> `
    <div class="mini-row">
      <div class="mini-left">
        <span class="rank">#${i+1}</span>
        <span class="mini-name">${p.name}</span>
        <span class="mini-team ${teamKey(p.team)}">${p.team || "Joker"}</span>
      </div>
      <div class="mini-val">${labelFn(p)}</div>
    </div>
  `).join("") || `<div class="muted">Keine Daten.</div>`;
}

/* ---------------- Feed helpers ---------------- */

function parseTs(ts){
  const d = ts ? new Date(ts) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

function fmtDate(d){
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth()+1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

function feedIcon(item){
  const ev = normalize(item.event);
  if(ev === "win") return "⚔️";
  if(ev === "draw") return "🤝";
  if(ev === "challenge") return "🎯";
  return "📝";
}

function scopeLabel(scope){
  const s = normalize(scope);
  if(s === "training") return "Training";
  if(s === "match") return "Spiel";
  if(s === "private") return "Private";
  return "Event";
}

function normalizeRecent(raw){
  // Backward compatible: Strings -> objects
  if(!Array.isArray(raw)) return [];
  return raw.map(x=>{
    if(typeof x === "string"){
      return { ts: new Date().toISOString(), scope:"training", event:"win", text:x, points:null };
    }
    const obj = x || {};
    return {
      ts: obj.ts || obj.date || new Date().toISOString(),
      scope: obj.scope || "training",
      event: obj.event || "win",
      text: obj.text || "",
      points: (obj.points === 0 || obj.points) ? Number(obj.points) : null
    };
  });
}

function renderFeed(container, recent){
  const items = normalizeRecent(recent)
    .sort((a,b)=> parseTs(b.ts) - parseTs(a.ts)); // newest first

  if(!items.length){
    container.innerHTML = `<div class="muted">Noch keine Updates.</div>`;
    return;
  }

  container.innerHTML = items.map(it=>{
    const d = parseTs(it.ts);
    const dateStr = fmtDate(d);
    const icon = feedIcon(it);
    const scope = normalize(it.scope);
    const badge = scopeLabel(scope);
    const pts = (it.points === 0 || it.points) ? `+${it.points}` : "";

    return `
      <div class="feed-item feed-${scope}">
        <div class="feed-left">
          <div class="feed-icon">${icon}</div>
        </div>
        <div class="feed-mid">
          <div class="feed-topline">
            <span class="feed-date">${dateStr}</span>
            <span class="feed-badge feed-badge-${scope}">${badge}</span>
          </div>
          <div class="feed-text">${it.text} ${pts ? `<span class="feed-points">${pts}</span>` : ""}</div>
        </div>
      </div>
    `;
  }).join("");
}

fetch("data.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    document.getElementById("cycle-info").textContent =
      `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;
    document.getElementById("cycle-pill").textContent = data.cycle.name;

    const teams = data.teams || [];
    const players = data.players || [];

    const totalXP = players.reduce((s,p)=> s + (Number(p.xp)||0), 0);
    const avgXP = players.length ? Math.round(totalXP / players.length) : 0;

    document.getElementById("dash-subtitle").textContent =
      `${players.length} Spieler · Ø ${avgXP} XP · ${teams.map(t=>t.name).join(" vs ")}`;

    const teamA = teams[0] || { name:"Team A", points:0 };
    const teamB = teams[1] || { name:"Team B", points:0 };

    const aPct = pct(teamA.points, teamB.points);
    const bPct = 100 - aPct;

    const teamContainer = document.getElementById("team-container");

    const teamCard = (team, percent) => {
      const tKey = teamKey(team.name);
      return `
        <div class="team-card ${tKey}">
          <div class="team-top">
            <div>
              <div class="team-name">${team.name}</div>
              <div class="team-points-label">Team-Punkte (Cycle)</div>
            </div>
            <div style="text-align:right">
              <div class="team-points-big">${team.points ?? 0}</div>
            </div>
          </div>
          <div class="xpbar"><div class="xpfill" style="width:${percent}%"></div></div>
          <div class="small">Anteil am Gesamtstand: ${percent}%</div>
        </div>
      `;
    };

    teamContainer.innerHTML = teamCard(teamA, aPct) + teamCard(teamB, bPct);

    renderTopList(
      "top-level",
      players,
      (p)=> deriveLevel(p.xp, data.levelXP),
      (p)=> `Level ${deriveLevel(p.xp, data.levelXP)}`
    );

    renderTopList(
      "top-season-skills",
      players,
      (p)=> sumSeasonSkills(p),
      (p)=> `${sumSeasonSkills(p)} Season-Skills`
    );

    renderTopList(
      "top-challenges",
      players,
      (p)=> Number(p.challengeWins)||0,
      (p)=> `${Number(p.challengeWins)||0} Siege`
    );

    // Feed
    const updatesContainer = document.getElementById("updates-container");
    renderFeed(updatesContainer, data.recent || []);
  })
  .catch(err => console.error(err));
