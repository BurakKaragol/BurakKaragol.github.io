// DnD-style dice roller
// Square gradient dice, presets cross-table, one-click add buttons
// Left click die -> reroll that die
// Right click die -> delete that die
// Stats: Total / Highest / Lowest / Average
// All dice: 1 = crit fail (red), max = crit success (green), persistent until reroll

(function () {
  const diceGrid = document.getElementById("dice-grid");
  const totalSumEl = document.getElementById("total-sum");
  const summaryDetailEl = document.getElementById("summary-detail");
  const highestEl = document.getElementById("highest-value");
  const lowestEl = document.getElementById("lowest-value");
  const averageEl = document.getElementById("average-value");

  const rollAllBtn = document.getElementById("roll-all-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const clearAllTopBtn = document.getElementById("clear-all-top-btn");

  const addDieButtons = Array.from(
    document.querySelectorAll(".add-die-btn[data-sides]")
  );
  const presetRow = document.getElementById("preset-row");

  let dice = [];
  let nextId = 1;
  let isRolling = false;

  const sidesList = [4, 6, 8, 10, 12, 20, 100];

  // ---------- Helpers ----------

  function createDie(sides) {
    return {
      id: nextId++,
      sides,
      value: null,
    };
  }

  function rollDieValue(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function formatSummary(diceList) {
    if (diceList.length === 0) return "No dice yet.";
    const byType = new Map();
    diceList.forEach((d) => {
      const key = `d${d.sides}`;
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key).push(d.value ?? "–");
    });

    const parts = [];
    for (const [type, values] of byType.entries()) {
      parts.push(`${values.length}${type}: [${values.join(", ")}]`);
    }
    return parts.join("  |  ");
  }

  function updateStats() {
    const numericValues = dice
      .map((d) => d.value)
      .filter((v) => typeof v === "number");

    if (numericValues.length === 0) {
      totalSumEl.textContent = "0";
      highestEl.textContent = "–";
      lowestEl.textContent = "–";
      averageEl.textContent = "–";
      return;
    }

    const total = numericValues.reduce((sum, v) => sum + v, 0);
    const highest = Math.max(...numericValues);
    const lowest = Math.min(...numericValues);
    const avg = total / numericValues.length;

    totalSumEl.textContent = String(total);
    highestEl.textContent = String(highest);
    lowestEl.textContent = String(lowest);
    averageEl.textContent = avg.toFixed(1);
  }

  function updateSummary() {
    updateStats();
    summaryDetailEl.textContent = formatSummary(dice);
  }

  function removeDie(id) {
    dice = dice.filter((d) => d.id !== id);
    render();
  }

  function clearAllDice() {
    dice = [];
    render();
  }

  function clearCritState(card) {
    if (!card) return;
    card.classList.remove("crit-success", "crit-fail");
  }

  // All dice types:
  // 1 = crit fail, max value = crit success
  // classes persist until reroll / clear
  function applyCritState(die, card) {
    if (!card || typeof die.value !== "number") return;

    clearCritState(card);

    if (die.value === 1) {
      card.classList.add("crit-fail");
    } else if (die.value === die.sides) {
      card.classList.add("crit-success");
    }
  }

  function rollSingleDie(die) {
    if (!die) return;
    die.value = rollDieValue(die.sides);

    const card = diceGrid.querySelector(`.die-card[data-id="${die.id}"]`);
    if (card) {
      const valueEl = card.querySelector(".die-value");
      if (valueEl) valueEl.textContent = die.value;

      // clear old crit state before applying new one
      clearCritState(card);

      // base roll jiggle
      card.classList.add("rolling");
      setTimeout(() => {
        card.classList.remove("rolling");
      }, 300);

      // crit state for any die type - stays until next reroll
      applyCritState(die, card);
    }

    updateSummary();
  }

  function render() {
    diceGrid.innerHTML = "";
    dice.forEach((die) => {
      const card = document.createElement("div");
      card.className = `die-card die-card--d${die.sides}`;
      card.dataset.id = String(die.id);

      const label = document.createElement("div");
      label.className = "die-label";
      label.textContent = `d${die.sides}`;

      const valueEl = document.createElement("div");
      valueEl.className = "die-value";
      valueEl.textContent = die.value == null ? "–" : die.value;

      // Left click: reroll this die
      card.addEventListener("click", (e) => {
        if (e.button !== 0) return;
        rollSingleDie(die);
      });

      // Right click: delete this die
      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        removeDie(die.id);
      });

      // If dice already had a value when re-rendering (e.g. presets then rerender),
      // re-apply crit visuals
      if (typeof die.value === "number") {
        applyCritState(die, card);
      }

      card.appendChild(label);
      card.appendChild(valueEl);
      diceGrid.appendChild(card);
    });

    updateSummary();
  }

  // ---------- Rolling ----------

  function rollAll() {
    if (dice.length === 0 || isRolling) return;
    isRolling = true;

    const cards = Array.from(document.querySelectorAll(".die-card"));
    cards.forEach((card) => {
      clearCritState(card);
      card.classList.add("rolling");
    });

    dice.forEach((die) => {
      const delay = 80 + Math.random() * 200;
      setTimeout(() => {
        die.value = rollDieValue(die.sides);
        const card = diceGrid.querySelector(
          `.die-card[data-id="${die.id}"]`
        );
        if (!card) return;
        const valueEl = card.querySelector(".die-value");
        if (valueEl) valueEl.textContent = die.value;

        // crit animations (all dice) - persistent
        applyCritState(die, card);
      }, delay);
    });

    setTimeout(() => {
      cards.forEach((card) => card.classList.remove("rolling"));
      isRolling = false;
      updateSummary();
    }, 450);
  }

  // ---------- Presets (cross-table) ----------

  function applyPreset(presetStr) {
    // e.g. "2d6"
    const match = presetStr.match(/^(\d+)d(\d+)$/i);
    if (!match) return;
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    if (!count || !sides) return;

    dice = [];
    for (let i = 0; i < count; i++) {
      dice.push(createDie(sides));
    }
    render();
  }

  function buildPresetButtons() {
    presetRow.innerHTML = "";

    // Header row: dice types
    const headerRow = document.createElement("div");
    headerRow.className = "preset-row-line preset-row-header";

    const spacer = document.createElement("div");
    spacer.className = "preset-row-label";
    spacer.textContent = "#";
    headerRow.appendChild(spacer);

    sidesList.forEach((sides) => {
      const head = document.createElement("div");
      head.className = "preset-header-cell";
      head.textContent = `d${sides}`;
      headerRow.appendChild(head);
    });

    presetRow.appendChild(headerRow);

    // Rows: counts 1–4
    for (let count = 1; count <= 4; count++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "preset-row-line";

      const label = document.createElement("div");
      label.className = "preset-row-label";
      label.textContent = `${count}×`;
      rowDiv.appendChild(label);

      sidesList.forEach((sides) => {
        const preset = `${count}d${sides}`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "preset-btn";
        btn.textContent = preset;
        btn.dataset.preset = preset;
        btn.addEventListener("click", () => {
          applyPreset(preset);
        });
        rowDiv.appendChild(btn);
      });

      presetRow.appendChild(rowDiv);
    }
  }

  // ---------- Event bindings ----------

  addDieButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sides = parseInt(btn.dataset.sides || "0", 10);
      if (!sides) return;
      dice.push(createDie(sides));
      render();
    });
  });

  rollAllBtn.addEventListener("click", rollAll);

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      clearAllDice();
    });
  }

  if (clearAllTopBtn) {
    clearAllTopBtn.addEventListener("click", () => {
      clearAllDice();
    });
  }

  // Space key -> roll all
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      rollAll();
    }
  });

  // ---------- Init ----------

  buildPresetButtons();
  // Default starting setup: 2d6
  applyPreset("2d6");
})();
