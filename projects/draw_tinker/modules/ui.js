export function setupUI(onModeChange, onToggleGrid, onToggleSnap) {
    const modeButtons = document.querySelectorAll('.modeBtn');
    modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        onModeChange(button.dataset.mode);
      });
    });
  
    const gridBtn = document.getElementById('toggleGrid');
    const snapBtn = document.getElementById('toggleSnap');
  
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.toggle('active');
      onToggleGrid();
    });
  
    snapBtn.addEventListener('click', () => {
      snapBtn.classList.toggle('active');
      onToggleSnap();
    });
  }
  