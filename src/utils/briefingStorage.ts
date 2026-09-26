const TODAY_KEY = 'altavik_briefing_shown_date';

/** Devuelve true si el briefing ya se mostró hoy */
export function briefingShownToday(): boolean {
  return localStorage.getItem(TODAY_KEY) === new Date().toDateString();
}

/** Marca el briefing como mostrado hoy */
export function markBriefingShown(): void {
  localStorage.setItem(TODAY_KEY, new Date().toDateString());
}
