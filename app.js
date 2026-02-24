function normalize(str){
  return (str || "").toString().trim().toLowerCase();
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

fetch("data.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    // Cycle info
    const cycleInfo = document.getElementById("cycle-info");
    if(cycleInfo){
      cycleInfo.textContent = `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;
    }
    document.getElementById("cycle-pill").textContent = data.cycle.name;

    const teams = data.teams || [];
    const players = data.players || [];

    // Dashboard subtitle
    const totalXP = players.reduce((s,p)=> s + (Number(p.xp)||0), 0);
    const avgXP = players.length ? Math.round(totalXP / players.length) : 0;
    document.getElementById("dash-subtitle").textContent =
      `${players.length} Spieler · Ø ${avgXP} XP · Teams: ${teams.map(t=>t.name).join(" vs ")}`;

    // Team stand
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
            <div class="team-name">${team.name}</div>
            <div class="team-points">${team.points ?? 0} Punkte</div>
          </div>
          <div class="xpbar"><div class="xpfill" style="width:${percent}%"></div></div>
          <div class="small">Anteil am Gesamtstand: ${percent}%</div>
        </div>
      `;
    };

    teamContainer.innerHTML =
      teamCard(teamA, aPct) + teamCard(teamB, bPct);

    // Top lists
    renderTopList(
      "top-level",
      players,
      (p)=> deriveLevel(p.xp, data.levelXP),
      (p)=> `Level ${deriveLevel(p.xp, data.levelXP)}`
    );

    renderTopList(
      "top-xp",
      players,
      (p)=> Number(p.xp)||0,
      (p)=> `${Number(p.xp)||0} XP`
    );

    renderTopList(
      "top-challenges",
      players,
      (p)=> Number(p.challengeWins)||0,
      (p)=> `${Number(p.challengeWins)||0} Siege`
    );

    // Updates feed
    const updates = data.recent || [];
    const updatesContainer = document.getElementById("updates-container");

    if(!updates.length){
      updatesContainer.innerHTML = `<div class="muted">Noch keine Updates.</div>`;
    }else{
      updatesContainer.innerHTML = updates.map(u => `
        <div class="feed-item">
          <div class="feed-date">${u.date || ""}</div>
          <div class="feed-text">${u.text || ""}</div>
        </div>
      `).join("");
    }
  })
  .catch(err => {
    console.error(err);
    document.getElementById("dash-subtitle").textContent = "Fehler beim Laden der Daten.";
  });
