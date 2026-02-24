function normalize(str){ return (str || "").toString().trim().toLowerCase(); }

function teamKey(team){
  const t = normalize(team);
  if(t.includes("alpha")) return "alpha";
  if(t.includes("bravo")) return "bravo";
  return "joker";
}

function medalClass(rank){
  if(rank === 1) return "gold";
  if(rank === 2) return "silver";
  if(rank === 3) return "bronze";
  return "";
}

function renderRows(containerId, list, valueKey, label){
  const el = document.getElementById(containerId);
  const top = [...list]
    .sort((a,b)=> (Number(b[valueKey])||0) - (Number(a[valueKey])||0) || a.name.localeCompare(b.name))
    .slice(0, 10);

  el.innerHTML = top.map((p, i) => {
    const rank = i + 1;
    const tKey = teamKey(p.team);
    const val = Number(p[valueKey]) || 0;

    return `
      <div class="hof-row ${tKey}">
        <div class="hof-rank ${medalClass(rank)}">#${rank}</div>

        <div class="hof-main">
          <div class="hof-name">${p.name}</div>
          <div class="hof-meta">
            <span class="hof-team ${tKey}">${p.team || "Joker"}</span>
          </div>
        </div>

        <div class="hof-value">
          <div class="hof-number">${val}</div>
          <div class="hof-label">${label}</div>
        </div>
      </div>
    `;
  }).join("") || `<div class="muted">Keine Daten.</div>`;
}

function renderPodium(list){
  const el = document.getElementById("podium");
  const top3 = [...list]
    .sort((a,b)=> (Number(b.maxAllTimeSkillsTotal)||0) - (Number(a.maxAllTimeSkillsTotal)||0) || a.name.localeCompare(b.name))
    .slice(0,3);

  if(top3.length === 0){
    el.innerHTML = `<div class="muted">Keine Daten.</div>`;
    return;
  }

  // Order visually as 2-1-3 (nice podium layout)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);

  el.innerHTML = order.map((p, idx) => {
    // actual rank based on original top3
    const actualRank = top3.findIndex(x => x && x.name === p.name) + 1;
    const tKey = teamKey(p.team);
    const val = Number(p.maxAllTimeSkillsTotal) || 0;

    return `
      <div class="podium-card ${tKey} ${medalClass(actualRank)} rank-${actualRank}">
        <div class="podium-medal">${actualRank === 1 ? "🥇" : actualRank === 2 ? "🥈" : "🥉"}</div>
        <div class="podium-name">${p.name}</div>
        <div class="podium-team ${tKey}">${p.team || "Joker"}</div>

        <div class="podium-score">
          <div class="podium-number">${val}</div>
          <div class="podium-label">All-Time Skills</div>
        </div>
      </div>
    `;
  }).join("");
}

fetch("hof.json", { cache:"no-store" })
  .then(r => r.json())
  .then(hof => {
    const updatedEl = document.getElementById("hof-updated");
    if(updatedEl && hof.updatedAt){
      updatedEl.textContent = `Bestwerte · permanent · zuletzt aktualisiert: ${hof.updatedAt}`;
    }

    const players = hof.players || [];

    // Podium based on All-Time Skills total
    renderPodium(players);

    // Rankings
    renderRows("hof-level", players, "maxLevel", "Level");
    renderRows("hof-challenges", players, "maxChallenges", "Siege");
    renderRows("hof-alltime", players, "maxAllTimeSkillsTotal", "Punkte");
  })
  .catch(err => console.error(err));
