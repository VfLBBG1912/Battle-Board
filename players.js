function stars(n, max = 5) {
  const v = Math.max(0, Math.min(Number(n) || 0, max));
  return "★".repeat(v) + "☆".repeat(max - v);
}

function normalize(str){
  return (str || "").toString().trim().toLowerCase();
}

function sortPlayers(players, mode){
  const p = [...players];
  if(mode === "xp"){
    return p.sort((a,b)=> (b.xp||0)-(a.xp||0) || (b.level||0)-(a.level||0) || a.name.localeCompare(b.name));
  }
  if(mode === "challenges"){
    return p.sort((a,b)=> (b.challengeWins||0)-(a.challengeWins||0) || (b.level||0)-(a.level||0) || a.name.localeCompare(b.name));
  }
  if(mode === "seasonStars"){
    return p.sort((a,b)=> (b.seasonStars||0)-(a.seasonStars||0) || (b.level||0)-(a.level||0) || a.name.localeCompare(b.name));
  }
  return p.sort((a,b)=> (b.level||0)-(a.level||0) || (b.xp||0)-(a.xp||0) || a.name.localeCompare(b.name));
}

// Level Progress Helper (Variante B)
function levelProgress(xp, levelXP){
  const x = Math.max(0, Number(xp) || 0);
  const thresholds = Array.isArray(levelXP) && levelXP.length >= 2 ? levelXP : [0, 100];

  let idx = 0;
  for(let i=0; i<thresholds.length; i++){
    if(x >= thresholds[i]) idx = i;
  }

  const level = idx + 1;
  const curStart = thresholds[idx];
  const nextStart = thresholds[idx + 1];

  if(nextStart === undefined){
    return {
      level,
      curStart,
      nextStart: curStart,
      inLevel: 0,
      need: 0,
      pct: 100,
      maxed: true
    };
  }

  const span = Math.max(1, nextStart - curStart);
  const inLevel = x - curStart;
  const need = Math.max(0, nextStart - x);
  const pct = Math.max(0, Math.min(100, Math.round((inLevel / span) * 100)));

  return { level, curStart, nextStart, inLevel, need, pct, maxed: false };
}

fetch("data.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    const cycleInfo = document.getElementById("cycle-info");
    if(cycleInfo){
      cycleInfo.textContent = `${data.cycle.name} | ${data.cycle.start} - ${data.cycle.end}`;
    }

    const container = document.getElementById("players-page-container");
    const search = document.getElementById("player-search");
    const sort = document.getElementById("sort");

    const render = () => {
      const term = normalize(search.value);
      const sorted = sortPlayers(data.players || [], sort.value);
      const filtered = sorted.filter(p => normalize(p.name).includes(term));

      container.innerHTML = filtered.map(p => {
        const s = p.skills || {};
        const xp = Number(p.xp) || 0;

        // Progress inside level
        const prog = levelProgress(xp, data.levelXP);
        const shownLevel = prog.level;
        const levelSpan = Math.max(1, prog.nextStart - prog.curStart);

        // Team-Klasse für Farben
        const teamName = (p.team || "").toLowerCase();
        let teamClass = "team-joker";
        if (teamName.includes("alpha")) teamClass = "team-alpha";
        else if (teamName.includes("bravo")) teamClass = "team-bravo";

        return `
          <div class="player ${teamClass}">
            <div>
              <strong>${p.name}</strong>
              <span class="badge2 ${teamClass}">Team ${p.team || "-"}</span>
            </div>

            <div class="badges">
              <span class="badge2">Level ${shownLevel}</span>
              <span class="badge2">${xp} XP</span>
              <span class="badge2">Challenge Siege: ${p.challengeWins ?? 0}</span>
              <span class="badge2">Season ⭐: ${p.seasonStars ?? 0}</span>
            </div>

            <div class="xpbar"><div class="xpfill" style="width:${prog.pct}%"></div></div>
            <div class="small" style="opacity:.85">
              ${prog.maxed
                ? `Max Level erreicht ✅`
                : `Level-Fortschritt: ${prog.pct}% · ${prog.inLevel} / ${levelSpan} XP (noch ${prog.need} XP bis Level ${shownLevel + 1})`}
            </div>

            <div class="badges">
              <span class="badge2">🧱 DEF <span class="stars">${stars(s.DEF)}</span></span>
              <span class="badge2">⚡ ANG <span class="stars">${stars(s.ANG)}</span></span>
              <span class="badge2">🫀 AUS <span class="stars">${stars(s.AUS)}</span></span>
              <span class="badge2">🧠 INT <span class="stars">${stars(s.INT)}</span></span>
              <span class="badge2">🔥 MEN <span class="stars">${stars(s.MEN)}</span></span>
            </div>
          </div>
        `;
      }).join("") || `<p>Keine Spieler gefunden.</p>`;
    };

    search.addEventListener("input", render);
    sort.addEventListener("change", render);

    render();
  })
  .catch(err => console.error(err));
