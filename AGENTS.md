# Reglas y Directivas del Proyecto Lubens Arroyo CRM

Este archivo contiene las directivas obligatorias y recurrentes que el asistente de IA (Antigravity) debe cumplir siempre que trabaje en este proyecto.

---

## 🩺 1. Auditoría Obligatoria y Directrices de React Doctor
- **Cumplimiento Estricto:** Siempre que se desarrolle cualquier cambio, corrección o nueva funcionalidad, debe hacerse siguiendo las normas y recomendaciones de **React Doctor**.
- **Verificación de Regresiones:** Tras cada cambio en código React, ejecutar:
  ```bash
  npm run doctor -- --scope changed --verbose
  ```
  y verificar que el Health Score no disminuya.
- **Triage por Severidad:**
  1. **Errores (`Errors`):** Deben resolverse de forma inmediata y prioritaria (Bugs, Seguridad, Accesibilidad crítica, actualizadores impuros de estado `no-impure-state-updater`, suscripciones sin limpieza `effect-needs-cleanup`).
  2. **Advertencias (`Warnings`):** Corregir dependencias de efectos (`exhaustive-deps`), etiquetas accesibles en controles (`label-has-associated-control`), etc.
- **No introducir efectos secundarios en state updaters:** Los callbacks pasados a `setState(prev => ...)` deben ser funciones puras sin llamadas anidadas a otros `set*()`.

---

## 🚀 2. Comprobación de Calidad y TypeScript
- **Cero Errores de Tipado:** Verificar tras cada modificación con:
  ```bash
  npx tsc --noEmit
  ```
  Asegurar 0 errores de compilación o tipado estricto.

---

## 📦 3. Sincronización y Git
- Cuando todos los cambios estén completados, tipados y validados con React Doctor, realizar el commit descriptivo y `git push origin main`.
